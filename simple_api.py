"""
Basitleştirilmiş 5 Milyon Şarkı API'si
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import json
import os
import random

# API oluştur
app = FastAPI(title="Music Assistant API", description="5 Million Songs API", version="1.0.0")

# CORS ayarları
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 5 milyon şarkı için index dosyasını yükle
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INDEX_PATH = os.path.join(BASE_DIR, "songs_index.json")
SONG_CACHE = []
CACHE_SIZE = 10000  # Performans için 10k şarkı önbellekte tutulacak

# Önbellek yönetimi
def load_songs_to_cache(limit=10000):
    """Şarkıları önbelleğe yükle"""
    global SONG_CACHE
    
    print(f"Önbelleğe {limit} şarkı yükleniyor...")
    
    if not os.path.exists(INDEX_PATH):
        print(f"Hata: {INDEX_PATH} bulunamadı!")
        return False
        
    try:
        with open(INDEX_PATH, "r", encoding="utf-8") as f:
            index_data = json.load(f)
            
        total_songs = index_data.get("total_songs", 0)
        batches = index_data.get("batches", [])
        
        if not batches:
            print("Hata: Batch bilgisi bulunamadı")
            return False
            
        print(f"Toplam {total_songs:,} şarkı ve {len(batches)} batch bulundu")
        
        # Rastgele bir batch seç ve önbelleğe al
        random_batch = random.choice(batches)
        batch_path = os.path.join(BASE_DIR, random_batch["filename"])
        
        if not os.path.exists(batch_path):
            print(f"Hata: {batch_path} bulunamadı")
            return False
            
        with open(batch_path, "r", encoding="utf-8") as f:
            batch_data = json.load(f)
            
        all_songs = batch_data.get("songs", [])
        
        # Rastgele şarkıları önbelleğe al
        if len(all_songs) > limit:
            SONG_CACHE = random.sample(all_songs, limit)
        else:
            SONG_CACHE = all_songs
            
        print(f"Önbelleğe {len(SONG_CACHE):,} şarkı yüklendi")
        return True
    except Exception as e:
        print(f"Şarkılar yüklenirken hata: {e}")
        return False

# Başlangıçta şarkıları önbelleğe al
load_songs_to_cache(CACHE_SIZE)

@app.get("/")
def read_root():
    return {"message": "Music Assistant API - 5 milyon şarkı veri seti"}

@app.get("/songs")
def get_songs(limit: int = 100):
    """Şarkıları getir - önbellekten rastgele şarkılar döndürür"""
    limit = min(limit, len(SONG_CACHE))
    return random.sample(SONG_CACHE, limit)

@app.get("/search")
def search_songs(q: str, limit: int = 10):
    """Şarkı ara - önbellekteki şarkılarda arama yapar"""
    q = q.lower()
    results = [
        song for song in SONG_CACHE
        if q in song.get("title", "").lower() or
           q in song.get("artist", "").lower() or
           q in song.get("genre", "").lower()
    ]
    return {"results": results[:limit]}

@app.get("/recommendations/mood/{mood}")
def get_recommendations_by_mood(mood: str, limit: int = 10):
    """Ruh haline göre öneri - önbellekteki şarkılarda arama yapar"""
    mood = mood.lower()
    results = [
        song for song in SONG_CACHE
        if song.get("mood", "").lower() == mood or
           mood in map(str.lower, song.get("tags", []))
    ]
    
    if not results:
        # Eşleşme bulunamadıysa rastgele şarkılar döndür
        results = random.sample(SONG_CACHE, min(limit, len(SONG_CACHE)))
        
    return {"mood": mood, "recommendations": results[:limit]}

# API'yi başlat
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8002)
