from dotenv import load_dotenv
import os
from supabase import create_client

load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
if SUPABASE_URL and not SUPABASE_URL.startswith("http"):
    SUPABASE_URL = f"https://{SUPABASE_URL}.supabase.co"

SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
backend_key = SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY

print(f"URL: {SUPABASE_URL}")
print(f"Key identified: {'SERVICE_ROLE' if SUPABASE_SERVICE_ROLE_KEY else 'ANON'}")

try:
    supabase = create_client(SUPABASE_URL, backend_key)
    # List first 5 conversations
    resp = supabase.table("conversations").select("*").limit(5).execute()
    print("Conversations found:", len(resp.data))
    for conv in resp.data:
        print(f"ID: {conv['id']}, User: {conv['user_id']}, Lang: {conv['language']}")
except Exception as e:
    print(f"Error: {e}")
