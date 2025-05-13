import requests
import json
import time
import os
from collections import defaultdict

# Last.fm API ayarları
LASTFM_API_KEY = "da4e0a06617c86ebe1a8ce7cf98d0b64"  # Last.fm API key - Yenisi
LASTFM_BASE_URL = "http://ws.audioscrobbler.com/2.0/"

# Tür listesi (çeşitlilik için farklı türlerden şarkı çekeceğiz)
GENRES = [
    "pop", "rock", "hip hop", "rap", "electronic", "dance", "jazz", "blues",
    "classical", "r&b", "country", "folk", "metal", "punk", "indie", "alternative",
    "turkish pop", "turkish folk", "arabesk", "turkish rock", "turkish rap"
]

# Ruh halleri (mood) listesi - Bu etiketleri aramak için kullanacağız
MOODS = [
    "happy", "sad", "energetic", "romantic", "relaxing", "melancholic", 
    "nostalgic", "calm", "excited", "chill", "party", "emotional", "upbeat"
]

def fetch_tracks(method, extra_params=None, page=1, limit=1000, max_retries=3):
    """Last.fm API'den şarkı verilerini çeker, hata durumunda yeniden dener"""
    params = {
        "method": method,
        "api_key": LASTFM_API_KEY,
        "format": "json",
        "page": page,
        "limit": limit
    }
    
    if extra_params:
        params.update(extra_params)
    
    for retry in range(max_retries):
        try:
            print(f"API isteği gönderiliyor: {method}, sayfa {page}, limit {limit}")
            response = requests.get(LASTFM_BASE_URL, params=params, timeout=15)
            
            # HTTP durum kodlarını kontrol et
            if response.status_code == 403:
                print(f"HATA: 403 Forbidden - API anahtarı geçersiz veya API limiti aşıldı")
                print(f"Kullanılan API anahtarı: {LASTFM_API_KEY[:5]}...{LASTFM_API_KEY[-5:]}")
                return None
            elif response.status_code == 429:
                wait_time = 60 * (retry + 1)  # Artan bekleme süresi
                print(f"HATA: 429 Too Many Requests - API limiti aşıldı. {wait_time} saniye bekleniyor...")
                time.sleep(wait_time)
                continue
            
            # Diğer HTTP hataları için
            response.raise_for_status()
            
            # JSON verisini çözümle
            data = response.json()
            
            # API hatası kontrolü
            if "error" in data:
                print(f"API hatası: {data['error']} - {data.get('message', '')}")
                return None
            
            return data
            
        except requests.exceptions.RequestException as e:
            print(f"BAŞARISIZ: API isteği hatası ({retry+1}/{max_retries}): {e}")
            if retry < max_retries - 1:
                wait_time = 5 * (retry + 1)
                print(f"Yeniden deneniyor {wait_time} saniye sonra...")
                time.sleep(wait_time)
            else:
                print("Maksimum deneme sayısına ulaşıldı.")
                return None
                
        except json.JSONDecodeError as e:
            print(f"BAŞARISIZ: JSON çözümleme hatası: {e}")
            print(f"Yanıt içeriği: {response.text[:100]}...")
            return None
        
        except Exception as e:
            print(f"BAŞARISIZ: Beklenmeyen hata: {e}")
            return None

def get_track_info(artist, track):
    """Belirli bir şarkının detaylı bilgilerini çeker"""
    params = {
        "method": "track.getInfo",
        "artist": artist,
        "track": track,
        "api_key": LASTFM_API_KEY,
        "format": "json"
    }
    
    try:
        response = requests.get(LASTFM_BASE_URL, params=params)
        response.raise_for_status()
        return response.json()
    except:
        return None

def clean_song_data(track):
    """API'den gelen şarkı verisini temizler ve yapılandırır"""
    # Temel bilgileri çıkar
    song = {
        "title": track.get("name", "Unknown"),
        "artist": track.get("artist", {}).get("name", "Unknown") if isinstance(track.get("artist"), dict) else track.get("artist", "Unknown"),
        "popularity": int(track.get("playcount", 0)) if track.get("playcount") and track.get("playcount").isdigit() else 0,
        "tags": []
    }
    
    # Etiketleri çıkar
    if "toptags" in track and "tag" in track["toptags"]:
        for tag in track["toptags"]["tag"][:5]:
            song["tags"].append(tag["name"].lower())
    
    # Albüm bilgisi varsa ekle
    if "album" in track and isinstance(track["album"], dict) and "title" in track["album"]:
        song["album"] = track["album"]["title"]
    
    # Albüm kapak görüntüsü
    if "album" in track and isinstance(track["album"], dict) and "image" in track["album"]:
        for img in track["album"]["image"]:
            if img.get("size") == "large" and img.get("#text"):
                song["coverUrl"] = img["#text"]
                break
    
    return song

def fetch_songs_with_pagination(fetch_function, params=None, max_pages=500, max_songs=None):
    """Sayfalama ile şarkı verilerini çeker"""
    all_songs = {}  # Şarkı anahtarı -> şarkı verisi
    page = 1
    
    while True:
        if max_songs and len(all_songs) >= max_songs:
            print(f"Hedef şarkı sayısına ulaşıldı: {len(all_songs)}")
            break
            
        if page > max_pages:
            print(f"Maksimum sayfa sayısına ulaşıldı: {max_pages}")
            break
        
        print(f"Sayfa {page} çekiliyor...")
        data = fetch_function(params=params, page=page)
        
        if not data or "tracks" not in data or "track" not in data.get("tracks", {}):
            if "error" in data:
                print(f"API hatası: {data['error']} - {data.get('message', '')}")
            else:
                print("Veri yok veya beklenen formatta değil")
            break
        
        tracks = data["tracks"]["track"]
        if not tracks:
            print("Bu sayfada şarkı yok")
            break
        
        new_songs = 0
        for track in tracks:
            song = clean_song_data(track)
            song_key = (song["title"].lower(), song["artist"].lower())
            
            if song_key not in all_songs:
                all_songs[song_key] = song
                new_songs += 1
        
        print(f"Sayfa {page}: {new_songs} yeni şarkı eklendi. Toplam: {len(all_songs)}")
        
        # Eğer bu sayfada yeni şarkı eklenmediyse, muhtemelen sonraki sayfalarda da olmayacak
        if new_songs == 0:
            print("Yeni şarkı bulunamadı, durduruluyor")
            break
            
        page += 1
        time.sleep(0.2)  # API limitini aşmamak için
    
    return list(all_songs.values())

def fetch_songs_by_tag(tag, max_songs=10000):
    """Belirli bir etiket için şarkı verilerini çeker"""
    print(f"\n--- '{tag}' etiketine göre şarkılar çekiliyor ---")
    return fetch_songs_with_pagination(
        lambda params, page: fetch_tracks("tag.getTopTracks", {"tag": tag}, page),
        max_songs=max_songs
    )

def fetch_top_tracks(max_songs=20000):
    """En popüler şarkıları çeker"""
    print("\n--- En popüler şarkılar çekiliyor ---")
    return fetch_songs_with_pagination(
        lambda params, page: fetch_tracks("chart.getTopTracks", None, page),
        max_songs=max_songs
    )

def fetch_top_artists_songs(max_artists=200, songs_per_artist=50):
    """En popüler sanatçıların şarkılarını çeker"""
    print("\n--- En popüler sanatçıların şarkıları çekiliyor ---")
    
    # En popüler sanatçıları çek
    artists_data = fetch_tracks("chart.getTopArtists", page=1, limit=max_artists)
    if not artists_data or "artists" not in artists_data or "artist" not in artists_data["artists"]:
        print("Sanatçı verisi alınamadı")
        return []
    
    artists = artists_data["artists"]["artist"]
    all_songs = {}
    
    for artist in artists:
        artist_name = artist["name"]
        print(f"\nSanatçı: {artist_name} şarkıları çekiliyor...")
        
        # Sanatçının en popüler şarkılarını çek
        data = fetch_tracks("artist.getTopTracks", {"artist": artist_name}, page=1, limit=songs_per_artist)
        if not data or "toptracks" not in data or "track" not in data["toptracks"]:
            print(f"{artist_name} için şarkı verisi alınamadı")
            continue
        
        artist_tracks = data["toptracks"]["track"]
        for track in artist_tracks:
            song = clean_song_data(track)
            song_key = (song["title"].lower(), song["artist"].lower())
            
            if song_key not in all_songs:
                all_songs[song_key] = song
                
        print(f"{artist_name}: {len(artist_tracks)} şarkı eklendi. Toplam: {len(all_songs)}")
        time.sleep(0.2)  # API limitini aşmamak için
    
    return list(all_songs.values())

def save_songs(songs, filename="songs.json"):
    """Şarkıları JSON formatında kaydeder"""
    print(f"\n{len(songs)} şarkı {filename} dosyasına kaydediliyor...")
    
    # Dosya yolu oluştur
    file_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), filename)
    
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump({"songs": songs}, f, ensure_ascii=False, indent=2)
    
    print(f"Kayıt tamamlandı: {file_path}")
    return file_path

def get_random_cover_url(title, artist):
    """Şarkı için rastgele kapak URL'si oluşturur"""
    seed = f"{title}_{artist}".replace(" ", "").lower()
    return f"https://picsum.photos/seed/{seed}/300"

def enrich_songs_data(songs):
    """Şarkı verilerini zenginleştirir - YouTube URL'si ve eksik kapak resimleri ekler"""
    print("\nŞarkı verileri zenginleştiriliyor...")
    
    for i, song in enumerate(songs):
        if i % 100 == 0:
            print(f"İşleniyor: {i}/{len(songs)}")
            
        # Eksik kapak resmi ekle
        if "coverUrl" not in song or not song["coverUrl"]:
            song["coverUrl"] = get_random_cover_url(song["title"], song["artist"])
        
        # YouTube arama URL'si ekle
        query = f"{song['title']} {song['artist']}".replace(" ", "+")
        song["youtubeUrl"] = f"https://www.youtube.com/results?search_query={query}"
        
        # Benzersiz ID ekle
        song["id"] = f"song_{i+1}"
    
    return songs

def fetch_all_songs(target_count=100000):
    """Farklı yöntemlerle şarkı verilerini çeker ve birleştirir"""
    all_songs = defaultdict(dict)  # Şarkı anahtarı -> şarkı verisi
    collected_count = 0
    
    # En popüler şarkıları çek
    print("\n=== EN POPÜLER ŞARKILAR ÇEKİLİYOR ===")
    top_songs = fetch_top_tracks(max_songs=target_count // 4)
    
    for song in top_songs:
        song_key = (song["title"].lower(), song["artist"].lower())
        all_songs[song_key] = song
    
    collected_count = len(all_songs)
    print(f"Toplam şarkı sayısı: {collected_count}")
    
    if collected_count >= target_count:
        return list(all_songs.values())[:target_count]
    
    # Türlere göre şarkıları çek
    print("\n=== TÜRLERE GÖRE ŞARKILAR ÇEKİLİYOR ===")
    songs_per_genre = (target_count - collected_count) // len(GENRES)
    
    for genre in GENRES:
        if collected_count >= target_count:
            break
            
        genre_songs = fetch_songs_by_tag(genre, max_songs=songs_per_genre)
        
        for song in genre_songs:
            song_key = (song["title"].lower(), song["artist"].lower())
            if song_key not in all_songs:
                all_songs[song_key] = song
        
        collected_count = len(all_songs)
        print(f"'{genre}' sonrası toplam şarkı sayısı: {collected_count}")
    
    if collected_count >= target_count:
        return list(all_songs.values())[:target_count]
    
    # Ruh hallerine göre şarkıları çek
    print("\n=== RUH HALLERİNE GÖRE ŞARKILAR ÇEKİLİYOR ===")
    songs_per_mood = (target_count - collected_count) // len(MOODS)
    
    for mood in MOODS:
        if collected_count >= target_count:
            break
            
        mood_songs = fetch_songs_by_tag(mood, max_songs=songs_per_mood)
        
        for song in mood_songs:
            song_key = (song["title"].lower(), song["artist"].lower())
            if song_key not in all_songs:
                all_songs[song_key] = song
        
        collected_count = len(all_songs)
        print(f"'{mood}' sonrası toplam şarkı sayısı: {collected_count}")
    
    # En popüler sanatçıların şarkılarını çek
    if collected_count < target_count:
        print("\n=== EN POPÜLER SANATÇILARIN ŞARKILARI ÇEKİLİYOR ===")
        artist_songs = fetch_top_artists_songs(
            max_artists=100, 
            songs_per_artist=(target_count - collected_count) // 100
        )
        
        for song in artist_songs:
            song_key = (song["title"].lower(), song["artist"].lower())
            if song_key not in all_songs:
                all_songs[song_key] = song
    
    song_list = list(all_songs.values())
    return song_list[:target_count]

def main():
    """Ana fonksiyon"""
    if not LASTFM_API_KEY:
        print("Lütfen LASTFM_API_KEY değişkenini tanımlayın.")
        return
    
    # Hedef şarkı sayısı - Önce küçük bir test yapalım
    target_count = 1000  # Başlangıç için küçük tutalım, başarılı olursa artırabiliriz
    
    try:
        print("\n=====================================")
        print("  Last.fm Veri Çekme İşlemi Başlıyor")
        print("=====================================\n")
        print(f"Hedef: {target_count} şarkı")
        print(f"API Anahtarı: {LASTFM_API_KEY[:5]}...{LASTFM_API_KEY[-5:]}")
        
        # Önce API'nin çalıştığından emin olmak için tek bir sayfa çekelim
        print("\n--- API Bağlantı Testi Yapılıyor ---")
        test_data = fetch_tracks("chart.getTopTracks", None, 1, 10)
        if not test_data:
            print("\nUYARI: API testi başarısız oldu. İşlem durduruluyor.")
            return
        
        print("\n✅ API bağlantısı başarılı! Veri çekme işlemine devam ediliyor...")
        
        # Şarkıları çek
        songs = fetch_all_songs(target_count)
        
        if not songs or len(songs) == 0:
            print("\nUYARI: Hiç şarkı çekilemedi. İşlem durduruluyor.")
            return
        
        # Verileri zenginleştir
        enriched_songs = enrich_songs_data(songs)
        
        # Kaydet
        saved_path = save_songs(enriched_songs)
        
        print("\n=====================================")
        print(f"  İşlem Başarıyla Tamamlandı!")
        print("=====================================")
        print(f"Toplam {len(enriched_songs)} şarkı kaydedildi.")
        print(f"Dosya konumu: {saved_path}")
        print("\nBu işlem başarılıysa, daha fazla şarkı çekmek için target_count değerini artırabilirsiniz.")
        
    except Exception as e:
        print(f"\nBir hata oluştu: {type(e).__name__}: {e}")
        import traceback
        print("\nHata detayları:")
        traceback.print_exc()

if __name__ == "__main__":
    main()
