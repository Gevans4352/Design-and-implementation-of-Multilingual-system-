import httpx
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

async def test_gemini(api_key, model):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(
                url,
                headers={"Content-Type": "application/json"},
                json={"contents": [{"parts": [{"text": "Hello, are you working?"}]}]},
            )
            print(f"Model: {model}")
            print(f"Status: {resp.status_code}")
            if resp.status_code == 200:
                print("Response:", resp.json()["candidates"][0]["content"]["parts"][0]["text"])
            else:
                print("Error:", resp.text)
        except Exception as e:
            print(f"Exception: {e}")

async def main():
    api_key = "AIzaSyBxARXAa1_WVNYtW5eaU8gVr1Cho9louzQ" # Taken from .env
    models = ["gemini-1.5-flash", "gemini-2.0-flash-exp", "gemini-2.5-flash"]
    for model in models:
        await test_gemini(api_key, model)
        print("-" * 20)

if __name__ == "__main__":
    asyncio.run(main())
