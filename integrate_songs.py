"""
5 milyon şarkı veri setini Music Assistant uygulaması ile entegre eden script.
"""
import json
import os
import sys
import shutil
from datetime import datetime

# Ana dizin
base_dir = os.path.dirname(os.path.dirname(__file__))

def create_integration_file():
    """
    5 milyon şarkıyı API'nin kullandığı yapı ile uyumlu hale getirir ve gerekli dosyaları oluşturur.
    Bu işlem çok büyük veri seti için parçalı yapıyı korur ama API'nin kullanabileceği bir indeks sistemi oluşturur.
    """
    print("5 Milyon şarkı entegrasyonu başlatılıyor...")
    
    # Önce songs_index.json dosyasını kontrol et
    index_path = os.path.join(base_dir, "songs_index.json")
    if not os.path.exists(index_path):
        print("Hata: songs_index.json dosyası bulunamadı.")
        print("Önce generate_music_database.py scriptini çalıştırmalısınız.")
        return False
    
    # İndeks dosyasını yükle
    with open(index_path, "r", encoding="utf-8") as f:
        index_data = json.load(f)
    
    total_songs = index_data.get("total_songs", 0)
    batches = index_data.get("batches", [])
    
    if not batches:
        print("Hata: Batch bilgisi bulunamadı.")
        return False
    
    print(f"Toplam {total_songs:,} şarkı ve {len(batches)} batch bulundu.")
    
    # API'nin kullanacağı bütünleşik veri yapısını oluştur
    # Bu dosya çok büyük olacağı için önce örnek bir yapı oluşturalım
    
    # 1. API entegrasyonu için örnek dosya oluştur
    sample_songs = []
    sample_batch_path = os.path.join(base_dir, batches[0]["filename"])
    
    if os.path.exists(sample_batch_path):
        with open(sample_batch_path, "r", encoding="utf-8") as f:
            batch_data = json.load(f)
            # Her batch'in ilk 10 şarkısını örnekle
            sample_songs.extend(batch_data["songs"][:10])
    
    # API yapısına uygun örnek JSON oluştur
    api_songs_path = os.path.join(base_dir, "api", "songs_api_format.json")
    with open(api_songs_path, "w", encoding="utf-8") as f:
        json.dump({"songs": sample_songs}, f, ensure_ascii=False, indent=2)
    
    print(f"API format örneği oluşturuldu: {api_songs_path}")
    
    # 2. API entegrasyonu için load_songs.py oluştur
    api_loader_path = os.path.join(base_dir, "api", "load_songs.py")
    
    loader_code = """
import json
import os
import time
from typing import List, Dict, Any, Optional

# Ana dizin
base_dir = os.path.dirname(os.path.dirname(__file__))
index_path = os.path.join(base_dir, "songs_index.json")
cache = {}

def get_all_songs(limit: int = 5000000, use_cache: bool = True) -> List[Dict[str, Any]]:
    """
    Tum sarkilari parcali veri dosyalarindan yukler.
    
    Args:
        limit: Maksimum sarki sayisi
        use_cache: Onbellek kullanilsin mi?
    
    Returns:
        Sarki listesi
    """
    global cache
    
    if use_cache and "all_songs" in cache and len(cache["all_songs"]) >= limit:
        # Belirtilen limite göre önbellekten döndür
        return cache["all_songs"][:limit]
    
    # Toplam şarkı sayısı için indeks dosyasını yükle
    start_time = time.time()
    
    if not os.path.exists(index_path):
        print("Hata: songs_index.json dosyası bulunamadı.")
        return []
    
    with open(index_path, "r", encoding="utf-8") as f:
        index_data = json.load(f)
    
    total_songs = index_data.get("total_songs", 0)
    batches = index_data.get("batches", [])
    actual_limit = min(total_songs, limit)
    
    songs = []
    songs_loaded = 0
    
    print(f"Toplam {total_songs:,} şarkı bulundu, {actual_limit:,} şarkı yüklenecek...")
    
    # Batch'leri sırayla yükle (aktif limiti aşmamak kaydıyla)
    for batch in batches:
        if songs_loaded >= actual_limit:
            break
        
        batch_path = os.path.join(base_dir, batch["filename"])
        
        if not os.path.exists(batch_path):
            print(f"Uyarı: {batch_path} dosyası bulunamadı, atlanıyor...")
            continue
        
        try:
            with open(batch_path, "r", encoding="utf-8") as f:
                batch_data = json.load(f)
                batch_songs = batch_data.get("songs", [])
                
                # Kalan limiti kontrol et
                remaining = actual_limit - songs_loaded
                songs.extend(batch_songs[:remaining])
                songs_loaded += len(batch_songs[:remaining])
                
                print(f"Batch {batch['batch_id']} yüklendi: {len(batch_songs[:remaining])} şarkı. Toplam: {songs_loaded:,}/{actual_limit:,}")
                
        except Exception as e:
            print(f"Hata: {batch_path} dosyası yüklenirken hata oluştu: {e}")
    
    end_time = time.time()
    print(f"Veri yükleme tamamlandı. Süre: {end_time - start_time:.2f} saniye")
    
    # Önbelleğe kaydet (sınırlı sayıda)
    if use_cache:
        cache_limit = min(100000, len(songs))  # Maksimum 100k şarkı önbelleğe al
        cache["all_songs"] = songs[:cache_limit]
    
    return songs

def get_songs_by_mood(mood: str, limit: int = 100) -> List[Dict[str, Any]]:
    """
    Belirli bir ruh haline uygun şarkıları döndürür.
    
    Args:
        mood: Ruh hali (örn: "mutlu", "hüzünlü")
        limit: Maksimum şarkı sayısı
    
    Returns:
        Şarkı listesi
    """
    # Tüm şarkıları yükle (önbellek kullanarak)
    all_songs = get_all_songs(limit=100000, use_cache=True)
    
    # Ruh haline göre filtrele
    mood_songs = [song for song in all_songs if song.get("mood", "").lower() == mood.lower()]
    
    # Yeterli sonuç bulunamazsa tag'leri de kontrol et
    if len(mood_songs) < limit:
        tag_matches = [
            song for song in all_songs 
            if song not in mood_songs and 
            any(tag.lower() == mood.lower() for tag in song.get("tags", []))
        ]
        mood_songs.extend(tag_matches[:limit - len(mood_songs)])
    
    # Rastgele sırala ve limit uygula
    import random
    random.shuffle(mood_songs)
    return mood_songs[:limit]

def get_songs_by_genre(genre: str, limit: int = 100) -> List[Dict[str, Any]]:
    """
    Belirli bir türe uygun şarkıları döndürür.
    
    Args:
        genre: Müzik türü (örn: "pop", "rock")
        limit: Maksimum şarkı sayısı
    
    Returns:
        Şarkı listesi
    """
    # Tüm şarkıları yükle (önbellek kullanarak)
    all_songs = get_all_songs(limit=100000, use_cache=True)
    
    # Türe göre filtrele (büyük/küçük harf duyarlılığını kaldır)
    genre_songs = [
        song for song in all_songs 
        if song.get("genre", "").lower() == genre.lower()
    ]
    
    # Yeterli sonuç bulunamazsa tag'leri de kontrol et
    if len(genre_songs) < limit:
        tag_matches = [
            song for song in all_songs 
            if song not in genre_songs and 
            any(tag.lower() == genre.lower() for tag in song.get("tags", []))
        ]
        genre_songs.extend(tag_matches[:limit - len(genre_songs)])
    
    # Rastgele sırala ve limit uygula
    import random
    random.shuffle(genre_songs)
    return genre_songs[:limit]

def search_songs(query: str, limit: int = 100) -> List[Dict[str, Any]]:
    """
    Şarkı adı veya sanatçı adına göre arama yapar.
    
    Args:
        query: Arama terimi
        limit: Maksimum şarkı sayısı
    
    Returns:
        Şarkı listesi
    """
    # Tüm şarkıları yükle (önbellek kullanarak)
    all_songs = get_all_songs(limit=100000, use_cache=True)
    
    # Sorguyu normalleştir
    query_lower = query.lower()
    
    # Şarkı adı veya sanatçı adında arama yap
    matches = [
        song for song in all_songs
        if query_lower in song.get("title", "").lower() or 
           query_lower in song.get("artist", "").lower()
    ]
    
    # Rastgele sırala ve limit uygula
    import random
    random.shuffle(matches)
    return matches[:limit]

# Ön yükleme - process başladığında çalışır
print("Şarkı veritabanı modülü hazırlanıyor...")
"""
    
    with open(api_loader_path, "w", encoding="utf-8") as f:
        f.write(loader_code)
    
    print(f"API şarkı yükleme modülü oluşturuldu: {api_loader_path}")
    
    # 3. songs.json yedeğini al
    songs_path = os.path.join(base_dir, "songs.json")
    if os.path.exists(songs_path):
        backup_path = os.path.join(base_dir, "songs_backup.json")
        shutil.copy2(songs_path, backup_path)
        print(f"songs.json yedeklendi: {backup_path}")
    
    # 4. API entegrasyonu için main.py içerisinde gerekli değişiklikleri açıkla
    integration_guide = os.path.join(base_dir, "INTEGRATION_GUIDE.md")
    guide_content = """# 5 Milyon Şarkı Entegrasyon Kılavuzu

Bu kılavuz, 5 milyon şarkılık veri setini Music Assistant uygulamanızla nasıl entegre edeceğinizi açıklar.

## Veri Seti Yapısı

- **songs_index.json**: Tüm veri setinin indeksini içerir (5 milyon şarkı)
- **data/temp/songs_batch_*.json**: Her bir batch'in içinde bulunan şarkılar (500,000 şarkı/batch)
- **api/load_songs.py**: API entegrasyonu için oluşturulan modül

## API Entegrasyonu için Yapılması Gerekenler

1. **main.py** içinde aşağıdaki değişikliği yapın:

```python
# Dosyanın başına ekleyin:
from api.load_songs import get_all_songs, get_songs_by_mood, get_songs_by_genre, search_songs

# get_songs fonksiyonunu değiştirin:
@app.get("/songs")
def get_songs(limit: int = 100000):
    return get_all_songs(limit=limit)
```

2. **Ruh Haline Göre Öneri** fonksiyonunu değiştirin:

```python
@app.get("/recommendations/mood/{mood}")
async def get_recommendations_by_mood(mood: str):
    # Mevcut mood değerleri ve diğer kodlar aynı kalabilir
    # ...
    
    # Son kısmı değiştirin:
    mood_songs = get_songs_by_mood(mood, limit=20)
    
    return {"mood": mood, "recommendations": mood_songs}
```

3. **Arama** fonksiyonunu değiştirin:

```python
@app.get("/search")
def search_songs_endpoint(q: str):
    results = search_songs(q, limit=50)
    return {"results": results}
```

## Performans ve Bellek Yönetimi

- `get_all_songs()` fonksiyonu, önbellek kullanarak tekrar tekrar dosya okuma işlemlerini azaltır.
- Genellikle ilk istek biraz yavaş olabilir, sonraki istekler daha hızlı olacaktır.
- Varsayılan olarak 100,000 şarkı önbelleğe alınır, bu sayede yaygın kullanım senaryoları hızlı çalışır.

## Doğrulama

Entegrasyonu test etmek için:

1. Bu adresi tarayıcınızda açın: `http://localhost:8000/songs?limit=10`
2. 10 adet şarkı görebilmeniz gerekiyor.

## Dikkat Edilmesi Gerekenler

- Veri seti çok büyük olduğu için, tüm şarkıları aynı anda yüklemek mümkün değildir.
- Arama ve filtreleme işlemleri için önbelleğe alınan ilk 100,000 şarkı kullanılır.
- İhtiyaç duydukça, şarkı sayısını veya önbellek boyutunu ayarlayabilirsiniz.
"""
    
    with open(integration_guide, "w", encoding="utf-8") as f:
        f.write(guide_content)
    
    print(f"Entegrasyon kılavuzu oluşturuldu: {integration_guide}")
    
    # 5. Entegre edilen verilere uygun API güncellemesi
    update_api_path = os.path.join(base_dir, "api", "update_api.py")
    update_code = """
# API Güncellemesi için otomatik kod
import os
import re

# Ana dizin
base_dir = os.path.dirname(os.path.dirname(__file__))
main_py_path = os.path.join(base_dir, "api", "main.py")

# main.py dosyasını aç
with open(main_py_path, "r", encoding="utf-8") as f:
    content = f.read()

# İlgili importları ekle
import_pattern = r"import random\\nimport json\\nimport asyncio"
import_replacement = "import random\\nimport json\\nimport asyncio\\n\\n# 5 Milyon şarkı entegrasyonu\\nfrom api.load_songs import get_all_songs, get_songs_by_mood, get_songs_by_genre, search_songs"

# get_songs fonksiyonunu güncelle
get_songs_pattern = r"@app\\.get\\(\"/songs\"\\)\\ndef get_songs\\(limit: int = 100000\\):\\n    return random\\.sample\\(all_songs, min\\(limit, len\\(all_songs\\)\\)\\)"
get_songs_replacement = "@app.get(\"/songs\")\\ndef get_songs(limit: int = 100000):\\n    return get_all_songs(limit=limit)"

# Güncellemeleri yap
modified_content = re.sub(import_pattern, import_replacement, content)
modified_content = re.sub(get_songs_pattern, get_songs_replacement, modified_content)

# Dosyayı kaydet
with open(main_py_path + ".updated", "w", encoding="utf-8") as f:
    f.write(modified_content)

print(f"API güncellemesi tamamlandı. Güncellenen dosya: {main_py_path}.updated")
print("Bu dosyayı inceleyip, main.py ile değiştirmeniz gerekiyor.")
"""
    
    with open(update_api_path, "w", encoding="utf-8") as f:
        f.write(update_code)
    
    print(f"API güncelleme script'i oluşturuldu: {update_api_path}")
    
    # 6. Yapay zeka asistanı için şarkı entegrasyonu
    ai_dataset_path = os.path.join(base_dir, "music_assistant_dataset.json")
    
    if os.path.exists(ai_dataset_path):
        # Dataset'i yükle
        with open(ai_dataset_path, "r", encoding="utf-8") as f:
            ai_dataset = json.load(f)
        
        # Örneklere bazı yeni şarkıları ekle
        samples = []
        for batch in batches[:1]:  # Sadece ilk batch'ten örnekle
            batch_path = os.path.join(base_dir, batch["filename"])
            if os.path.exists(batch_path):
                with open(batch_path, "r", encoding="utf-8") as f:
                    batch_data = json.load(f)
                    samples.extend(batch_data["songs"][:10])
        
        # Örnek şarkı bilgilerini ekle
        for part in ai_dataset:
            if part["type"] == "mood_based":
                for example in part["examples"]:
                    if "response" in example and "Öneriler:" in example["response"]:
                        # Ruh hali etiketini bul
                        mood = example.get("tags", ["happy"])[0] if "tags" in example else "happy"
                        
                        # Bu ruh haline uygun şarkıları filtrele
                        mood_samples = [s for s in samples if s.get("mood") == mood or mood in s.get("tags", [])]
                        if not mood_samples and samples:
                            mood_samples = samples[:3]  # Eşleşme yoksa ilk 3 şarkıyı al
                        
                        # En fazla 3 şarkı olacak şekilde listele
                        if mood_samples:
                            songs_text = ", ".join([f"{s['title']} - {s['artist']}" for s in mood_samples[:3]])
                            example["response"] = f"Bu ruh haline uygun şarkılar buldum. Öneriler: {songs_text}"
        
        # Yeni dataset'i kaydet
        backup_dataset_path = ai_dataset_path + ".backup"
        shutil.copy2(ai_dataset_path, backup_dataset_path)
        
        with open(ai_dataset_path, "w", encoding="utf-8") as f:
            json.dump(ai_dataset, f, ensure_ascii=False, indent=2)
        
        print(f"AI dataset'i güncellendi ve yedeklendi: {backup_dataset_path}")
    
    print("\n✅ 5 milyon şarkı entegrasyonu başarıyla tamamlandı!")
    print("\nYapmanız gerekenler:")
    print("1. INTEGRATION_GUIDE.md dosyasını okuyun")
    print("2. api/update_api.py script'ini çalıştırarak API'yi güncelleyin")
    print("3. Değişiklikleri kontrol edip, API'yi yeniden başlatın")
    
    return True

if __name__ == "__main__":
    create_integration_file()
