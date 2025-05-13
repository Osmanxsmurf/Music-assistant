const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const seedrandom = require('seedrandom');
const fs = require('fs').promises;
const { parse } = require('csv-parse/sync');

// Çevresel değişkenleri yükle
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Statik dosyalar için
app.use(express.static(path.join(__dirname, 'public')));

// CSV dosyasını oku
async function readCsvFile(filename) {
  try {
    const filePath = path.join(__dirname, 'data', filename);
    const csvData = await fs.readFile(filePath, 'utf-8');
    console.log('CSV dosyası başarıyla okundu.');

    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
    });

    console.log('CSV verisi parse edildi:', records.length, 'kayıt bulundu.');
    return records;
  } catch (error) {
    console.error('CSV okuma hatası:', error);
    throw error;
  }
}

// API endpoint'leri
app.get('/api/songs', async (req, res) => {
  try {
    const songs = await readCsvFile('music_dataset.csv');
    // 5 milyon şarkı limiti
    const limit = parseInt(req.query.limit) || 5000000;
    res.json(songs.slice(0, limit));
  } catch (error) {
    console.error('Şarkı verisi alma hatası:', error);
    res.status(500).json({ message: 'Şarkı verileri alınamadı', error: error.message });
  }
});
// Ruh hali tabanlı öneri endpoint'i
app.get('/api/recommendations/mood/:mood', async (req, res) => {
  try {
    const mood = req.params.mood || 'happy';
    const songs = await readCsvFile('music_dataset.csv');

    // Rastgele öneriler için seedrandom kullanımı
    const rng = seedrandom(Date.now());

    // Basit bir filtreleme, gerçek bir projede daha gelişmiş olabilir
    const recommendations = songs.sort(() => rng() - 0.5).slice(0, 10);

    res.json(recommendations);
  } catch (error) {
    console.error('Öneri alma hatası:', error);
    res.status(500).json({ message: 'Öneriler alınamadı', error: error.message });
  }
});

// YouTube video bilgileri getir
app.get('/api/youtube/:songId', async (req, res) => {
  try {
    const songId = req.params.songId;
    const songs = await readCsvFile('music_dataset.csv');
    const song = songs.find((s) => s.id === songId || s.youtube_id === songId);

    if (!song) {
      return res.status(404).json({ message: 'Şarkı bulunamadı' });
    }

    // YouTube ID varsa doğrudan döndür, yoksa şarkı adı ve sanatçıdan bilgi oluştur
    const videoInfo = song.youtube_id
      ? { id: song.youtube_id, title: song.title, artist: song.artist }
      : {
          title: song.title,
          artist: song.artist,
          searchQuery: `${song.artist} ${song.title} resmi video`,
        };

    res.json(videoInfo);
  } catch (error) {
    console.error('YouTube bilgisi alma hatası:', error);
    res.status(500).json({ message: 'Video bilgisi alınamadı', error: error.message });
  }
});

// AI Chatbot API endpoint'i
app.post('/api/chat', async (req, res) => {
  try {
    console.log('Express AI API çağrıldı:', req.body);
    const { message, userId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Mesaj gerekli' });
    }

    // Selam yanıtı
    const greetings = ['merhaba', 'selam', 'hey', 'hi', 'hello'];
    if (greetings.some((g) => message.toLowerCase().includes(g))) {
      return res.json({
        text: 'Bugün nasılsınız? Size nasıl yardımcı olabilirim?',
        recommendations: [],
      });
    }

    // Duygu durumu yanıtı
    const moodKeywords = {
      mutlu: ['neşeli', 'sevinçli', 'güzel'],
      üzgün: ['hüzünlü', 'kederli', 'mutsuz'],
      enerjik: ['canlı', 'dinamik', 'hareketli'],
      romantik: ['aşk', 'sevgi', 'duygusal'],
      sakin: ['huzurlu', 'rahat', 'dingin'],
      nostaljik: ['eski', 'geçmiş', 'eskiden'],
    };

    let detectedMood = null;

    for (const [mood, keywords] of Object.entries(moodKeywords)) {
      if (
        message.toLowerCase().includes(mood) ||
        keywords.some((k) => message.toLowerCase().includes(k))
      ) {
        detectedMood = mood;
        break;
      }
    }

    // Duygu durumu algılandıysa öneri yap
    if (detectedMood) {
      try {
        const songs = await readCsvFile('music_dataset.csv');
        const recommendations = songs.sort(() => Math.random() - 0.5).slice(0, 5);

        return res.json({
          text: `${detectedMood.charAt(0).toUpperCase() + detectedMood.slice(1)} mod için önerilerim:`,
          recommendations,
        });
      } catch (error) {
        console.error('Öneri hatası:', error);
      }
    }

    // Genel yanıt
    res.json({
      text: 'Size nasıl yardımcı olabilirim? Hangi tür veya ruh halinde müzik dinlemek istersiniz?',
      recommendations: [],
    });
  } catch (error) {
    console.error('Chatbot hatası:', error);
    res.status(500).json({ error: 'Yanıt oluşturulamadı' });
  }
});

// CORS ayarları (Next.js ile entegrasyon için)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    return res.status(200).json({});
  }
  next();
});

// Sunucuyu başlat
app.listen(PORT, () => {
  console.log(`Server http://localhost:${PORT} adresinde çalışıyor`);
  console.log(`API endpoint: http://localhost:${PORT}/api/songs`);
  console.log('Music Assistant: 5 milyon şarkı kapasitesi ve yapay zeka chatbot etkin');
});
