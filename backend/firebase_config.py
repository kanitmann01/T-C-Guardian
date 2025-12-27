import firebase_admin
from firebase_admin import credentials, firestore
import json
import os

db = None

def init_firebase():
    global db
    try:
        if os.path.exists("serviceAccountKey.json"):
            cred = credentials.Certificate("serviceAccountKey.json")
            firebase_admin.initialize_app(cred)
            db = firestore.client()
            print("Firebase initialized successfully.")
        else:
            print("WARNING: serviceAccountKey.json not found. Caching disabled.")
    except Exception as e:
        print(f"WARNING: Firebase initialization failed: {e}. Caching disabled.")

def get_db():
    return db
