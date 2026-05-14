import base64
import json

def decode_jwt(token):
    parts = token.split('.')
    if len(parts) != 3:
        return "Invalid token"
    payload = parts[1]
    # Add padding if necessary
    payload += '=' * (4 - len(payload) % 4)
    decoded = base64.b64decode(payload).decode('utf-8')
    return json.loads(decoded)

token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnbmZ0eXdzZm5xbHBsb3N5bm1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyNzk1MDEsImV4cCI6MjA4ODg1NTUwMX0.-YnijjcUitPQJElkKOAftgeCFRmw972RXszlTnDf27A"
print(decode_jwt(token))
