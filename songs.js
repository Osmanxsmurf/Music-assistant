// /api/songs.js - Müzik veritabanı API'si (CommonJS formatı)
const fs = require('fs');
const path = require('path');

// Örnek veri
let songDatabase = [];

try {
  // Dosyadan verileri yüklemeyi dene
  const jsonPath = path.join(process.cwd(), 'public', 'songs.json');
  if (fs.existsSync(jsonPath)) {
    const fileContents = fs.readFileSync(jsonPath, 'utf8');
    songDatabase = JSON.parse(fileContents);
    console.log(`Loaded ${songDatabase.length} songs from songs.json`);
  } else {
    console.log('songs.json bulunamadı, örnek veri kullanılıyor');
    // Örnek veri
    songDatabase = [
      { 
        id: '1', 
        title: 'Shape of You', 
        artist: 'Ed Sheeran',
        album: 'Divide',
        genre: 'Pop',
        mood: 'Mutlu',
        youtube_url: 'https://www.youtube.com/watch?v=JGwWNGJdvx8'
      },
      { 
        id: '2', 
        title: 'Blinding Lights', 
        artist: 'The Weeknd',
        album: 'After Hours',
        genre: 'Pop',
        mood: 'Enerjik',
        youtube_url: 'https://www.youtube.com/watch?v=4NRXx6U8ABQ'
      },
      {
        id: '3',
        title: 'Kaç Kadeh Kırıldı',
        artist: 'Sezen Aksu',
        album: 'Gülümse',
        genre: 'Türkçe Pop',
        mood: 'Hüzünlü',
        youtube_url: 'https://www.youtube.com/watch?v=xp-ZjLYHJwQ'  
      },
      {
        id: '4',
        title: 'Araba',
        artist: 'Tarkan',
        album: 'Tarkan',
        genre: 'Türkçe Pop',
        mood: 'Enerjik',
        youtube_url: 'https://www.youtube.com/watch?v=3bfkyXtuIXk'
      }
    ];
  }
} catch (error) {
  console.error('Error loading songs.json:', error);
  songDatabase = [];
}

// Benzersiz kimlik oluştur
function generateUniqueId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// API handler
function handler(req, res) {
  const { query } = req;
  
  // Sayfalama parametreleri
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 20;
  
  // Başlangıç ve bitiş indeksleri
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  
  // Filtreleme parametreleri
  const searchTerm = query.q ? query.q.toLowerCase() : null;
  const genre = query.genre;
  const artist = query.artist;
  const mood = query.mood;
  
  // Filtreleme işlemleri
  let results = [...songDatabase];
  
  if (searchTerm) {
    results = results.filter(song => 
      (song.title?.toLowerCase() || '').includes(searchTerm) ||
      (song.artist?.toLowerCase() || '').includes(searchTerm) ||
      (song.album?.toLowerCase() || '').includes(searchTerm)
    );
  }
  
  if (genre) {
    results = results.filter(song => (song.genre?.toLowerCase() || '') === genre.toLowerCase());
  }
  
  if (artist) {
    results = results.filter(song => (song.artist?.toLowerCase() || '') === artist.toLowerCase());
  }
  
  if (mood) {
    results = results.filter(song => (song.mood?.toLowerCase() || '') === mood.toLowerCase());
  }
  
  // Sayfalama sonuçları
  const paginatedResults = results.slice(startIndex, endIndex);
  
  // Yanıt meta verileri
  const response = {
    page,
    limit,
    totalResults: results.length,
    totalPages: Math.ceil(results.length / limit) || 1,
    results: paginatedResults
  };
  
  // API cevabı
  res.status(200).json(response);
}

// API handler'ını default export olarak dışa aktar (Next.js API rotaları için gerekli)
export default handler;
