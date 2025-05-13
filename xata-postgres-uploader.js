// Music Assistant - Xata PostgreSQL Uploader
// Bu script PostgreSQL-etkin Xata veritabanlarına veri yükler
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const https = require('https');

// Xata API bilgileri
const XATA_API_KEY = process.env.XATA_API_KEY || 'xau_BJzzy94NsG0clOMuEXDC6747Qi2r07mJ0';
const XATA_DATABASE_URL = process.env.XATA_DATABASE_URL || 'https://Osman-zdo-an-s-workspace-rbheop.eu-central-1.xata.sh/db/music_assistant:main';

// Xata API bilgilerini URL'den ayıklama
const URL_PARTS = XATA_DATABASE_URL.match(/https:\/\/([^.]+)\.([^.]+)\.xata\.sh\/db\/([^:]+):?([^/]*)/i);
const XATA_WORKSPACE = process.env.XATA_WORKSPACE || (URL_PARTS ? URL_PARTS[1] : 'Osman-zdo-an-s-workspace-rbheop');
const XATA_REGION = process.env.XATA_REGION || (URL_PARTS ? URL_PARTS[2] : 'eu-central-1');
const XATA_DB_NAME = process.env.XATA_DB_NAME || (URL_PARTS ? URL_PARTS[3] : 'music_assistant');
const XATA_BRANCH = process.env.XATA_BRANCH || (URL_PARTS && URL_PARTS[4] ? URL_PARTS[4] : 'main');

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
        try {
          let parsedData;
          try {
            parsedData = JSON.parse(responseData);
          } catch (e) {
            parsedData = responseData;
          }
          
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsedData);
          } else {
            reject({
              statusCode: res.statusCode,
              message: parsedData
            });
          }
        } catch (e) {
          reject(e);
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

// PostgreSQL tabanlı Xata için SQL sorgusu oluşturma
async function createSongsTablePostgres() {
  try {
    const apiUrl = `https://api.xata.io/workspaces/${XATA_WORKSPACE}/dbs/${XATA_DB_NAME}/branches/${XATA_BRANCH}/sql`;
    
    const headers = {
      'Authorization': `Bearer ${XATA_API_KEY}`,
      'Content-Type': 'application/json'
    };
    
    const createTableSQL = `
    CREATE TABLE IF NOT EXISTS songs (
      id TEXT PRIMARY KEY,
      title TEXT,
      artist TEXT,
      album TEXT,
      genre TEXT,
      youtubeUrl TEXT,
      coverUrl TEXT,
      valence FLOAT,
      arousal FLOAT,
      dominance FLOAT,
      mood TEXT[],
      isTurkish BOOLEAN
    );
    `;
    
    console.log(`PostgreSQL-etkin Xata için 'songs' tablosu oluşturuluyor...`);
    console.log(`API URL: ${apiUrl}`);
    
    try {
      const result = await makeHttpRequest(apiUrl, 'POST', { statement: createTableSQL }, headers);
      console.log("Tablo başarıyla oluşturuldu:", result);
      return true;
    } catch (error) {
      console.error("Tablo oluşturma hatası:", error);
      
      // Tablo zaten varsa devam et
      let errorMsg = '';
      if (error.message) {
        if (typeof error.message === 'string') {
          errorMsg = error.message;
        } else if (error.message.message) {
          errorMsg = error.message.message;
        }
      }
      
      if (errorMsg.includes('already exists')) {
        console.log("Tablo zaten var, devam ediliyor...");
        return true;
      }
      
      // 404 hatası durumunda farklı bir URL yapısı deneyelim
      if (error.statusCode === 404) {
        console.log("404 Hatası: Farklı bir URL yapısı deneniyor...");
        try {
          // Alternatif URL yapısı
          const altApiUrl = `https://${XATA_WORKSPACE}.${XATA_REGION}.xata.sh/db/${XATA_DB_NAME}:${XATA_BRANCH}/tables/songs`;
          console.log(`Alternatif URL: ${altApiUrl}`);
          
          // Tablo oluşturmak için PUT isteği
          const tableSchema = {
            columns: {
              id: { type: 'string' },
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
              isTurkish: { type: 'bool' }
            }
          };
          
          const result = await makeHttpRequest(altApiUrl, 'PUT', tableSchema, headers);
          console.log("Tablo başarıyla oluşturuldu (alternatif):", result);
          return true;
        } catch (altError) {
          console.error("Alternatif tablo oluşturma hatası:", altError);
        }
      }
      
      return false;
    }
  } catch (error) {
    console.error("Tablo oluşturma hatası:", error);
    return false;
  }
}

// PostgreSQL tabanlı Xata için toplu veri ekleme
async function insertBatchPostgres(batch) {
  const apiUrl = `https://api.xata.io/workspaces/${XATA_WORKSPACE}/dbs/${XATA_DB_NAME}/branches/${XATA_BRANCH}/sql`;
  
  const headers = {
    'Authorization': `Bearer ${XATA_API_KEY}`,
    'Content-Type': 'application/json'
  };
  
  // Toplu ekleme için SQL hazırla
  let insertSQL = 'INSERT INTO songs (id, title, artist, album, genre, youtubeUrl, coverUrl, valence, arousal, dominance, mood, isTurkish) VALUES ';
  const values = [];
  const params = [];
  
  batch.forEach((song, index) => {
    // Parametre indeksleri oluştur
    const paramIndices = [
      index * 12 + 1, // id
      index * 12 + 2, // title
      index * 12 + 3, // artist
      index * 12 + 4, // album
      index * 12 + 5, // genre
      index * 12 + 6, // youtubeUrl
      index * 12 + 7, // coverUrl
      index * 12 + 8, // valence
      index * 12 + 9, // arousal
      index * 12 + 10, // dominance
      index * 12 + 11, // mood
      index * 12 + 12  // isTurkish
    ];
    
    // SQL değerlerini oluştur
    values.push(`($${paramIndices[0]}, $${paramIndices[1]}, $${paramIndices[2]}, $${paramIndices[3]}, $${paramIndices[4]}, $${paramIndices[5]}, $${paramIndices[6]}, $${paramIndices[7]}, $${paramIndices[8]}, $${paramIndices[9]}, $${paramIndices[10]}, $${paramIndices[11]})`);
    
    // Mood alanını diziye dönüştür
    let mood = song.mood || [];
    if (!Array.isArray(mood)) {
      mood = [mood];
    }
    
    // Parametreleri ekle
    params.push(
      song.id || `song_${Date.now()}_${index}`,
      song.title || '',
      song.artist || '',
      song.album || '',
      song.genre || '',
      song.youtubeUrl || '',
      song.coverUrl || '',
      song.valence || 0.5,
      song.arousal || 0.5,
      song.dominance || 0.5,
      mood,
      song.isTurkish || false
    );
  });
  
  insertSQL += values.join(', ');
  insertSQL += ' ON CONFLICT (id) DO NOTHING;';
  
  try {
    const result = await makeHttpRequest(apiUrl, 'POST', { 
      statement: insertSQL,
      params: params
    }, headers);
    
    return { success: true, result };
  } catch (error) {
    console.error("SQL ekleme hatası:", error);
    return { success: false, error };
  }
}

// Şarkıları yükle
async function uploadSongs() {
  try {
    // Tabloyu oluştur veya kontrol et
    const tableReady = await createSongsTablePostgres();
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
    
    // Aynı anda işlenecek şarkı sayısı - PostgreSQL için daha küçük batch boyutu
    const BATCH_SIZE = 25;
    
    // Tüm şarkıları işle
    const songsToProcess = songs;
    console.log(`Toplam ${songsToProcess.length} şarkı işlenecek`);
    
    // İstatistikler
    let uploadedCount = 0;
    let errorCount = 0;
    let batchCount = 0;
    
    // Şarkıları gruplar halinde işle
    for (let i = 0; i < songsToProcess.length; i += BATCH_SIZE) {
      const batch = songsToProcess.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(songsToProcess.length / BATCH_SIZE);
      
      console.log(`Grup ${batchNumber}/${totalBatches} işleniyor: ${i+1}-${Math.min(i+BATCH_SIZE, songsToProcess.length)} / ${songsToProcess.length}`);
      
      // Şarkıları normalize et
      const normalizedBatch = batch.map(normalizeSong);
      
      // PostgreSQL toplu ekleme işlemi
      try {
        const result = await insertBatchPostgres(normalizedBatch);
        
        if (result.success) {
          console.log(`Grup ${batchNumber}: ${normalizedBatch.length} şarkı başarıyla eklendi.`);
          uploadedCount += normalizedBatch.length;
        } else {
          console.error(`Grup ${batchNumber} eklenirken hata oluştu.`);
          errorCount += normalizedBatch.length;
        }
      } catch (error) {
        console.error(`Grup ${batchNumber} işlenirken beklenmeyen hata:`, error);
        errorCount += normalizedBatch.length;
      }
      
      batchCount++;
      
      // İlerleme durumunu göster
      const progress = (100 * (i + batch.length) / songsToProcess.length).toFixed(2);
      console.log(`İlerleme: %${progress} (${uploadedCount} başarılı, ${errorCount} başarısız)`);
      
      // Her 10 grup işlendikten sonra daha uzun bir bekleme yap
      if (batchCount % 10 === 0) {
        console.log("10 grup işlendi, kısa bir mola veriliyor...");
        await new Promise(resolve => setTimeout(resolve, 3000));
      } else {
        // Rate limiting sorunlarını önlemek için kısa bir bekleme
        await new Promise(resolve => setTimeout(resolve, 500));
      }
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
  console.log("Music Assistant - Xata PostgreSQL Uploader");
  console.log("PostgreSQL-etkin Xata veritabanına şarkı yükleme işlemi başlatılıyor...");
  
  await uploadSongs();
}

// Betiği çalıştır
main().catch(console.error);
