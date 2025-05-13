"""
Muzik Assistant icin 5 milyon sarki entegrasyonu.
Bu betik, uretilen sarkilari API ile entegre eder.
"""
import json
import os
import shutil
import random
from datetime import datetime

# Ana dizin
BASE_DIR = os.path.dirname(os.path.dirname(__file__))

def main():
    """Ana entegrasyon islemlerini gerceklestirir"""
    
    print("5 Milyon sarki entegrasyonu baslatiliyor...")
    
    # Index dosyasini kontrol et
    index_path = os.path.join(BASE_DIR, "songs_index.json")
    if not os.path.exists(index_path):
        print("Hata: songs_index.json dosyasi bulunamadi!")
        print("Lutfen once generate_music_database.py scriptini calistirin.")
        return False
    
    # Index dosyasini yukle
    with open(index_path, "r", encoding="utf-8") as f:
        index_data = json.load(f)
    
    total_songs = index_data.get("total_songs", 0)
    batches = index_data.get("batches", [])
    
    print(f"Toplam {total_songs:,} sarki ve {len(batches)} batch bulundu.")
    
    # API entegrasyonu icin dosyalari olustur
    create_api_loader()
    
    # API guncelleme talimatlari
    create_integration_guide()
    
    # Ornek sarkilari music_assistant_dataset.json'a ekle
    update_ai_dataset(batches)
    
    print("\n✅ 5 milyon sarki entegrasyonu tamamlandi!")
    print("\nSimdi yapmaniz gerekenler:")
    print("1. INTEGRATION_GUIDE.md dosyasini okuyun")
    print("2. API'yi yeni sarki verileriyle guncelleyin")
    print("3. Uygulamayi yeniden baslatarak test edin")
    
    return True

def create_api_loader():
    """API entegrasyonu icin sarki yukleme modulu olusturur"""
    
    print("\nAPI sarki yukleme modulu olusturuluyor...")
    
    loader_path = os.path.join(BASE_DIR, "api", "load_songs.py")
    
    loader_code = """
import json
import os
import time
import random
from typing import List, Dict, Any, Optional

# Ana dizin
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
INDEX_PATH = os.path.join(BASE_DIR, "songs_index.json")
CACHE = {}

def get_all_songs(limit: int = 5000000, use_cache: bool = True):
    """
    Tum sarkilari yukler
    """
    global CACHE
    
    if use_cache and "all_songs" in CACHE and len(CACHE["all_songs"]) >= limit:
        return CACHE["all_songs"][:limit]
    
    start_time = time.time()
    
    if not os.path.exists(INDEX_PATH):
        print("Hata: songs_index.json dosyasi bulunamadi!")
        return []
    
    with open(INDEX_PATH, "r", encoding="utf-8") as f:
        index_data = json.load(f)
    
    total_songs = index_data.get("total_songs", 0)
    batches = index_data.get("batches", [])
    actual_limit = min(total_songs, limit)
    
    songs = []
    songs_loaded = 0
    
    print(f"Toplam {total_songs:,} sarki bulundu, {actual_limit:,} sarki yuklenecek...")
    
    # Batch'leri siraya yukle
    for batch in batches:
        if songs_loaded >= actual_limit:
            break
        
        batch_path = os.path.join(BASE_DIR, batch["filename"])
        
        if not os.path.exists(batch_path):
            print(f"Uyari: {batch_path} dosyasi bulunamadi, atlaniyor...")
            continue
        
        try:
            with open(batch_path, "r", encoding="utf-8") as f:
                batch_data = json.load(f)
                batch_songs = batch_data.get("songs", [])
                
                # Kalan limiti kontrol et
                remaining = actual_limit - songs_loaded
                to_add = batch_songs[:remaining]
                songs.extend(to_add)
                songs_loaded += len(to_add)
                
                print(f"Batch {batch['batch_id']} yuklendi: {len(to_add)} sarki. Toplam: {songs_loaded:,}/{actual_limit:,}")
                
        except Exception as e:
            print(f"Hata: {batch_path} yuklenirken hata olustu: {e}")
    
    end_time = time.time()
    print(f"Veri yukleme tamamlandi. Sure: {end_time - start_time:.2f} saniye")
    
    # Onbellege kaydet (sinirli sayida)
    if use_cache:
        cache_limit = min(100000, len(songs))  # Maksimum 100k sarki
        CACHE["all_songs"] = songs[:cache_limit]
    
    return songs

def get_songs_by_mood(mood: str, limit: int = 100):
    """
    Belirli bir ruh haline uygun sarkilari dondurur
    """
    # Tum sarkilari yukle (onbellek kullanarak)
    all_songs = get_all_songs(limit=100000, use_cache=True)
    
    # Ruh haline gore filtrele
    mood_songs = [song for song in all_songs if song.get("mood", "").lower() == mood.lower()]
    
    # Yeterli sonuc bulunamazsa tag'leri kontrol et
    if len(mood_songs) < limit:
        tag_matches = [
            song for song in all_songs 
            if song not in mood_songs and 
            any(tag.lower() == mood.lower() for tag in song.get("tags", []))
        ]
        mood_songs.extend(tag_matches[:limit - len(mood_songs)])
    
    # Rastgele sirala ve limit uygula
    random.shuffle(mood_songs)
    return mood_songs[:limit]

def get_songs_by_genre(genre: str, limit: int = 100):
    """
    Belirli bir ture uygun sarkilari dondurur
    """
    # Tum sarkilari yukle (onbellek kullanarak)
    all_songs = get_all_songs(limit=100000, use_cache=True)
    
    # Ture gore filtrele
    genre_songs = [
        song for song in all_songs 
        if song.get("genre", "").lower() == genre.lower()
    ]
    
    # Yeterli sonuc bulunamazsa tag'leri kontrol et
    if len(genre_songs) < limit:
        tag_matches = [
            song for song in all_songs 
            if song not in genre_songs and 
            any(tag.lower() == genre.lower() for tag in song.get("tags", []))
        ]
        genre_songs.extend(tag_matches[:limit - len(genre_songs)])
    
    # Rastgele sirala ve limit uygula
    random.shuffle(genre_songs)
    return genre_songs[:limit]

def search_songs(query: str, limit: int = 100):
    """
    Sarki adi veya sanatci adina gore arama yapar
    """
    # Tum sarkilari yukle (onbellek kullanarak)
    all_songs = get_all_songs(limit=100000, use_cache=True)
    
    # Sorguyu normallestir
    query_lower = query.lower()
    
    # Arama yap
    matches = [
        song for song in all_songs
        if query_lower in song.get("title", "").lower() or 
           query_lower in song.get("artist", "").lower()
    ]
    
    # Rastgele sirala ve limit uygula
    random.shuffle(matches)
    return matches[:limit]

# Modulu yukle
print("Sarki veritabani modulu hazirlaniyor...")
"""
    
    with open(loader_path, "w", encoding="utf-8") as f:
        f.write(loader_code)
    
    print(f"API sarki yukleme modulu olusturuldu: {loader_path}")
    return True

def create_integration_guide():
    """API entegrasyonu icin kullanim kilavuzu olusturur"""
    
    guide_path = os.path.join(BASE_DIR, "INTEGRATION_GUIDE.md")
    
    guide_content = """# 5 Milyon Sarki Entegrasyon Kilavuzu

Bu kilavuz, 5 milyon sarkilik veri setini Music Assistant uygulamanizla nasil entegre edeceginizi aciklar.

## Veri Seti Yapisi

- **songs_index.json**: Tum veri setinin indeksini icerir (5 milyon sarki)
- **data/temp/songs_batch_*.json**: Her bir batch'in icindeki sarkilar (500,000 sarki/batch)
- **api/load_songs.py**: API entegrasyonu icin olusturulan modul

## API Entegrasyonu icin Yapilmasi Gerekenler

1. **main.py** icinde asagidaki degisikligi yapin:

```python
# Dosyanin basina ekleyin:
from api.load_songs import get_all_songs, get_songs_by_mood, get_songs_by_genre, search_songs

# get_songs fonksiyonunu degistirin:
@app.get("/songs")
def get_songs(limit: int = 100000):
    return get_all_songs(limit=limit)
```

2. **Ruh Haline Gore Oneri** fonksiyonunu degistirin:

```python
@app.get("/recommendations/mood/{mood}")
async def get_recommendations_by_mood(mood: str):
    # Mevcut mood degerleri ve diger kodlar ayni kalabilir
    # ...
    
    # Son kismi degistirin:
    mood_songs = get_songs_by_mood(mood, limit=20)
    
    return {"mood": mood, "recommendations": mood_songs}
```

3. **Arama** fonksiyonunu degistirin:

```python
@app.get("/search")
def search_songs_endpoint(q: str):
    results = search_songs(q, limit=50)
    return {"results": results}
```

## Performans ve Bellek Yonetimi

- `get_all_songs()` fonksiyonu onbellek kullanarak tekrar tekrar dosya okuma islemlerini azaltir.
- Genellikle ilk istek biraz yavas olabilir, sonraki istekler daha hizli olacaktir.
- Varsayilan olarak 100,000 sarki onbellege alinir, bu sayede yaygin kullanim senaryolari hizli calisir.

## Dogrulama

Entegrasyonu test etmek icin:

1. Bu adresi tarayicinizda acin: `http://localhost:8000/songs?limit=10`
2. 10 adet sarki gorebilmeniz gerekiyor.

## Dikkat Edilmesi Gerekenler

- Veri seti cok buyuk oldugu icin, tum sarkilari ayni anda yuklemek mumkun degildir.
- Arama ve filtreleme islemleri icin onbellege alinan ilk 100,000 sarki kullanilir.
- Ihtiyac duydukca, sarki sayisini veya onbellek boyutunu ayarlayabilirsiniz.
"""
    
    with open(guide_path, "w", encoding="utf-8") as f:
        f.write(guide_content)
    
    print(f"Entegrasyon kilavuzu olusturuldu: {guide_path}")
    return True

def update_ai_dataset(batches):
    """Yapay zeka asistani icin muzik dataset'ine sarki ekler"""
    
    print("\nYapay zeka asistani icin sarki ornekleri ekleniyor...")
    
    ai_dataset_path = os.path.join(BASE_DIR, "music_assistant_dataset.json")
    
    if not os.path.exists(ai_dataset_path):
        print("Uyari: music_assistant_dataset.json dosyasi bulunamadi!")
        return False
    
    # Dataset'i yukle
    with open(ai_dataset_path, "r", encoding="utf-8") as f:
        ai_dataset = json.load(f)
    
    # Ornekler icin sarki yukle
    sample_songs = []
    for batch in batches[:1]:  # Sadece ilk batch
        batch_path = os.path.join(BASE_DIR, batch["filename"])
        if os.path.exists(batch_path):
            with open(batch_path, "r", encoding="utf-8") as f:
                batch_data = json.load(f)
                sample_songs.extend(batch_data["songs"][:50])  # Ilk 50 sarki
    
    if not sample_songs:
        print("Uyari: Ornek sarki bulunamadi!")
        return False
    
    # Dataset'i yedekle
    backup_path = ai_dataset_path + ".backup"
    shutil.copy2(ai_dataset_path, backup_path)
    
    # Ornek sarkilari ekle
    mood_examples_updated = 0
    
    for part in ai_dataset:
        if part["type"] == "mood_based":
            for example in part["examples"]:
                if "response" in example and "Oneriler:" in example["response"]:
                    # Ruh hali/tag'i bul
                    mood = None
                    if "tags" in example and example["tags"]:
                        mood = example["tags"][0]
                    elif "intent" in example and example["intent"].startswith("mood_"):
                        mood = example["intent"].replace("mood_", "")
                    
                    if not mood:
                        continue
                        
                    # Bu ruh haline uygun sarkilari filtrele
                    mood_songs = [s for s in sample_songs if 
                                  s.get("mood") == mood or 
                                  mood in s.get("tags", [])]
                    
                    if not mood_songs and sample_songs:
                        mood_songs = random.sample(sample_songs, min(3, len(sample_songs)))
                    
                    # En fazla 3 sarki olacak sekilde listele
                    if mood_songs:
                        songs_text = ", ".join([f"{s['title']} - {s['artist']}" for s in mood_songs[:3]])
                        example["response"] = f"Bu ruh haline uygun sarkilar buldum. Oneriler: {songs_text}"
                        mood_examples_updated += 1
    
    # Yeni dataset'i kaydet
    with open(ai_dataset_path, "w", encoding="utf-8") as f:
        json.dump(ai_dataset, f, ensure_ascii=False, indent=2)
    
    print(f"AI dataset'i guncellendi: {mood_examples_updated} ornege sarki eklendi.")
    print(f"Orijinal dataset yedeklendi: {backup_path}")
    
    return True

if __name__ == "__main__":
    main()
