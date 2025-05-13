// Music Assistant - Xata Veri Yükleme Betiği
// Bu betik all_songs_merged.json verisini alıp Xata veritabanına yükler

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { xataClient, ensureTables } = require('./xata-client');

// Sabitler
const DATA_PATH = path.join(__dirname, '..', 'data', 'all_songs_merged.json');
const BATCH_SIZE = 50; // Her batch'te işlenecek şarkı sayısı
const MAX_SONGS = 5000000; // İşlenecek maksimum şarkı sayısı

// Türkçe karakter düzeltme
function normalizeTurkish(text) {
  if (!text) return '';
  
  // Türkçe karakter düzeltmeleri
  const tr_map = {
    'Ä±': 'ı', 'Ä°': 'İ', 'Ã§': 'ç', 'Ã‡': 'Ç',
    'ÅŸ': 'ş', 'Åž': 'Ş', 'ÄŸ': 'ğ', 'Äž': 'Ğ',
    'Ã¼': 'ü', 'Ãœ': 'Ü', 'Ã¶': 'ö', 'Ã–': 'Ö',
    'heyecanlÄ±': 'heyecanlı'
  };
  
  let normalized = text;
  for (const [wrong, correct] of Object.entries(tr_map)) {
    normalized = normalized.replace(new RegExp(wrong, 'g'), correct);
  }
  
  return normalized;
}

// Şarkı verilerini temizle ve normalize et
function cleanSongData(song) {
  const cleaned = {};
  
  // ID alanını düzelt
  if (song.id) {
    cleaned.id = String(song.id).replace(/\s+/g, '_').replace(/-/g, '_').toLowerCase();
  } else {
    // ID oluştur
    const artist = (song.artist || '').toLowerCase().replace(/\s+/g, '_');
    const title = (song.title || '').toLowerCase().replace(/\s+/g, '_');
    cleaned.id = `${artist}_${title}`;
  }
  
  // Metin alanlarını düzelt
  for (const field of ['title', 'artist', 'album', 'genre']) {
    if (song[field]) {
      cleaned[field] = normalizeTurkish(String(song[field]));
    }
  }
  
  // URL'leri doğrudan aktar
  for (const field of ['youtubeUrl', 'coverUrl']) {
    if (song[field]) {
      cleaned[field] = song[field];
    }
  }
  
  // Sayısal değerleri aktar
  for (const field of ['valence', 'arousal', 'dominance']) {
    if (song[field] !== undefined && song[field] !== null) {
      cleaned[field] = parseFloat(song[field]);
    }
  }
  
  // Ruh hali (mood) düzeltme
  if (song.mood) {
    if (typeof song.mood === 'string') {
      cleaned.mood = [normalizeTurkish(song.mood)];
    } else if (Array.isArray(song.mood)) {
      cleaned.mood = song.mood.map(m => normalizeTurkish(String(m)));
    }
  }
  
  // Türkçe şarkı kontrolü
  if (song.id && String(song.id).startsWith('tr_')) {
    cleaned.isTurkish = true;
  }
  
  // Oluşturulma tarihi ekle
  cleaned.createdAt = new Date();
  
  return cleaned;
}

// Veri yükleme fonksiyonu
async function uploadSongs() {
  try {
    console.log(`JSON dosyası okunuyor: ${DATA_PATH}`);
    
    // Tabloların varlığını kontrol et ve oluştur
    const tablesReady = await ensureTables();
    if (!tablesReady) {
      console.error('Tablolar hazırlanamadı, işlem durduruluyor.');
      return;
    }
    
    // Veri dosyasını oku
    const rawData = fs.readFileSync(DATA_PATH, 'utf8');
    const data = JSON.parse(rawData);
    
    // Şarkı listesini al
    let songs = [];
    if (Array.isArray(data)) {
      songs = data;
    } else if (data.songs && Array.isArray(data.songs)) {
      songs = data.songs;
    } else {
      console.error('Geçerli şarkı verisi bulunamadı.');
      return;
    }
    
    // Yüklenecek şarkı sayısını sınırla
    const totalSongs = Math.min(songs.length, MAX_SONGS);
    console.log(`Toplam ${totalSongs} şarkı yüklenecek.`);
    
    // İstatistikler
    let successCount = 0;
    let errorCount = 0;
    let processedCount = 0;
    
    // Şarkıları parçalar halinde işle
    for (let i = 0; i < totalSongs; i += BATCH_SIZE) {
      const batch = songs.slice(i, i + BATCH_SIZE);
      
      // İlerleme bilgisi
      const batchInfo = `${i+1}-${Math.min(i+BATCH_SIZE, totalSongs)} / ${totalSongs}`;
      console.log(`İşleniyor: ${batchInfo}`);
      
      // Şarkıları temizle ve normalize et
      const cleanedBatch = batch.map(cleanSongData);
      
      try {
        // Xata'ya toplu ekleme
        await xataClient.db.songs.create(cleanedBatch);
        successCount += cleanedBatch.length;
      } catch (error) {
        console.error(`Batch yükleme hatası (${batchInfo}):`, error.message);
        
        // Tek tek eklemeyi dene
        for (const song of cleanedBatch) {
          try {
            await xataClient.db.songs.create(song);
            successCount++;
          } catch (songError) {
            console.error(`Şarkı yükleme hatası (${song.id}):`, songError.message);
            errorCount++;
          }
        }
      }
      
      processedCount += batch.length;
      const percent = ((processedCount / totalSongs) * 100).toFixed(2);
      console.log(`İlerleme: %${percent} (${successCount} başarılı, ${errorCount} başarısız)`);
    }
    
    console.log('\nVeri yükleme işlemi tamamlandı:');
    console.log(`Toplam işlenen: ${processedCount} şarkı`);
    console.log(`Başarıyla yüklenen: ${successCount} şarkı`);
    console.log(`Hata nedeniyle yüklenemeyen: ${errorCount} şarkı`);
    
  } catch (error) {
    console.error('Veri yükleme sırasında hata oluştu:', error);
  }
}

// Ana fonksiyon
async function main() {
  console.log('Music Assistant - Xata Veri Yükleme Başlatılıyor');
  
  try {
    await uploadSongs();
    console.log('İşlem tamamlandı.');
  } catch (error) {
    console.error('Beklenmeyen hata:', error);
  }
}

// Betiği çalıştır
main().catch(console.error);
