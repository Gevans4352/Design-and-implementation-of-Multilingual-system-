import httpx
import asyncio
from dotenv import load_dotenv

load_dotenv()

async def list_models(api_key):
    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
    async with httpx.AsyncClient() as client:
        resp = await client.get(url)
        print("Models (v1beta):")
        if resp.status_code == 200:
            models = resp.json().get("models", [])
            for m in models:
                print(f" - {m['name']} ({m['displayName']})")
        else:
            print(f"Error {resp.status_code}: {resp.text}")

    url_v1 = f"https://generativelanguage.googleapis.com/v1/models?key={api_key}"
    async with httpx.AsyncClient() as client:
        resp = await client.get(url_v1)
        print("\nModels (v1):")
        if resp.status_code == 200:
            models = resp.json().get("models", [])
            for m in models:
                print(f" - {m['name']} ({m['displayName']})")
        else:
            print(f"Error {resp.status_code}: {resp.text}")

if __name__ == "__main__":
    api_key = "AIzaSyBxARXAa1_WVNYtW5eaU8gVr1Cho9louzQ"
    asyncio.run(list_models(api_key))
