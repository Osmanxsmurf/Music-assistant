// Music Assistant - Xata Şarkı Yükleyici
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { XataClient } = require('@xata.io/client');

// Xata istemcisini yapılandır
const xata = new XataClient({
  apiKey: process.env.XATA_API_KEY,
  databaseURL: process.env.XATA_DATABASE_URL
});

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

// Şarkıları yükle
async function uploadSongs() {
  try {
    // Ham JSON dosyasını kullan
    const dataPath = process.env.SONGS_FILE_PATH || path.join(__dirname, '..', 'data', 'all_songs_merged.json');
    if (!fs.existsSync(dataPath)) {
      console.error(`Veri dosyası bulunamadı: ${dataPath}`);
      console.error("Lütfen önce 'data/check_data_quality.py' betiğini çalıştırın.");
      return;
    }
    
    // Toplam şarkı kontrolü
    console.log(`Dosya okunuyor: ${dataPath}`);
    const fileContent = fs.readFileSync(dataPath, 'utf8');
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
    
    // Aynı anda işlenecek şarkı sayısı (Xata bulk insert sınırı)
    const BATCH_SIZE = 50;
    
    // Tüm şarkıları işleyeceğiz
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
        // Xata bulk create API'sini kullan
        const result = await xata.db.songs.create(normalizedBatch);
        
        console.log(`${result.length} şarkı başarıyla eklendi.`);
        uploadedCount += result.length;
      } catch (error) {
        console.error(`Toplu ekleme hatası:`, error.message);
        
        // Hata durumunda tek tek eklemeyi dene
        console.log("Şarkılar tek tek eklenmeye çalışılıyor...");
        for (const song of normalizedBatch) {
          try {
            await xata.db.songs.create(song);
            uploadedCount++;
          } catch (singleError) {
            console.error(`Şarkı eklenemedi (${song.id}): ${singleError.message}`);
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

// Şarkıları oku ve analizle - Yükleme yapmadan
async function analyzeSongs() {
  try {
    // Veri dosyasını kontrol et
    const dataPath = process.env.SONGS_FILE_PATH || path.join(__dirname, '..', 'data', 'all_songs_fixed.json');
    if (!fs.existsSync(dataPath)) {
      console.error(`Veri dosyası bulunamadı: ${dataPath}`);
      console.error("Lütfen önce 'data/check_data_quality.py' betiğini çalıştırın.");
      return;
    }
    
    console.log(`Dosya okunuyor: ${dataPath}`);
    const fileContent = fs.readFileSync(dataPath, 'utf8');
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
    
    // İlk 5 şarkıyı göster
    console.log("\nÖrnek şarkılar:");
    songs.slice(0, 5).forEach((song, index) => {
      console.log(`\nŞarkı ${index + 1}:`);
      console.log(JSON.stringify(song, null, 2));
    });
    
    // Türkçe karakter sorunu olabilecek şarkıları kontrol et
    console.log("\nTürkçe karakter sorunu olabilecek şarkılar:");
    const potentialIssues = songs.filter(s => 
      (s.title && s.title.includes('Ä')) || 
      (s.artist && s.artist.includes('Ä')) ||
      (s.mood && s.mood.includes('Ä'))
    ).slice(0, 5);
    
    if (potentialIssues.length > 0) {
      potentialIssues.forEach((song, index) => {
        console.log(`\nSorunlu Şarkı ${index + 1}:`);
        console.log(`ID: ${song.id}`);
        console.log(`Başlık: ${song.title}`);
        console.log(`Sanatçı: ${song.artist}`);
        if (song.mood) console.log(`Ruh hali: ${song.mood}`);
        
        // Düzeltilmiş versiyonu göster
        const fixed = normalizeSong(song);
        console.log("\nDüzeltilmiş Versiyonu:");
        console.log(`Başlık: ${fixed.title}`);
        console.log(`Sanatçı: ${fixed.artist}`);
        if (fixed.mood) console.log(`Ruh hali: ${fixed.mood}`);
      });
    } else {
      console.log("Hiç sorunlu şarkı bulunamadı!");
    }
    
  } catch (error) {
    console.error("Analiz sırasında hata:", error);
  }
}

// Ana fonksiyon
async function main() {
  const command = process.argv[2] || 'analyze';
  
  console.log("Music Assistant - Xata Şarkı Yükleyici");
  console.log(`Komut: ${command}`);
  
  if (command === 'upload') {
    // Şarkıları Xata'ya yükle
    await uploadSongs();
  } else if (command === 'analyze') {
    // Şarkı verilerini analiz et ve örnekle
    await analyzeSongs();
  } else {
    console.log("Geçersiz komut. Kullanım: 'node xata-song-uploader.js [analyze|upload]'");
  }
}

// Betiği çalıştır
main().catch(console.error);
