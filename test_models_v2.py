import httpx
import asyncio
from dotenv import load_dotenv

load_dotenv()

async def test_gemini(api_key, model):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(
                url,
                headers={"Content-Type": "application/json"},
                json={"contents": [{"parts": [{"text": "Hello, this is a test. Reply with 'OK' if you see this."}]}]},
            )
            print(f"Model: {model}")
            print(f"Status: {resp.status_code}")
            if resp.status_code == 200:
                print("Response:", resp.json()["candidates"][0]["content"]["parts"][0]["text"])
                return True
            else:
                print("Error:", resp.text)
                return False
        except Exception as e:
            print(f"Exception: {e}")
            return False

async def main():
    api_key = "AIzaSyBxARXAa1_WVNYtW5eaU8gVr1Cho9louzQ"
    # Testing models from the list that seem like good candidates
    models = ["gemini-2.0-flash", "gemini-3-flash-preview", "gemini-1.5-flash"]
    for model in models:
        success = await test_gemini(api_key, model)
        if success:
            print(f"Found working model: {model}")
            break
        print("-" * 20)

if __name__ == "__main__":
    asyncio.run(main())
