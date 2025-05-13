// Music Assistant - Xata HTTP Uploader
// Bu script doğrudan HTTP istekleri kullanarak Xata veritabanına veri yükler
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const https = require('https');

// Xata API bilgileri
const XATA_API_KEY = process.env.XATA_API_KEY || 'xau_BJzzy94NsG0clOMuEXDC6747Qi2r07mJ0';
const XATA_DATABASE_URL = process.env.XATA_DATABASE_URL || 'https://Osman-zdo-an-s-workspace-rbheop.eu-central-1.xata.sh/db/music_assistant';

// Veri dosyası yolu
const DATA_PATH = process.env.SONGS_FILE_PATH || path.join(__dirname, '..', 'data', 'all_songs_merged.json');

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

// Şarkı verilerini normalize et
function normalizeSong(song) {
  const normalized = {};
  
  // ID alanını ele al
  if (song.id) {
    normalized.id = song.id.toString().replace(/\s+/g, '_');
  }
  
  // Temel alanları normalize et
  if (song.title) normalized.title = normalizeTurkish(song.title);
  if (song.artist) normalized.artist = normalizeTurkish(song.artist);
  if (song.album) normalized.album = normalizeTurkish(song.album);
  if (song.genre) normalized.genre = normalizeTurkish(song.genre);
  
  // URL alanlarını direkt kopyala
  if (song.youtubeUrl) normalized.youtubeUrl = song.youtubeUrl;
  if (song.coverUrl) normalized.coverUrl = song.coverUrl;
  
  // Sayısal değerleri yönet
  if (song.valence !== undefined) normalized.valence = parseFloat(song.valence) || 0.5;
  if (song.arousal !== undefined) normalized.arousal = parseFloat(song.arousal) || 0.5;
  if (song.dominance !== undefined) normalized.dominance = parseFloat(song.dominance) || 0.5;
  
  // Mood (ruh hali) alanını düzenle
  if (song.mood) {
    if (typeof song.mood === 'string') {
      normalized.mood = [normalizeTurkish(song.mood)];
    } else if (Array.isArray(song.mood)) {
      normalized.mood = song.mood.map(m => normalizeTurkish(m.toString()));
    }
  }
  
  // Türkçe şarkı mı belirleme
  normalized.isTurkish = song.id && song.id.toString().startsWith('tr_') ? true : false;
  
  return normalized;
}

// HTTP POST isteği yapmak için yardımcı fonksiyon
function makeHttpRequest(url, method, data, headers) {
  return new Promise((resolve, reject) => {
    // URL'den hostname ve path çıkar
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: headers
    };
    
    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsedData = JSON.parse(responseData);
            resolve(parsedData);
          } catch (e) {
            resolve(responseData);
          }
        } else {
          reject({
            statusCode: res.statusCode,
            message: responseData
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Tabloyu oluştur
async function createSongsTable() {
  try {
    const url = `${XATA_DATABASE_URL}/tables/songs`;
    const headers = {
      'Authorization': `Bearer ${XATA_API_KEY}`,
      'Content-Type': 'application/json'
    };
    
    // Tablo yapısı
    const tableSchema = {
      columns: {
        title: { type: 'string' },
        artist: { type: 'string' },
        album: { type: 'string' },
        genre: { type: 'string' },
        youtubeUrl: { type: 'string' },
        coverUrl: { type: 'string' },
        valence: { type: 'float' },
        arousal: { type: 'float' },
        dominance: { type: 'float' },
        mood: { type: 'multiple' },
        isTurkish: { type: 'bool', defaultValue: false }
      }
    };
    
    console.log("Şarkılar tablosu oluşturuluyor...");
    
    try {
      const result = await makeHttpRequest(url, 'PUT', tableSchema, headers);
      console.log("Tablo başarıyla oluşturuldu:", result);
      return true;
    } catch (error) {
      if (error.statusCode === 422) {
        console.log("Tablo zaten var, devam ediliyor...");
        return true;
      } else {
        console.error("Tablo oluşturma hatası:", error);
        return false;
      }
    }
  } catch (error) {
    console.error("Tablo oluşturma hatası:", error);
    return false;
  }
}

// Şarkıları yükle
async function uploadSongs() {
  try {
    // Tabloyu oluştur veya kontrol et
    const tableReady = await createSongsTable();
    if (!tableReady) {
      console.error("Tablo oluşturulamadı, işlem durduruluyor.");
      return;
    }
    
    // Veri dosyasını kontrol et
    if (!fs.existsSync(DATA_PATH)) {
      console.error(`Veri dosyası bulunamadı: ${DATA_PATH}`);
      return;
    }
    
    // Dosyayı oku
    console.log(`Dosya okunuyor: ${DATA_PATH}`);
    const fileContent = fs.readFileSync(DATA_PATH, 'utf8');
    const data = JSON.parse(fileContent);
    
    // Şarkı verisini al
    let songs = [];
    if (data.songs && Array.isArray(data.songs)) {
      songs = data.songs;
    } else if (Array.isArray(data)) {
      songs = data;
    } else {
      console.error("Geçerli şarkı verisi bulunamadı.");
      return;
    }
    
    console.log(`Toplam ${songs.length} şarkı bulundu.`);
    
    // Aynı anda işlenecek şarkı sayısı
    const BATCH_SIZE = 50;
    
    // Tüm şarkıları işle
    const songsToProcess = songs;
    console.log(`Toplam ${songsToProcess.length} şarkı işlenecek`);
    
    // İstatistikler
    let uploadedCount = 0;
    let errorCount = 0;
    
    // Şarkıları gruplar halinde işle
    for (let i = 0; i < songsToProcess.length; i += BATCH_SIZE) {
      const batch = songsToProcess.slice(i, i + BATCH_SIZE);
      console.log(`Grup işleniyor: ${i+1}-${Math.min(i+BATCH_SIZE, songsToProcess.length)} / ${songsToProcess.length}`);
      
      // Şarkıları normalize et
      const normalizedBatch = batch.map(normalizeSong);
      
      try {
        // Xata API'sine istek yap
        const url = `${XATA_DATABASE_URL}/tables/songs/bulk`;
        const headers = {
          'Authorization': `Bearer ${XATA_API_KEY}`,
          'Content-Type': 'application/json'
        };
        
        const bulkData = {
          records: normalizedBatch
        };
        
        const result = await makeHttpRequest(url, 'POST', bulkData, headers);
        
        if (result && result.length) {
          console.log(`${result.length} şarkı başarıyla eklendi.`);
          uploadedCount += result.length;
        } else {
          console.log("Beklenmeyen API yanıtı:", result);
        }
      } catch (error) {
        console.error(`Toplu ekleme hatası:`, error.message || error);
        
        // Hata durumunda tek tek eklemeyi dene
        console.log("Şarkılar tek tek eklenmeye çalışılıyor...");
        for (const song of normalizedBatch) {
          try {
            const url = `${XATA_DATABASE_URL}/tables/songs/data`;
            const headers = {
              'Authorization': `Bearer ${XATA_API_KEY}`,
              'Content-Type': 'application/json'
            };
            
            await makeHttpRequest(url, 'POST', song, headers);
            uploadedCount++;
          } catch (singleError) {
            console.error(`Şarkı eklenemedi (${song.id}): ${singleError.message || singleError}`);
            errorCount++;
          }
        }
      }
      
      // İlerleme durumunu göster
      const progress = (100 * (i + batch.length) / songsToProcess.length).toFixed(2);
      console.log(`İlerleme: %${progress} (${uploadedCount} başarılı, ${errorCount} başarısız)`);
      
      // Rate limiting sorunlarını önlemek için kısa bir bekleme
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Sonuçları göster
    console.log(`\nŞarkı yükleme işlemi tamamlandı:`);
    console.log(`- Toplam işlenen: ${songsToProcess.length}`);
    console.log(`- Başarıyla yüklenen: ${uploadedCount}`);
    console.log(`- Başarısız olanlar: ${errorCount}`);
    
  } catch (error) {
    console.error("İşlem sırasında beklenmeyen hata:", error);
  }
}

// Ana fonksiyon
async function main() {
  console.log("Music Assistant - Xata HTTP Uploader");
  console.log("Şarkıları Xata veritabanına yükleme işlemi başlatılıyor...");
  
  await uploadSongs();
}

// Betiği çalıştır
main().catch(console.error);
