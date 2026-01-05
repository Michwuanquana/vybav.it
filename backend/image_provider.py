import random
import requests
import os
from io import BytesIO
from PIL import Image

# Seznam prověřených kvalitních fotek prázdných místností z Unsplash
# Tyto fotky jsou ideální pro testování AI analýzy a inpaintingu
EMPTY_ROOM_DATASET = [
    {
        "id": "living-1",
        "url": "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1200",
        "description": "Světlý prázdný obývací pokoj s velkým oknem"
    },
    {
        "id": "minimal-1",
        "url": "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?q=80&w=1200",
        "description": "Minimalistický prázdný prostor s dřevěnou podlahou"
    },
    {
        "id": "bedroom-1",
        "url": "https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=1200",
        "description": "Prázdná ložnice s kobercem"
    },
    {
        "id": "apartment-1",
        "url": "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1200",
        "description": "Moderní prázdný byt, výhled do rohu"
    },
    {
        "id": "loft-1",
        "url": "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1200",
        "description": "Prázdný loftový prostor s vysokým stropem"
    },
    {
        "id": "attic-1",
        "url": "https://images.unsplash.com/photo-1536376074432-cd4258d6c2fe?q=80&w=1200",
        "description": "Prázdné podkroví s přiznanými trámy"
    },
    {
        "id": "modern-1",
        "url": "https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=1200",
        "description": "Prázdná moderní kuchyně spojená s obývákem"
    },
    {
        "id": "luxury-1",
        "url": "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?q=80&w=1200",
        "description": "Luxusní prázdný prostor s výhledem"
    },
    {
        "id": "bright-1",
        "url": "https://images.unsplash.com/photo-1493809842364-78817add7ffb?q=80&w=1200",
        "description": "Světlý prázdný byt s parketami"
    }
]

def get_random_image_info():
    """Vrátí metadata náhodného obrázku ze sady."""
    return random.choice(EMPTY_ROOM_DATASET)

def download_image(url):
    """Stáhne obrázek z URL a vrátí ho jako bytes."""
    print(f"🌐 Stahuji obrázek z: {url}")
    response = requests.get(url)
    response.raise_for_status()
    return response.content

def get_random_image_bytes():
    """Vrátí bytes náhodného obrázku."""
    info = get_random_image_info()
    return download_image(info["url"]), info

if __name__ == "__main__":
    # Test provideru
    info = get_random_image_info()
    print(f"🎲 Vybrán náhodný obrázek: {info['description']} ({info['url']})")
