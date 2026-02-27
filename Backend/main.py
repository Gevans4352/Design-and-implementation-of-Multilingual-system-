import os
import json
import sqlite3
from datetime import datetime
from typing import List, Optional

import uvicorn
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from databases import Database
import aiosqlite
from transformers import pipeline  # NLLB translation model

try:
    from deep_translator import GoogleTranslator
    _have_translator = True
except ImportError:
    _have_translator = False


# Pydantic models
class UserAuth(BaseModel):
    email: str
    password: str

class TranslationRequest(BaseModel):
    text: str
    target_lang: str

from contextlib import asynccontextmanager

DATABASE_URL = "sqlite:///database/fluentroot.db"
database = Database(DATABASE_URL)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to database
    try:
        await database.connect()
        print("Connected to database")
    except Exception as e:
        print(f"Database connection error during startup: {e}")
    
    yield
    
    # Shutdown: Disconnect from database
    await database.disconnect()
    print("Disconnected from database")

app = FastAPI(lifespan=lifespan)

# Enable CORS (allow all origins for development simplicity)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth Endpoints
@app.post("/signup")
async def signup(user: UserAuth):
    query = "SELECT * FROM users WHERE email = :email"
    existing_user = await database.fetch_one(query=query, values={"email": user.email})
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    query = "INSERT INTO users(email, password) VALUES (:email, :password)"
    new_id = await database.execute(query=query, values={"email": user.email, "password": user.password})
    return {"message": "User created successfully", "user": {"email": user.email, "id": new_id}}

@app.post("/login")
async def login(user: UserAuth):
    query = "SELECT * FROM users WHERE email = :email AND password = :password"
    db_user = await database.fetch_one(query=query, values={"email": user.email, "password": user.password})
    
    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    return {"message": "Login successful", "user": {"email": db_user["email"], "id": db_user["id"]}}

@app.get("/conversations/{user_id}")
async def get_conversations(user_id: int):
    query = "SELECT * FROM conversations WHERE user_id = :user_id ORDER BY updated_at DESC"
    return await database.fetch_all(query=query, values={"user_id": user_id})

@app.post("/conversations")
async def create_conversation(conv: dict):
    # conv expects: id, user_id, language, topic
    query = """
        INSERT INTO conversations (id, user_id, language, topic)
        VALUES (:id, :user_id, :language, :topic)
    """
    await database.execute(query=query, values=conv)
    return {"message": "Conversation created"}

@app.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str):
    # 1. Delete messages first (foreign key constraint)
    query_msg = "DELETE FROM messages WHERE conversation_id = :conv_id"
    await database.execute(query=query_msg, values={"conv_id": conversation_id})
    
    # 2. Delete the conversation
    query_conv = "DELETE FROM conversations WHERE id = :conv_id"
    await database.execute(query=query_conv, values={"conv_id": conversation_id})
    
    return {"message": "Conversation deleted successfully"}

@app.get("/messages/{conversation_id}")
async def get_messages(conversation_id: str):
    query = "SELECT * FROM messages WHERE conversation_id = :conversation_id ORDER BY timestamp ASC"
    return await database.fetch_all(query=query, values={"conversation_id": conversation_id})

# Google Translate proxy endpoint.  If the Python client library is installed
# and credentials are configured (e.g. via GOOGLE_APPLICATION_CREDENTIALS),
# it will perform a real translation.  Otherwise we fall back to a mock string
# so the frontend can still work during development/demo.
@app.post("/translate")
async def translate_text(req: TranslationRequest):
    if _have_translator:
        try:
            # deep-translator handles many languages by name or code
            translated = GoogleTranslator(source='auto', target=req.target_lang).translate(req.text)
            return {"translatedText": translated}
        except Exception as exc:
            print("translate error", exc)
    # fallback implementation
    return {"translatedText": f"[{req.target_lang} Translation of: {req.text}]"}


# --- NLLB Translation Pipeline ------------------------------------------
# Load the translation model at startup
translation_pipeline = None

def load_nllb_model():
    """Load the NLLB translation model."""
    global translation_pipeline
    if translation_pipeline is None:
        print("Loading NLLB translation model...")
        translation_pipeline = pipeline("translation", model="facebook/nllb-200-distilled-600M")
        print("NLLB model loaded successfully")
    return translation_pipeline

def translate_text_nllb(text: str, target_lang: str) -> str:
    """Translate text using NLLB model. Input/output lang codes: en_XX, fr_XX, es_XX, etc."""
    if target_lang == "en":
        return text
    
    pipe = load_nllb_model()
    try:
        # NLLB expects language codes like 'en_XX', 'fr_XX', 'es_XX'
        # Convert simple codes if needed
        lang_map = {
            "en": "eng_Latn",
            "es": "spa_Latn",
            "fr": "fra_Latn",
            "de": "deu_Latn",
            "zh": "zho_Hans",
            "ja": "jpn_Jpan",
            "pt": "por_Latn",
            "it": "ita_Latn",
            "ko": "kor_Hang",
            "ru": "rus_Cyrl",
        }
        tgt_lang = lang_map.get(target_lang, target_lang)
        
        result = pipe(text, src_lang="eng_Latn", tgt_lang=tgt_lang)
        # pipeline returns a list of dicts with 'translation_text'
        return result[0]["translation_text"] if isinstance(result, list) else str(result)
    except Exception as e:
        print(f"Translation error for {target_lang}: {e}")
        return text  # fallback: return original text

def generate_ai_response(user_text: str, target_lang: str) -> str:
    """Generate a conversational AI response and translate to target_lang."""
    # Simple template-based response
    ai_text_en = f"That's interesting! Tell me more about '{user_text[:30]}...' in the context of language learning."
    
    if target_lang == "en":
        return ai_text_en
    
    # Translate to target language using NLLB
    return translate_text_nllb(ai_text_en, target_lang)

# --------------------------------------------------------------------------

# WebSocket Connection Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@app.websocket("/ws/chat/{conversation_id}")
async def websocket_endpoint(websocket: WebSocket, conversation_id: str):
    await manager.connect(websocket)
    try:
        # Fetch conversation language for AI localization
        query_conv_info = "SELECT language FROM conversations WHERE id = :id"
        conv_info = await database.fetch_one(query=query_conv_info, values={"id": conversation_id})
        target_lang = conv_info["language"] if conv_info else "en"

        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # 1. Save User Message to DB
            query_msg = """
                INSERT INTO messages (conversation_id, sender, text, timestamp)
                VALUES (:conv_id, :sender, :text, :timestamp)
            """
            user_timestamp = datetime.now().isoformat()
            await database.execute(query=query_msg, values={
                "conv_id": conversation_id,
                "sender": "user",
                "text": message_data["text"],
                "timestamp": user_timestamp
            })

            # Broadcast user message
            await manager.broadcast(json.dumps({
                "conversation_id": conversation_id,
                "sender": "user",
                "text": message_data["text"],
                "timestamp": user_timestamp
            }))

            # 2. Update Conversation Last Message & Timestamp
            query_update_conv = """
                UPDATE conversations 
                SET last_message = :last_msg, updated_at = :updated_at 
                WHERE id = :id
            """
            await database.execute(query=query_update_conv, values={
                "last_msg": message_data["text"],
                "updated_at": user_timestamp,
                "id": conversation_id
            })

            # 3. Generate AI Response and translate to target language
            ai_text_localized = generate_ai_response(message_data["text"], target_lang)

            # ensure a timestamp for AI reply
            ai_timestamp = datetime.now().isoformat()
            await database.execute(query=query_msg, values={
                "conv_id": conversation_id,
                "sender": "ai",
                "text": ai_text_localized,
                "timestamp": ai_timestamp
            })

            # Broadcast AI message
            await manager.broadcast(json.dumps({
                "conversation_id": conversation_id,
                "sender": "ai",
                "text": ai_text_localized,
                "timestamp": ai_timestamp
            }))

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"WS Error: {e}")
        manager.disconnect(websocket)

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
