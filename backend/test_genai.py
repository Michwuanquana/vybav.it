import os
import base64
from dotenv import load_dotenv
from google import genai
from google.genai import types
from PIL import Image
import io
from image_provider import get_random_image_bytes

# Načtení .env z kořenového adresáře
load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))

def test_analysis():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("❌ Chyba: GEMINI_API_KEY nebyl nalezen v .env")
        return

    client = genai.Client(api_key=api_key)
    
    # Získání náhodného obrázku z našeho datasetu
    image_data, info = get_random_image_bytes()
    
    print(f"📸 Analyzuji obrázek: {info['description']}")
    print(f"🔗 URL: {info['url']}")

    # Prompt pro analýzu
    prompt = "Analyze this room for interior design. Return a JSON with room_type, detected_style, and 3 furniture recommendations."

    print("🤖 Volám Gemini 3 Flash (přes nové google-genai SDK)...")
    
    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash-exp", # Použijeme aktuální flash model
            contents=[
                prompt,
                types.Part.from_bytes(data=image_data, mime_type="image/jpeg")
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            )
        )
        
        print("\n✅ Odpověď od Gemini:")
        print(response.text)
        
    except Exception as e:
        print(f"❌ Chyba při volání API: {e}")

if __name__ == "__main__":
    test_analysis()
