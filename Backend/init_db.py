import sqlite3
import os

# Get the absolute path of the current directory to avoid relative path issues
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(BASE_DIR, 'database', 'fluentroot.db')
schema_path = os.path.join(BASE_DIR, 'database', 'schema.sql')

print(f"Initializing database at {db_path}...")

try:
    db_dir = os.path.join(BASE_DIR, 'database')
    if not os.path.exists(db_dir):
        os.makedirs(db_dir)
        
    conn = sqlite3.connect(db_path)
    with open(schema_path, 'r') as f:
        schema = f.read()
        conn.executescript(schema)
    conn.commit()
    conn.close()
    print("Database initialized successfully.")
except Exception as e:
    print(f"Error: {e}")
