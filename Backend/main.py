import os
import json
import time
from datetime import datetime
from typing import List, Optional

import uvicorn
import requests
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv
from contextlib import asynccontextmanager

# ── Environment ───────────────────────────────────────────────────────────────
load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

# ── OpenAI ────────────────────────────────────────────────────────────────────
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if OPENAI_API_KEY:
    from openai import OpenAI as _OpenAI
    openai_client = _OpenAI(api_key=OPENAI_API_KEY)
    print("[OK] OPENAI_API_KEY found.")
else:
    openai_client = None
    print("WARNING: OPENAI_API_KEY not found.")

# ── Google Gemini ─────────────────────────────────────────────────────────────
GOOGLE_GEMINI_API_KEY = os.getenv("GOOGLE_GEMINI_API_KEY")
if GOOGLE_GEMINI_API_KEY:
    print("[OK] GOOGLE_GEMINI_API_KEY found.")
else:
    print("WARNING: GOOGLE_GEMINI_API_KEY not found.")

# ── YarnGPT (TTS only) ────────────────────────────────────────────────────────
YARNGPT_API_KEY = os.getenv("YARNGPT_API_KEY") or os.getenv("TTS_API_KEY")
if YARNGPT_API_KEY:
    print("[OK] YARNGPT_API_KEY found (TTS only).")
else:
    print("WARNING: YARNGPT_API_KEY not found.")

# ── Supabase ──────────────────────────────────────────────────────────────────
from supabase import create_client, Client

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
if SUPABASE_URL and not SUPABASE_URL.startswith("http"):
    SUPABASE_URL = f"https://{SUPABASE_URL}.supabase.co"

SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_ANON_KEY         = os.getenv("SUPABASE_ANON_KEY")
backend_key = SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY or ""

if not SUPABASE_URL or not backend_key:
    print("WARNING: SUPABASE_URL or Supabase keys not found.")

supabase: Client = create_client(SUPABASE_URL, backend_key)
print(f"[OK] Supabase initialised ({'SERVICE_ROLE' if SUPABASE_SERVICE_ROLE_KEY else 'ANON'} key)")

# ── Optional: deep-translator ─────────────────────────────────────────────────
try:
    from deep_translator import GoogleTranslator
    _have_translator = True
except ImportError:
    _have_translator = False

# ── Language config ───────────────────────────────────────────────────────────
LANG_NAMES = {
    "ig": "Igbo",
    "ha": "Hausa",
    "yo": "Yoruba",
    "fr": "French",
    "en": "English",
    "es": "Spanish",
}

# Best YarnGPT voice per language
# Full voice list: Idera, Emma, Zainab, Osagie, Wura, Jude, Chinenye,
#                 Tayo, Regina, Femi, Adaora, Umar, Mary, Nonso, Remi, Adam
LANG_DEFAULT_VOICE = {
    "ig": "Adaora",   # Igbo - warm, engaging
    "ha": "Umar",     # Hausa - calm, smooth
    "yo": "Tayo",     # Yoruba - upbeat, energetic
    "fr": "Emma",     # French - authoritative
    "en": "Jude",     # English - warm, confident
    "es": "Remi",     # Spanish - melodious
}

FALLBACKS = {
    "ig": "Abum onye nnyemaka mmuta asusu. AI anyi adighi nso ugbua. Biko nwaa ozo.",
    "ha": "Ni mai taimakawa wajen koyon harshe. AI ba ya nan yanzu. Da fatan sake gwadawa.",
    "yo": "Mo je oluranlowo eko ede. Ise AI ko si ni akoko yii. Jowo gbiyanju nigbamii.",
    "fr": "Je suis un assistant d'apprentissage des langues. Le modele IA est indisponible. Reessayez plus tard.",
    "en": "I'm a language learning assistant. The AI model is currently unavailable. Please try again later.",
}


# =============================================================================
# CHAT: OpenAI + Gemini
# =============================================================================

def _call_openai(messages: list) -> Optional[str]:
    """Call OpenAI GPT-3.5-turbo. Returns text or None on failure."""
    if not openai_client:
        print("[WARN] OpenAI client not initialised.")
        return None
    try:
        resp = openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=messages,
            temperature=0.7,
            max_tokens=600,
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
        print(f"[ERROR] OpenAI: {e}")
    return None


def _call_gemini(messages: list) -> Optional[str]:
    """
    Call Google Gemini 1.5 Flash.
    Accepts the same messages list format as OpenAI for consistency.
    Returns text or None on failure.
    """
    if not GOOGLE_GEMINI_API_KEY:
        print("[WARN] Gemini key missing.")
        return None
    try:
        # Convert messages to a single prompt string
        prompt_parts = []
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role == "system":
                prompt_parts.append(f"[INSTRUCTIONS]: {content}")
            elif role == "user":
                prompt_parts.append(f"User: {content}")
            elif role == "assistant":
                prompt_parts.append(f"Assistant: {content}")
        prompt_parts.append("Assistant:")
        full_prompt = "\n".join(prompt_parts)

        url = (
            "https://generativelanguage.googleapis.com/v1beta/models/"
            "gemini-2.5-flash:generateContent?key=" + GOOGLE_GEMINI_API_KEY
        )
        resp = requests.post(
            url,
            headers={"Content-Type": "application/json"},
            json={"contents": [{"parts": [{"text": full_prompt}]}]},
            timeout=25,
        )
        if resp.status_code == 200:
            return resp.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
        print(f"[ERROR] Gemini {resp.status_code}: {resp.text}")
    except Exception as e:
        print(f"[ERROR] Gemini: {e}")
    return None


def generate_ai_response(history: List[dict], target_lang: str) -> str:
    """
    Generate a casual, natural chat response — like talking to ChatGPT.
    Always responds in the user's selected language (target_lang), regardless
    of what language the user types in.
    OpenAI is tried first, Gemini is the fallback.
    YarnGPT is NOT used here - it handles TTS only.
    """
    lang_name = LANG_NAMES.get(target_lang, "English")
    fallback  = FALLBACKS.get(target_lang, FALLBACKS["en"])

    system_prompt = (
        f"You are a witty, warm, and genuinely engaging conversational AI. "
        f"Think of yourself as that one friend who's always fun to talk to — "
        f"incredibly knowledgeable, but never condescending about it. "
        f"Your goal is to have a real, flowing conversation that feels completely human and natural. "
        f"\n\n"
        f"LANGUAGE RULE: You MUST always reply in {lang_name}, no matter what language the user "
        f"writes in. Even if they message you in English, Pidgin, or any other language, your "
        f"response must be entirely in {lang_name}. Never deviate from this."
        f"\n\n"
        f"TONE & STYLE:\n"
        f"- Be casual, warm, and conversational — like texting a smart friend, not reading a textbook.\n"
        f"- Use contractions, informal phrasing, and the occasional light humour where it fits.\n"
        f"- Ask follow-up questions to keep the conversation going naturally.\n"
        f"- Match the user's energy: if they're being playful, be playful back; if they're serious, be thoughtful.\n"
        f"- Keep responses concise but satisfying — no bullet-point essays unless they explicitly ask for one.\n"
        f"- Never start a reply with 'Certainly!', 'Of course!', 'Absolutely!', or any robotic filler phrase.\n"
        f"- Avoid sounding like a customer service bot or a Wikipedia article.\n"
        f"\n"
        f"You are NOT a language tutor unless the user specifically asks for language help. "
        f"Just have a genuine, enjoyable conversation — in {lang_name}."
    )

    messages = [{"role": "system", "content": system_prompt}]
    for msg in history[-12:]:  # wider context window for more natural conversation flow
        role = "user" if msg.get("sender") == "user" else "assistant"
        messages.append({"role": role, "content": msg.get("text", "")})

    # Try OpenAI first
    print(f"[ROUTE] Casual chat -> OpenAI")
    result = _call_openai(messages)
    if result:
        return result

    # Fall back to Gemini
    print(f"[FALLBACK] OpenAI failed, trying Gemini.")
    result = _call_gemini(messages)
    if result:
        return result

    print(f"[WARN] Both OpenAI and Gemini failed.")
    return fallback


# =============================================================================
# TTS: YarnGPT
# =============================================================================

def _yarngpt_tts(text: str, voice: str) -> requests.Response:
    """Call YarnGPT TTS API and return the streaming response."""
    if not YARNGPT_API_KEY:
        raise ValueError("YARNGPT_API_KEY not configured")
    return requests.post(
        "https://yarngpt.ai/api/v1/tts",
        headers={"Authorization": f"Bearer {YARNGPT_API_KEY}"},
        json={"text": text, "voice": voice},
        stream=True,
        timeout=60,
    )


# =============================================================================
# Supabase retry helper
# =============================================================================

def _supabase_retry(fn, retries=3, delay=1.0):
    """Retry a Supabase call up to `retries` times on network/SSL errors."""
    last_exc = None
    for attempt in range(retries):
        try:
            return fn()
        except Exception as e:
            last_exc = e
            if attempt < retries - 1:
                print(f"[RETRY] Supabase error (attempt {attempt + 1}/{retries}): {e}")
                time.sleep(delay)
    raise last_exc


# =============================================================================
# FastAPI app
# =============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"\n{'='*60}")
    print("Fluentroot Language Learning Backend Starting")
    print(f"Supabase URL : {SUPABASE_URL}")
    print("Chat         : OpenAI (primary) -> Gemini (fallback)")
    print("TTS          : YarnGPT")
    print(f"{'='*60}\n")
    yield
    print("Server shutting down.")

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Pydantic models ───────────────────────────────────────────────────────────
class UserAuth(BaseModel):
    email: str
    password: str

class TranslationRequest(BaseModel):
    text: str
    target_lang: str

class TTSRequest(BaseModel):
    text: str
    voice: Optional[str] = None       # specific voice name, overrides auto-select
    language: Optional[str] = None    # language code for auto voice selection


# ── Auth ──────────────────────────────────────────────────────────────────────
@app.post("/signup")
async def signup(auth: UserAuth):
    try:
        resp = supabase.auth.sign_up({"email": auth.email, "password": auth.password})
        return {"message": "User registered successfully", "user": resp.user}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/login")
async def login(auth: UserAuth):
    try:
        resp = supabase.auth.sign_in_with_password({"email": auth.email, "password": auth.password})
        return {"message": "Login successful", "session": resp.session, "user": resp.user}
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))


# ── Conversations ─────────────────────────────────────────────────────────────
@app.get("/conversations/single/{conversation_id}")
async def get_single_conversation(conversation_id: str):
    try:
        resp = supabase.table("conversations").select("*").eq("id", conversation_id).execute()
        if not resp.data:
            raise HTTPException(status_code=404, detail="Conversation not found")
        return resp.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/conversations/{user_id}")
async def get_conversations(user_id: str):
    try:
        resp = supabase.table("conversations").select("*").eq("user_id", user_id).order("updated_at", desc=True).execute()
        return resp.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/conversations")
async def create_conversation(conv: dict):
    try:
        resp = supabase.table("conversations").insert(conv).execute()
        return {"message": "Conversation created", "data": resp.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str):
    try:
        supabase.table("messages").delete().eq("conversation_id", conversation_id).execute()
        supabase.table("conversations").delete().eq("id", conversation_id).execute()
        return {"message": "Conversation deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/messages/{conversation_id}")
async def get_messages(conversation_id: str):
    try:
        resp = supabase.table("messages").select("*").eq("conversation_id", conversation_id).order("timestamp", desc=False).execute()
        return resp.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Translation ───────────────────────────────────────────────────────────────
@app.post("/translate")
async def translate_text(req: TranslationRequest):
    if _have_translator:
        try:
            translated = GoogleTranslator(source="auto", target=req.target_lang).translate(req.text)
            return {"translatedText": translated}
        except Exception as e:
            print(f"Translation error: {e}")
    return {"translatedText": f"[{req.target_lang} translation unavailable: {req.text}]"}


# ── TTS (YarnGPT) ─────────────────────────────────────────────────────────────
@app.post("/tts")
async def text_to_speech(req: TTSRequest):
    """
    Convert text to speech using YarnGPT.

    Voice selection priority:
      1. Use `voice` if explicitly provided
      2. Auto-select best voice for `language` if provided
      3. Default to 'Idera'

    Available voices:
      Idera, Emma, Zainab, Osagie, Wura, Jude, Chinenye,
      Tayo, Regina, Femi, Adaora, Umar, Mary, Nonso, Remi, Adam
    """
    if not YARNGPT_API_KEY:
        raise HTTPException(status_code=500, detail="YARNGPT_API_KEY not configured")

    voice = req.voice or LANG_DEFAULT_VOICE.get(req.language or "", "Idera")
    print(f"[TTS] voice={voice} | lang={req.language} | chars={len(req.text)}")

    try:
        resp = _yarngpt_tts(req.text, voice)
        if resp.status_code == 200:
            return StreamingResponse(
                resp.iter_content(chunk_size=8192),
                media_type="audio/mpeg",
                headers={"X-Voice-Used": voice},
            )
        error_detail = resp.text
        print(f"[ERROR] YarnGPT TTS {resp.status_code}: {error_detail}")
        raise HTTPException(status_code=resp.status_code, detail=error_detail)
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] YarnGPT TTS: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/tts")
async def text_to_speech_get(text: str, voice: Optional[str] = "Idera"):
    """
    GET version of TTS for native browser streaming via <audio src="...">.
    Example: http://127.0.0.1:8006/tts?text=Hello&voice=Jude
    """
    if not YARNGPT_API_KEY:
        raise HTTPException(status_code=500, detail="YARNGPT_API_KEY not configured")

    try:
        resp = _yarngpt_tts(text, voice)
        if resp.status_code == 200:
            return StreamingResponse(
                resp.iter_content(chunk_size=8192),
                media_type="audio/mpeg",
                headers={"X-Voice-Used": voice}
            )
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    except Exception as e:
        print(f"[ERROR] YarnGPT GET TTS: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/tts/voices")
async def get_tts_voices():
    """Returns all available YarnGPT voices and the default voice per language."""
    return {
        "voices": [
            {"name": "Idera",    "description": "Melodic, gentle"},
            {"name": "Emma",     "description": "Authoritative, deep"},
            {"name": "Zainab",   "description": "Soothing, gentle"},
            {"name": "Osagie",   "description": "Smooth, calm"},
            {"name": "Wura",     "description": "Young, sweet"},
            {"name": "Jude",     "description": "Warm, confident"},
            {"name": "Chinenye", "description": "Engaging, warm"},
            {"name": "Tayo",     "description": "Upbeat, energetic"},
            {"name": "Regina",   "description": "Mature, warm"},
            {"name": "Femi",     "description": "Rich, reassuring"},
            {"name": "Adaora",   "description": "Warm, engaging"},
            {"name": "Umar",     "description": "Calm, smooth"},
            {"name": "Mary",     "description": "Energetic, youthful"},
            {"name": "Nonso",    "description": "Bold, resonant"},
            {"name": "Remi",     "description": "Melodious, warm"},
            {"name": "Adam",     "description": "Deep, clear"},
        ],
        "language_defaults": LANG_DEFAULT_VOICE,
    }


# ── WebSocket chat ────────────────────────────────────────────────────────────
@app.websocket("/ws/chat/{conversation_id}")
async def websocket_endpoint(websocket: WebSocket, conversation_id: str):
    await websocket.accept()
    try:
        conv_res = _supabase_retry(
            lambda: supabase.table("conversations").select("language").eq("id", conversation_id).execute()
        )
        target_lang = conv_res.data[0]["language"] if conv_res.data else "en"
        print(f"[WS] Conversation {conversation_id} | language: {target_lang}")

        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            user_timestamp = datetime.now().isoformat()

            # Save user message
            user_res = _supabase_retry(
                lambda: supabase.table("messages").insert({
                    "conversation_id": conversation_id,
                    "sender": "user",
                    "text": message_data["text"],
                    "timestamp": user_timestamp,
                }).execute()
            )
            user_msg_id = user_res.data[0]["id"] if user_res.data else f"u-{datetime.now().timestamp()}"

            # Update conversation metadata
            _supabase_retry(
                lambda: supabase.table("conversations").update({
                    "last_message": message_data["text"],
                    "updated_at": user_timestamp,
                }).eq("id", conversation_id).execute()
            )

            # Echo user message back immediately
            await websocket.send_text(json.dumps({
                "id": user_msg_id,
                "conversation_id": conversation_id,
                "sender": "user",
                "text": message_data["text"],
                "timestamp": user_timestamp,
            }))

            # Fetch recent history for AI context
            history_res = _supabase_retry(
                lambda: supabase.table("messages")
                .select("sender", "text")
                .eq("conversation_id", conversation_id)
                .order("timestamp", desc=False)
                .limit(10)
                .execute()
            )
            history = history_res.data

            # Generate AI response (OpenAI -> Gemini)
            ai_text = generate_ai_response(history, target_lang)
            ai_timestamp = datetime.now().isoformat()
            voice_to_use = LANG_DEFAULT_VOICE.get(target_lang, "Idera")

            # Save AI message - handle missing tts_voice column gracefully
            try:
                ai_res = _supabase_retry(
                    lambda: supabase.table("messages").insert({
                        "conversation_id": conversation_id,
                        "sender": "ai",
                        "text": ai_text,
                        "timestamp": ai_timestamp,
                        "tts_voice": voice_to_use
                    }).execute()
                )
            except Exception as e:
                # Fallback: try inserting without tts_voice if column is missing
                if "tts_voice" in str(e):
                    print(f"[WARN] 'tts_voice' column missing in DB, falling back. Error: {e}")
                    ai_res = _supabase_retry(
                        lambda: supabase.table("messages").insert({
                            "conversation_id": conversation_id,
                            "sender": "ai",
                            "text": ai_text,
                            "timestamp": ai_timestamp
                        }).execute()
                    )
                else:
                    raise e
            ai_msg_id = ai_res.data[0]["id"] if ai_res.data else f"a-{datetime.now().timestamp()}"

            # Send AI response — include suggested TTS voice so frontend can call /tts
            await websocket.send_text(json.dumps({
                "id": ai_msg_id,
                "conversation_id": conversation_id,
                "sender": "ai",
                "text": ai_text,
                "timestamp": ai_timestamp,
                "tts_voice": LANG_DEFAULT_VOICE.get(target_lang, "Idera"),
            }))

    except WebSocketDisconnect:
        print(f"[WS] Disconnected: {conversation_id}")
    except Exception as e:
        print(f"[WS ERROR] {conversation_id}: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8005))
    uvicorn.run(app, host="127.0.0.1", port=port)