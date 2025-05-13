import json
import random
import os
from datetime import datetime

# Sabit veri setleri
ARTISTS = [
    # Türk Pop
    {"name": "Tarkan", "genre": "Turkish Pop", "popularity": 95},
    {"name": "Sezen Aksu", "genre": "Turkish Pop", "popularity": 93},
    {"name": "Murat Boz", "genre": "Turkish Pop", "popularity": 88},
    {"name": "Gülşen", "genre": "Turkish Pop", "popularity": 87},
    {"name": "Hadise", "genre": "Turkish Pop", "popularity": 85},
    {"name": "Kenan Doğulu", "genre": "Turkish Pop", "popularity": 86},
    {"name": "Hande Yener", "genre": "Turkish Pop", "popularity": 84},
    {"name": "Mustafa Sandal", "genre": "Turkish Pop", "popularity": 83},
    {"name": "Simge", "genre": "Turkish Pop", "popularity": 82},
    {"name": "Edis", "genre": "Turkish Pop", "popularity": 81},
    {"name": "Mabel Matiz", "genre": "Turkish Pop", "popularity": 85},
    {"name": "Sıla", "genre": "Turkish Pop", "popularity": 86},
    {"name": "Sertab Erener", "genre": "Turkish Pop", "popularity": 80},
    {"name": "Demet Akalın", "genre": "Turkish Pop", "popularity": 75},
    
    # Türk Rock
    {"name": "Teoman", "genre": "Turkish Rock", "popularity": 89},
    {"name": "Şebnem Ferah", "genre": "Turkish Rock", "popularity": 86},
    {"name": "Duman", "genre": "Turkish Rock", "popularity": 87},
    {"name": "Mor ve Ötesi", "genre": "Turkish Rock", "popularity": 85},
    {"name": "maNga", "genre": "Turkish Rock", "popularity": 86},
    {"name": "Athena", "genre": "Turkish Rock", "popularity": 84},
    {"name": "Hayko Cepkin", "genre": "Turkish Rock", "popularity": 83},
    {"name": "Yüksek Sadakat", "genre": "Turkish Rock", "popularity": 80},
    {"name": "Kurban", "genre": "Turkish Rock", "popularity": 78},
    {"name": "Gripin", "genre": "Turkish Rock", "popularity": 79},
    {"name": "Pinhani", "genre": "Turkish Rock", "popularity": 78},
    
    # Türk Rap
    {"name": "Ceza", "genre": "Turkish Hip-Hop", "popularity": 88},
    {"name": "Sagopa Kajmer", "genre": "Turkish Hip-Hop", "popularity": 87},
    {"name": "Ezhel", "genre": "Turkish Hip-Hop", "popularity": 89},
    {"name": "Şanışer", "genre": "Turkish Hip-Hop", "popularity": 82},
    {"name": "Ben Fero", "genre": "Turkish Hip-Hop", "popularity": 81},
    {"name": "Norm Ender", "genre": "Turkish Hip-Hop", "popularity": 83},
    {"name": "Motive", "genre": "Turkish Hip-Hop", "popularity": 80},
    {"name": "Contra", "genre": "Turkish Hip-Hop", "popularity": 79},
    {"name": "Ayben", "genre": "Turkish Hip-Hop", "popularity": 77},
    
    # Arabesk
    {"name": "Müslüm Gürses", "genre": "Arabesk", "popularity": 90},
    {"name": "İbrahim Tatlıses", "genre": "Arabesk", "popularity": 89},
    {"name": "Ferdi Tayfur", "genre": "Arabesk", "popularity": 88},
    {"name": "Orhan Gencebay", "genre": "Arabesk", "popularity": 87},
    {"name": "Bergen", "genre": "Arabesk", "popularity": 86},
    {"name": "Hakan Altun", "genre": "Arabesk", "popularity": 78},
    
    # Türk Halk Müziği
    {"name": "Neşet Ertaş", "genre": "Turkish Folk", "popularity": 89},
    {"name": "Arif Sağ", "genre": "Turkish Folk", "popularity": 85},
    {"name": "Selda Bağcan", "genre": "Turkish Folk", "popularity": 86},
    {"name": "Barış Manço", "genre": "Turkish Folk", "popularity": 87},
    {"name": "Zülfü Livaneli", "genre": "Turkish Folk", "popularity": 84},
    
    # Uluslararası Pop
    {"name": "Ed Sheeran", "genre": "Pop", "popularity": 94},
    {"name": "Taylor Swift", "genre": "Pop", "popularity": 95},
    {"name": "Dua Lipa", "genre": "Pop", "popularity": 92},
    {"name": "The Weeknd", "genre": "Pop", "popularity": 93},
    {"name": "Ariana Grande", "genre": "Pop", "popularity": 91},
    {"name": "Justin Bieber", "genre": "Pop", "popularity": 90},
    {"name": "Billie Eilish", "genre": "Pop", "popularity": 89},
    {"name": "Lady Gaga", "genre": "Pop", "popularity": 88},
    
    # Rock
    {"name": "Queen", "genre": "Rock", "popularity": 93},
    {"name": "AC/DC", "genre": "Rock", "popularity": 91},
    {"name": "Linkin Park", "genre": "Rock", "popularity": 90},
    {"name": "Metallica", "genre": "Rock", "popularity": 92},
    {"name": "Nirvana", "genre": "Rock", "popularity": 89},
    {"name": "Red Hot Chili Peppers", "genre": "Rock", "popularity": 88},
    {"name": "Coldplay", "genre": "Rock", "popularity": 87},
    
    # R&B & Hip-Hop
    {"name": "Drake", "genre": "Hip-Hop", "popularity": 93},
    {"name": "Kendrick Lamar", "genre": "Hip-Hop", "popularity": 92},
    {"name": "Beyoncé", "genre": "R&B", "popularity": 94},
    {"name": "Rihanna", "genre": "R&B", "popularity": 92},
    {"name": "Travis Scott", "genre": "Hip-Hop", "popularity": 91},
    {"name": "J. Cole", "genre": "Hip-Hop", "popularity": 89},
    {"name": "The Weeknd", "genre": "R&B", "popularity": 91},
    
    # Electronic
    {"name": "Daft Punk", "genre": "Electronic", "popularity": 89},
    {"name": "Calvin Harris", "genre": "Electronic", "popularity": 88},
    {"name": "Avicii", "genre": "Electronic", "popularity": 87},
    {"name": "David Guetta", "genre": "Electronic", "popularity": 86},
    {"name": "Martin Garrix", "genre": "Electronic", "popularity": 85}
]

# Her tür için örnek şarkılar
SONG_TEMPLATES = {
    "Turkish Pop": [
        "{artist} - Yaz Yaz Yaz",
        "{artist} - Aşk",
        "{artist} - Sen Olsan Bari",
        "{artist} - Leyla", 
        "{artist} - Aman",
        "{artist} - Seviyorum",
        "{artist} - Yalnız",
        "{artist} - Dön",
        "{artist} - Uzak",
        "{artist} - Bir Gün",
        "{artist} - Her Şey Güzel Olacak",
        "{artist} - Kaç Kadeh Kırıldı",
        "{artist} - Vur Kadehi",
        "{artist} - Son Bir Kez",
        "{artist} - İyisin Tabi"
    ],
    "Turkish Rock": [
        "{artist} - Yanımda Kal",
        "{artist} - Bir Derdim Var",
        "{artist} - Kalbim",
        "{artist} - Fırtına",
        "{artist} - Paramparça",
        "{artist} - Geri Dönme",
        "{artist} - Senden Daha Güzel",
        "{artist} - Melankoli",
        "{artist} - Cambaz",
        "{artist} - İki Yabancı",
        "{artist} - Her Gece",
        "{artist} - Sarı Kurdeleler"
    ],
    "Turkish Hip-Hop": [
        "{artist} - Felaket",
        "{artist} - Suspus",
        "{artist} - Yerli Plaka",
        "{artist} - Neyim Var ki",
        "{artist} - Fark Var",
        "{artist} - Palavra",
        "{artist} - Rap Star",
        "{artist} - Geceler",
        "{artist} - Sayın Türk",
        "{artist} - Terapi",
        "{artist} - Kimim Ben"
    ],
    "Arabesk": [
        "{artist} - Sevda",
        "{artist} - Nilüfer",
        "{artist} - Mutlu Ol Yeter",
        "{artist} - Huzurum Kalmadı",
        "{artist} - Bitecek Dertlerim",
        "{artist} - Bir Teselli Ver",
        "{artist} - Gülümse Kaderine",
        "{artist} - Sevdan Bir Ateş",
        "{artist} - Hayat Devam Ediyor"
    ],
    "Turkish Folk": [
        "{artist} - Uzun İnce Bir Yoldayım",
        "{artist} - Dağlar Dağlar",
        "{artist} - Dönence",
        "{artist} - Yiğidim Aslanım",
        "{artist} - Çay Elinden Öteye",
        "{artist} - Yine Mi Çiçek",
        "{artist} - Sarı Saçlım Mavi Gözlüm"
    ],
    "Pop": [
        "{artist} - Love Me",
        "{artist} - Sunshine",
        "{artist} - Tonight",
        "{artist} - Beautiful",
        "{artist} - Hold Me",
        "{artist} - Perfect Day",
        "{artist} - Summer Nights",
        "{artist} - Remember",
        "{artist} - Dreams",
        "{artist} - A Little Love",
        "{artist} - Eternal",
        "{artist} - Waves"
    ],
    "Rock": [
        "{artist} - Highway",
        "{artist} - Legends",
        "{artist} - Lost Souls",
        "{artist} - Echoes",
        "{artist} - Eternity",
        "{artist} - Thunder",
        "{artist} - Wildfire",
        "{artist} - Breaking Free",
        "{artist} - Cold Heart",
        "{artist} - Resurrection"
    ],
    "Hip-Hop": [
        "{artist} - Flow",
        "{artist} - Street Life",
        "{artist} - City Lights",
        "{artist} - Real Talk",
        "{artist} - Money Moves",
        "{artist} - Revolution",
        "{artist} - Legacy",
        "{artist} - The Hustle",
        "{artist} - Mind Games",
        "{artist} - True Story"
    ],
    "R&B": [
        "{artist} - Smooth Love",
        "{artist} - Moonlight",
        "{artist} - Sweet Dreams",
        "{artist} - Passion",
        "{artist} - Deep Blue",
        "{artist} - Surrender",
        "{artist} - Soulmate",
        "{artist} - Heartbeat",
        "{artist} - Destiny",
        "{artist} - Candlelight"
    ],
    "Electronic": [
        "{artist} - Pulse",
        "{artist} - Neon Lights",
        "{artist} - Digital Love",
        "{artist} - Euphoria",
        "{artist} - Revolution",
        "{artist} - Sunrise",
        "{artist} - After Hours",
        "{artist} - Cosmic",
        "{artist} - Frequency",
        "{artist} - Illusion"
    ]
}

# Ruh halleri (moods)
MOODS = {
    "happy": ["neşeli", "keyifli", "enerjik", "pozitif", "eğlenceli"],
    "sad": ["hüzünlü", "duygusal", "melankolik", "üzgün"],
    "energetic": ["enerjik", "hareketli", "dinamik", "güçlü"],
    "romantic": ["romantik", "duygusal", "aşk", "sevgi"],
    "calm": ["sakin", "huzurlu", "rahatlatıcı", "dinlendirici"],
    "nostalgic": ["nostaljik", "geçmiş", "hatıra", "eskiler"],
    "motivational": ["motive edici", "ilham verici", "cesaret", "kararlı"]
}

# Türlere göre ruh halleri dağılımı
GENRE_MOOD_MAPPING = {
    "Turkish Pop": ["happy", "romantic", "nostalgic"],
    "Turkish Rock": ["energetic", "sad", "nostalgic", "motivational"],
    "Turkish Hip-Hop": ["energetic", "motivational", "sad"],
    "Arabesk": ["sad", "nostalgic", "romantic"],
    "Turkish Folk": ["nostalgic", "calm", "sad"],
    "Pop": ["happy", "energetic", "romantic"],
    "Rock": ["energetic", "motivational", "sad"],
    "Hip-Hop": ["energetic", "motivational"],
    "R&B": ["romantic", "calm", "sad"],
    "Electronic": ["energetic", "happy", "calm"]
}

def get_random_cover_url(title, artist):
    """Şarkı için rastgele kapak URL'si oluşturur"""
    seed = f"{title}_{artist}".replace(" ", "").lower()
    return f"https://picsum.photos/seed/{seed}/300"

def get_youtube_url(title, artist):
    """Şarkı için YouTube arama URL'si oluşturur"""
    query = f"{title} {artist}".replace(" ", "+")
    return f"https://www.youtube.com/results?search_query={query}"

def get_random_tags(genre, mood):
    """Şarkı için rastgele etiketler döndürür"""
    tags = [genre.lower()]
    mood_tags = MOODS.get(mood, [])
    
    # Türe göre bazı ek etiketler ekle
    if genre == "Turkish Pop":
        tags.extend(["türkçe", "pop"])
    elif genre == "Turkish Rock":
        tags.extend(["türkçe", "rock"])
    elif genre == "Turkish Hip-Hop":
        tags.extend(["türkçe", "rap", "hip-hop"])
    elif genre == "Arabesk":
        tags.extend(["türkçe", "arabesk"])
    elif genre == "Turkish Folk":
        tags.extend(["türkçe", "halk", "folk"])
    else:
        tags.append(genre.lower())
    
    # Rastgele ruh hali etiketleri ekle
    if mood_tags:
        tags.extend(random.sample(mood_tags, min(2, len(mood_tags))))
    
    return list(set(tags))  # Duplicates remove

def generate_songs(count=5000000, batch_save=True, batch_size=500000):
    """Belirtilen sayıda şarkı verisi oluşturur. Büyük veri setleri için batch işleme destekler."""
    all_songs = []
    genres_count = {}  # Her türden kaç şarkı olduğunu takip etmek için
    artist_songs = {}  # Her sanatçının kaç şarkısı olduğunu takip etmek için
    song_titles_used = {}  # Benzersiz şarkı başlıkları takibi için
    
    print(f"\n=== {count:,} ŞARKI OLUŞTURULUYOR ===")
    print(f"Batch işleme: {'Aktif' if batch_save else 'Pasif'}, Batch boyutu: {batch_size:,}")
    start_time = datetime.now()
    
    # Ara kayıt klasörü
    if batch_save:
        data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "temp")
        os.makedirs(data_dir, exist_ok=True)
    
    # İlk olarak, her sanatçı için birkaç temel şarkı oluştur
    for artist_idx, artist_data in enumerate(ARTISTS):
        artist_name = artist_data["name"]
        genre = artist_data["genre"]
        popularity_base = artist_data["popularity"]
        
        # Bu sanatçının şarkı sayısını belirle (popülerliğe ve toplam hedefe göre)
        artist_song_count = max(5, int((popularity_base / 90) * 20))
        
        # Her türün belirli bir limiti olsun
        genres_count[genre] = genres_count.get(genre, 0) + artist_song_count
        
        # Bu tür için şablonlar
        if genre in SONG_TEMPLATES:
            templates = SONG_TEMPLATES[genre]
        else:
            templates = SONG_TEMPLATES["Pop"]  # Fallback
        
        # Bu tür için mood'lar
        if genre in GENRE_MOOD_MAPPING:
            possible_moods = GENRE_MOOD_MAPPING[genre]
        else:
            possible_moods = ["happy", "energetic"]  # Fallback
            
        # Sanatçı için şarkılar oluştur
        for i in range(artist_song_count):
            # Temel şarkı bilgileri
            song_title = templates[i % len(templates)].format(artist=artist_name).split(" - ")[1]
            
            # Şarkı popülerliği (sanatçının popülerliğine dayalı)
            song_popularity = popularity_base - random.randint(0, 15)  # Biraz rastgele varyasyon ekle
            song_popularity = max(50, min(99, song_popularity))  # 50-99 arasında sınırla
            
            # Rastgele ruh hali (mood) seç
            mood = random.choice(possible_moods)
            
            # Şarkı nesnesi oluştur
            song = {
                "id": f"song_{len(all_songs) + 1}",
                "title": song_title,
                "artist": artist_name,
                "genre": genre,
                "mood": mood,
                "tags": get_random_tags(genre, mood),
                "popularity": song_popularity,
                "year": random.randint(2000, 2023),
                "coverUrl": get_random_cover_url(song_title, artist_name),
                "youtubeUrl": get_youtube_url(song_title, artist_name)
            }
            
            all_songs.append(song)
            
            # İlerleme göster
            if len(all_songs) % 1000 == 0:
                elapsed = (datetime.now() - start_time).total_seconds()
                print(f"Oluşturulan: {len(all_songs)} şarkı, Geçen süre: {elapsed:.1f} saniye")
    
    print(f"\nTemel şarkılar oluşturuldu: {len(all_songs)}")
    
    # Daha fazla şarkı oluşturmak gerekiyorsa
    if len(all_songs) < count:
        remaining = count - len(all_songs)
        print(f"Kalan {remaining} şarkı oluşturuluyor...")
        
        # Şarkı adları için ek kelimeler oluşturalim
        adjectives = [
            "Güzel", "Harika", "Muhteşem", "Yeni", "Eski", "Son", "Ilk", "Yüksek", "Derin", "Uzak", "Sıcak", "Soğuk", 
            "Parlak", "Karanlık", "Yavaş", "Hızlı", "Renkli", "Tatlı", "Acı", "Sert", "Yumuşak", "Zor", "Kolay",
            "Sessiz", "Gürlü", "Kırık", "Bütün", "Mavi", "Yeşil", "Kırmızı", "Sarı", "Siyah", "Beyaz", "Mor"
        ]
        
        nouns = [
            "Gün", "Gece", "Yıldız", "Ay", "Güneş", "Gökyüzü", "Deniz", "Okyanus", "Dağ", "Yol", "Sokak", "Ev", 
            "Kalp", "Rüzgar", "Yağmur", "Ateş", "Su", "Toprak", "Aşk", "Sevgi", "Nefret", "Mutluluk", "Hüzün", 
            "Hayat", "Ölüm", "Zaman", "Mevsim", "Bahar", "Yaz", "Sonbahar", "Kış", "Anı", "Hatıra", "Dünya"
        ]
        
        verbs = [
            "Gel", "Git", "Kal", "Dön", "Unut", "Hatırla", "Sev", "Nefret Et", "Gül", "Ağla", "Bağır", "Fısılda", 
            "Uç", "Yüz", "Koş", "Dur", "Bekle", "Ara", "Bul", "Kaybet", "Kazan", "Ver", "Al", "Tut", "Bırak", 
            "Dinle", "Söyle", "Yaz", "Oku", "Yap", "Yık", "Kur", "Yarat", "Öldür", "Yaşat"
        ]
        
        # Benzersiz şarkı başlıkları için bir hash tablosu kullanalım
        song_titles_used = {}
        for s in all_songs:
            song_titles_used[f"{s['artist']}_{s['title']}"] = True
        
        # Batch boyutu ile işleme
        batch_size = 5000
        batches = (remaining + batch_size - 1) // batch_size
        
        for batch in range(batches):
            batch_start = batch * batch_size
            batch_end = min((batch + 1) * batch_size, remaining)
            batch_count = batch_end - batch_start
            
            print(f"Batch {batch+1}/{batches}: {batch_count} şarkı oluşturuluyor...")
            batch_songs = []
            
            for _ in range(batch_count):
                # Rastgele bir sanatçı seç
                artist_data = random.choice(ARTISTS)
                artist_name = artist_data["name"]
                genre = artist_data["genre"]
                
                # Rastgele bir şarkı adı oluştur
                # A) Temel şablonlardan seç
                if random.random() < 0.5 and genre in SONG_TEMPLATES:
                    templates = SONG_TEMPLATES[genre]
                    song_title = random.choice(templates).format(artist=artist_name).split(" - ")[1]
                # B) Yeni bir başlık oluştur
                else:
                    if random.random() < 0.5:
                        song_title = f"{random.choice(adjectives)} {random.choice(nouns)}"
                    else:
                        song_title = f"{random.choice(verbs)}"
                        if random.random() < 0.3:
                            song_title += f" {random.choice(adjectives)}"
                        song_title += f" {random.choice(nouns)}"
                
                # Sanatçı-şarkı kombinasyonu için bir benzersiz tanımlayıcı oluştur
                song_key = f"{artist_name}_{song_title}"
                
                # Bu kombinasyon zaten varsa farklı bir kombinasyon dene
                attempts = 0
                while song_key in song_titles_used and attempts < 10:
                    # Farklı bir şarkı adı oluştur
                    if random.random() < 0.5:
                        song_title = f"{random.choice(adjectives)} {random.choice(nouns)}"
                    else:
                        song_title = f"{random.choice(verbs)}"
                        if random.random() < 0.5:
                            song_title += f" {random.choice(adjectives)}"
                        song_title += f" {random.choice(nouns)}"
                    
                    song_key = f"{artist_name}_{song_title}"
                    attempts += 1
                
                # 10 denemeden sonra hala bulunamadıysa, rasgele sayı ekle
                if song_key in song_titles_used:
                    song_title += f" {random.randint(1, 9999)}"
                    song_key = f"{artist_name}_{song_title}"
                
                # Kullanılmış olarak işaretle
                song_titles_used[song_key] = True
                
                # Bu tür için mood'lar
                if genre in GENRE_MOOD_MAPPING:
                    possible_moods = GENRE_MOOD_MAPPING[genre]
                else:
                    possible_moods = ["happy", "energetic"]  # Fallback
                    
                # Rastgele ruh hali seç
                mood = random.choice(possible_moods)
                
                # Şarkı popülerliği (sanatçının popülerliğine dayalı)
                song_popularity = artist_data["popularity"] - random.randint(0, 20)  # Daha fazla rastgele varyasyon
                song_popularity = max(50, min(95, song_popularity))  # 50-95 arasında sınırla
                
                # Şarkı nesnesi oluştur
                song = {
                    "id": f"song_{len(all_songs) + 1}",
                    "title": song_title,
                    "artist": artist_name,
                    "genre": genre,
                    "mood": mood,
                    "tags": get_random_tags(genre, mood),
                    "popularity": song_popularity,
                    "year": random.randint(2000, 2023),
                    "coverUrl": get_random_cover_url(song_title, artist_name),
                    "youtubeUrl": get_youtube_url(song_title, artist_name)
                }
                
                batch_songs.append(song)
            
            # Batch oluşturulan şarkıları ekle
            all_songs.extend(batch_songs)
            
            # Batch için ilerleme göster
            elapsed = (datetime.now() - start_time).total_seconds()
            songs_per_second = len(all_songs) / elapsed if elapsed > 0 else 0
            estimated_remaining = (count - len(all_songs)) / songs_per_second if songs_per_second > 0 else "??"
            
            print(f"Batch {batch+1} tamamlandı - Toplam: {len(all_songs)}/{count} şarkı (%.1f%%)" % (len(all_songs) * 100 / count))
            print(f"Hız: {songs_per_second:.1f} şarkı/saniye - Tahmini kalan süre: {estimated_remaining:.1f} saniye")
    
    # Tür bazında dağılımı göster
    print("\nTürlere göre dağılım:")
    genre_stats = {}
    for song in all_songs:
        genre_stats[song["genre"]] = genre_stats.get(song["genre"], 0) + 1
        
    for genre, count in sorted(genre_stats.items(), key=lambda x: x[1], reverse=True):
        percentage = (count / len(all_songs)) * 100
        print(f"  {genre}: {count} şarkı ({percentage:.1f}%)")
        
    # Süre bilgisini göster
    total_time = (datetime.now() - start_time).total_seconds()
    print(f"\nToplam süre: {total_time:.1f} saniye")
    print(f"Saniyede şarkı: {len(all_songs) / total_time:.1f}")
    
    return all_songs

def save_songs(songs, filename="songs.json", chunk_size=100000):
    """Şarkıları JSON formatında kaydeder. Büyük veri setleri için parçalanmış kayıt destekler."""
    print(f"\n{len(songs)} şarkı kaydediliyor...")
    
    # Ana klasörü oluştur
    base_path = os.path.dirname(os.path.dirname(__file__))
    data_dir = os.path.join(base_path, "data")
    os.makedirs(data_dir, exist_ok=True)
    
    # Ana dosya yolu
    file_path = os.path.join(base_path, filename)
    
    # 5 milyonluk veri seti için parçalanmış kayıt
    if len(songs) > chunk_size:
        print(f"Büyük veri seti tespit edildi: {len(songs)} şarkı. Parçalanmış kayıt yapılıyor...")
        chunk_dir = os.path.join(data_dir, "chunks")
        os.makedirs(chunk_dir, exist_ok=True)
        
        # Şarkıları parçalara böl
        total_chunks = (len(songs) + chunk_size - 1) // chunk_size
        
        # Ana JSON dosyasında referans olacak parçalar listesi
        chunks_info = []
        
        for i in range(total_chunks):
            start_idx = i * chunk_size
            end_idx = min((i + 1) * chunk_size, len(songs))
            chunk = songs[start_idx:end_idx]
            
            # Parça dosya adı
            chunk_filename = f"songs_chunk_{i+1}_{len(chunk)}.json"
            chunk_path = os.path.join(chunk_dir, chunk_filename)
            
            # Parçayı kaydet
            with open(chunk_path, "w", encoding="utf-8") as f:
                json.dump({"songs": chunk}, f, ensure_ascii=False)
            
            chunks_info.append({
                "filename": f"data/chunks/{chunk_filename}",
                "count": len(chunk),
                "start_index": start_idx,
                "end_index": end_idx - 1
            })
            
            print(f"Parça {i+1}/{total_chunks} kaydedildi: {chunk_path} ({len(chunk)} şarkı)")
        
        # Ana dizini oluştur
        with open(file_path, "w", encoding="utf-8") as f:
            index_data = {
                "total_songs": len(songs),
                "chunks": chunks_info,
                "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }
            json.dump(index_data, f, ensure_ascii=False, indent=2)
        
        print(f"Ana dizin dosyası oluşturuldu: {file_path}")
        print(f"Toplam {len(songs)} şarkı, {total_chunks} parçaya bölünerek kaydedildi.")
    else:
        # Normal kayıt işlemi (küçük veri setleri için)
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump({"songs": songs}, f, ensure_ascii=False, indent=2)
        print(f"Kayıt tamamlandı: {file_path}")
    
    return file_path

def generate_songs_memory_efficient(count=5000000, batch_size=500000, save_directory="data/temp"):
    """Bellek verimli şarkı oluşturma işlevi - çok büyük veri setleri için"""
    print(f"\n=== BELLEK VERİMLİ 5 MİLYON ŞARKI OLUŞTURMA SÜRECİ ===")
    print(f"Hedef: {count:,} şarkı, Batch boyutu: {batch_size:,}")
    
    # Tüm sanatçılar ve temel parametreler için hazırlık
    start_time = datetime.now()
    song_id_counter = 0
    
    # Geçici klasörler oluştur
    base_path = os.path.dirname(os.path.dirname(__file__))
    temp_dir = os.path.join(base_path, save_directory)
    os.makedirs(temp_dir, exist_ok=True)
    
    # Benzersiz şarkı isimleri için kelime havuzları
    adjectives = [
        "Güzel", "Harika", "Muhteşem", "Yeni", "Eski", "Son", "Ilk", "Yüksek", "Derin", "Uzak", "Sıcak", "Soğuk", 
        "Parlak", "Karanlık", "Yavaş", "Hızlı", "Renkli", "Tatlı", "Acı", "Sert", "Yumuşak", "Zor", "Kolay",
        "Sessiz", "Gürlü", "Kırık", "Bütün", "Mavi", "Yeşil", "Kırmızı", "Sarı", "Siyah", "Beyaz", "Mor"
    ]
    
    nouns = [
        "Gün", "Gece", "Yıldız", "Ay", "Güneş", "Gökyüzü", "Deniz", "Okyanus", "Dağ", "Yol", "Sokak", "Ev", 
        "Kalp", "Rüzgar", "Yağmur", "Ateş", "Su", "Toprak", "Aşk", "Sevgi", "Nefret", "Mutluluk", "Hüzün", 
        "Hayat", "Ölüm", "Zaman", "Mevsim", "Bahar", "Yaz", "Sonbahar", "Kış", "Anı", "Hatıra", "Dünya"
    ]
    
    verbs = [
        "Gel", "Git", "Kal", "Dön", "Unut", "Hatırla", "Sev", "Nefret Et", "Gül", "Ağla", "Bağır", "Fısılda", 
        "Uç", "Yüz", "Koş", "Dur", "Bekle", "Ara", "Bul", "Kaybet", "Kazan", "Ver", "Al", "Tut", "Bırak", 
        "Dinle", "Söyle", "Yaz", "Oku", "Yap", "Yık", "Kur", "Yarat", "Öldür", "Yaşat"
    ]
    
    # Her sanatçı için benzersiz şarkı kombinasyonları oluştur
    batch_ids = []
    remaining = count
    batch_num = 0
    
    while remaining > 0:
        batch_num += 1
        current_batch_size = min(batch_size, remaining)
        print(f"\nBatch {batch_num} işleniyor: {current_batch_size:,} şarkı...")
        
        batch_songs = []
        titles_used = set()
        
        # Bu batch için şarkıları oluştur
        for _ in range(current_batch_size):
            # Rastgele bir sanatçı seç
            artist_data = random.choice(ARTISTS)
            artist_name = artist_data["name"]
            genre = artist_data["genre"]
            
            # Şarkı başlığı oluştur (şablondan veya yeni oluştur)
            if random.random() < 0.3 and genre in SONG_TEMPLATES:
                templates = SONG_TEMPLATES[genre]
                song_title = random.choice(templates).split(" - ")[1]
            else:
                # Rastgele bir başlık oluştur
                pattern = random.randint(1, 4)
                if pattern == 1:
                    song_title = f"{random.choice(adjectives)} {random.choice(nouns)}"
                elif pattern == 2:
                    song_title = f"{random.choice(verbs)} {random.choice(nouns)}"
                elif pattern == 3:
                    song_title = f"{random.choice(nouns)}"
                else:
                    song_title = f"{random.choice(adjectives)} {random.choice(nouns)} {random.choice(verbs)}"
            
            # Bu sanatçı-şarkı kombinasyonu benzersiz mi kontrol et
            combo = f"{artist_name}_{song_title}"
            if combo in titles_used:
                song_title = f"{song_title} {random.randint(1, 9999)}"
                combo = f"{artist_name}_{song_title}"
            
            titles_used.add(combo)
            
            # Mood ve diğer metadata oluştur
            if genre in GENRE_MOOD_MAPPING:
                possible_moods = GENRE_MOOD_MAPPING[genre]
            else:
                possible_moods = ["happy", "energetic"]
            
            mood = random.choice(possible_moods)
            song_id_counter += 1
            
            # Şarkı nesnesi oluştur
            song = {
                "id": f"song_{song_id_counter}",
                "title": song_title,
                "artist": artist_name,
                "genre": genre,
                "mood": mood,
                "tags": get_random_tags(genre, mood),
                "popularity": max(50, min(95, artist_data["popularity"] - random.randint(0, 20))),
                "year": random.randint(2000, 2023),
                "coverUrl": get_random_cover_url(song_title, artist_name),
                "youtubeUrl": get_youtube_url(song_title, artist_name)
            }
            
            batch_songs.append(song)
            
            # İlerleme raporu - her 50.000 şarkıda
            if song_id_counter % 50000 == 0:
                elapsed = (datetime.now() - start_time).total_seconds()
                songs_per_sec = song_id_counter / elapsed if elapsed > 0 else 0
                print(f"  İlerleme: {song_id_counter:,}/{count:,} şarkı (%{(song_id_counter/count)*100:.1f}) - Hız: {songs_per_sec:.1f} şarkı/sn")
        
        # Bu batch'i kaydet
        batch_filename = f"songs_batch_{batch_num}.json"
        batch_path = os.path.join(temp_dir, batch_filename)
        
        with open(batch_path, "w", encoding="utf-8") as f:
            json.dump({"songs": batch_songs}, f, ensure_ascii=False)
        
        batch_ids.append({
            "batch_id": batch_num,
            "filename": os.path.join(save_directory, batch_filename),
            "count": len(batch_songs),
            "song_ids": [song_id_counter - len(batch_songs) + 1, song_id_counter]
        })
        
        # İlerleme güncelle
        remaining -= current_batch_size
        print(f"  Batch {batch_num} tamamlandı ve kaydedildi: {batch_path}")
        print(f"  Kalan: {remaining:,} şarkı")
    
    # İşlem tamamlandı - özet
    total_time = (datetime.now() - start_time).total_seconds()
    print(f"\nTüm batchler oluşturuldu: {len(batch_ids)} batch, {song_id_counter:,} şarkı")
    print(f"Toplam süre: {total_time:.1f} saniye, Hız: {song_id_counter/total_time:.1f} şarkı/sn")
    
    # Ana dizin dosyasını oluştur
    index_file = os.path.join(base_path, "songs_index.json")
    with open(index_file, "w", encoding="utf-8") as f:
        index_data = {
            "total_songs": song_id_counter,
            "batches": batch_ids,
            "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        json.dump(index_data, f, ensure_ascii=False, indent=2)
    
    print(f"Ana dizin dosyası oluşturuldu: {index_file}")
    return index_file

def main():
    # 5 milyon şarkı oluşturacağız
    target_count = 5000000  # Toplam hedef şarkı sayısı
    
    try:
        print("\n============================================")
        print("  Müzik Veritabanı Oluşturma Aracı")
        print("============================================")
        print("5 milyon şarkılık veritabanı oluşturuluyor...")
        print(f"Hedef şarkı sayısı: {target_count:,}")
        
        # Bellek verimli yaklaşımla 5 milyon şarkı oluştur
        index_path = generate_songs_memory_efficient(target_count, batch_size=500000)
        
        print("\n============================================")
        print("  İşlem Başarıyla Tamamlandı!")
        print("============================================")
        print(f"Toplam {target_count:,} şarkı oluşturuldu ve kaydedildi.")
        print(f"Ana dizin dosyası: {index_path}")
        print("\nVeritabanı oluşturma işlemi tamamlandı. Artık bu veriyi Music Assistant uygulamanızla kullanabilirsiniz.")
        
    except Exception as e:
        print(f"\nBir hata oluştu: {type(e).__name__}: {e}")
        import traceback
        print("\nHata detayları:")
        traceback.print_exc()

if __name__ == "__main__":
    main()
