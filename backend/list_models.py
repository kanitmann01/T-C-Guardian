
import google.generativeai as genai
from config import GOOGLE_API_KEY
import sys

with open("log.txt", "w") as f:
    if GOOGLE_API_KEY:
        genai.configure(api_key=GOOGLE_API_KEY)
        try:
            f.write("Listing models...\n")
            for m in genai.list_models():
                if 'generateContent' in m.supported_generation_methods:
                    f.write(f"Model: {m.name}\n")
        except Exception as e:
            f.write(f"Error listing models: {e}\n")
    else:
        f.write("No API Key configured.\n")
