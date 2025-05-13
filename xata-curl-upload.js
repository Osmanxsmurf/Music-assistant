// Music Assistant - Curl ile Xata Veri Yükleme Betiği
// Bu betik curl komutlarını kullanarak all_songs_merged.json verisini Xata'ya yükler

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

// util.promisify kullanarak exec'i Promise döndüren hale getirelim
const execPromise = util.promisify(exec);

// Yapılandırma
const config = {
  apiKey: process.env.XATA_API_KEY || 'xau_BJzzy94NsG0clOMuEXDC6747Qi2r07mJ0',
  databaseUrl: process.env.XATA_DATABASE_URL || 'https://Osman-zdo-an-s-workspace-rbheop.eu-central-1.xata.sh/db/music_assistant:main',
  tableName: 'songs',
  dataPath: path.join(__dirname, '..', 'data', 'all_songs_merged.json'),
  batchSize: 10, // Her curl komutunda gönderilecek şarkı sayısı
  maxSongs: 100000 // İşlenecek maksimum şarkı sayısı
};

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
  
  return cleaned;
}

// Curl komutu oluşturma
function createCurlCommand(records) {
  const dataJson = JSON.stringify({ records });
  
  // Çift tırnak yerine tek tırnak kullanarak PowerShell uyumluluğu sağlıyoruz
  const command = `curl.exe --request POST --url "${config.databaseUrl}/tables/${config.tableName}/insert" ` +
                 `--header "Authorization: Bearer ${config.apiKey}" ` +
                 `--header "Content-Type: application/json" ` +
                 `--data '${dataJson.replace(/'/g, "'\\''")}' ` +  // Single quote escape for PowerShell
                 `--connect-timeout 30`;
  
  return command;
}

// curl ile veri yükleme
async function uploadWithCurl() {
  try {
    console.log(`JSON dosyası okunuyor: ${config.dataPath}`);
    
    // Veri dosyasını oku
    const rawData = fs.readFileSync(config.dataPath, 'utf8');
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
    const totalSongs = Math.min(songs.length, config.maxSongs);
    console.log(`Toplam ${totalSongs} şarkı işlenecek.`);
    
    // İstatistikler
    let successCount = 0;
    let errorCount = 0;
    let processedCount = 0;
    
    // Veritabanı bağlantısını test et
    console.log('Xata bağlantısı test ediliyor...');
    const testCommand = `curl.exe --request GET --url "${config.databaseUrl}/tables" ` +
                       `--header "Authorization: Bearer ${config.apiKey}"`;
    
    try {
      const { stdout, stderr } = await execPromise(testCommand);
      console.log('Bağlantı başarılı!', stdout);
    } catch (error) {
      console.error('Xata bağlantı testi başarısız:', error.message);
      if (error.stderr) console.error('Stderr:', error.stderr);
      return;
    }
    
    // Şarkıları parçalar halinde işle
    for (let i = 0; i < totalSongs; i += config.batchSize) {
      const batch = songs.slice(i, i + config.batchSize);
      
      // İlerleme bilgisi
      const batchInfo = `${i+1}-${Math.min(i+config.batchSize, totalSongs)} / ${totalSongs}`;
      console.log(`İşleniyor: ${batchInfo}`);
      
      // Şarkıları temizle ve normalize et
      const cleanedBatch = batch.map(cleanSongData);
      
      // curl komutu oluştur ve çalıştır
      const curlCommand = createCurlCommand(cleanedBatch);
      
      try {
        // Curl komutunu çalıştır
        const { stdout, stderr } = await execPromise(curlCommand);
        console.log('Curl yanıtı:', stdout);
        
        // Başarılı sayısını güncelle
        successCount += cleanedBatch.length;
      } catch (error) {
        console.error(`Batch yükleme hatası (${batchInfo}):`, error.message);
        errorCount += cleanedBatch.length;
        
        // Hata detaylarını göster
        if (error.stdout) console.log('Stdout:', error.stdout);
        if (error.stderr) console.error('Stderr:', error.stderr);
      }
      
      processedCount += batch.length;
      const percent = ((processedCount / totalSongs) * 100).toFixed(2);
      console.log(`İlerleme: %${percent} (${successCount} başarılı, ${errorCount} başarısız)`);
      
      // Xata rate limit'i için bekleme
      await new Promise(resolve => setTimeout(resolve, 500));
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
  console.log('Music Assistant - Curl ile Xata Veri Yükleme Başlatılıyor');
  console.log(`API Anahtarı: ${config.apiKey.substring(0, 8)}...`);
  console.log(`Veritabanı URL: ${config.databaseUrl}`);
  
  try {
    await uploadWithCurl();
    console.log('İşlem tamamlandı.');
  } catch (error) {
    console.error('Beklenmeyen hata:', error);
  }
}

// Betiği çalıştır
main().catch(console.error);
