import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_signup():
    print("Testing /signup...")
    payload = {
        "email": "test_user@example.com",
        "password": "password123"
    }
    response = requests.post(f"{BASE_URL}/signup", json=payload)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    return response.status_code

def test_login():
    print("\nTesting /login...")
    payload = {
        "email": "test_user@example.com",
        "password": "password123"
    }
    response = requests.post(f"{BASE_URL}/login", json=payload)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    return response.status_code

if __name__ == "__main__":
    try:
        signup_status = test_signup()
        login_status = test_login()
        if signup_status in [200, 400] and login_status == 200:
            print("\nVerification SUCCESSFUL")
        else:
            print("\nVerification FAILED")
    except Exception as e:
        print(f"\nError during verification: {e}")
