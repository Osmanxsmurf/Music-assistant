// Xata Veritabanı İstemcisi
require('dotenv').config();

// Xata client modülünü içe aktar
let XataClient;
try {
  // @xata.io/client modülünü doğru şekilde içe aktar
  const xata = require('@xata.io/client');
  XataClient = xata.XataClient;
  
  if (!XataClient) {
    // Alternative import - older versions
    const { buildClient } = xata;
    XataClient = buildClient();
  }
} catch (error) {
  console.error('Xata modülü yüklenirken hata:', error.message);
  process.exit(1);
}

// API Anahtarı kontrolü
const apiKey = process.env.XATA_API_KEY;
if (!apiKey) {
  console.error('XATA_API_KEY çevre değişkeni tanımlanmamış. Lütfen .env dosyasını kontrol edin.');
  process.exit(1);
}

// Xata Client oluştur
const xataClient = new XataClient({
  apiKey,
  databaseURL: process.env.XATA_DATABASE_URL || process.env.DATABASE_URL,
  branch: process.env.XATA_BRANCH || undefined
});

console.log('Xata istemcisi başlatıldı.');
console.log(`Veritabanı URL: ${process.env.XATA_DATABASE_URL || process.env.DATABASE_URL}`);

// Uygun şema tanımları
const songSchema = {
  id: { type: 'string', unique: true },
  title: { type: 'string', notNull: true },
  artist: { type: 'string', notNull: true },
  album: { type: 'string' },
  genre: { type: 'string' },
  youtubeUrl: { type: 'string' },
  coverUrl: { type: 'string' },
  valence: { type: 'float' },
  arousal: { type: 'float' },
  dominance: { type: 'float' },
  mood: { type: 'multiple' },
  isTurkish: { type: 'bool', defaultValue: false },
  playCount: { type: 'int', defaultValue: 0 },
  createdAt: { type: 'datetime' }
};

// Xata tablosunu oluştur (eğer yoksa)
async function ensureTables() {
  try {
    console.log('Tablolar kontrol ediliyor...');
    
    // Mevcut tabloları kontrol et
    const tables = await xataClient.tables.getTables();
    console.log(`Mevcut tablolar: ${tables.tables.map(t => t.name).join(', ') || 'Yok'}`);
    
    // songs tablosu yoksa oluştur
    if (!tables.tables.find(t => t.name === 'songs')) {
      console.log('songs tablosu oluşturuluyor...');
      await xataClient.tables.createTable('songs', songSchema);
      console.log('songs tablosu oluşturuldu!');
    } else {
      console.log('songs tablosu zaten mevcut.');
    }
    
    return true;
  } catch (error) {
    console.error('Tablo oluşturma hatası:', error);
    return false;
  }
}

module.exports = {
  xataClient,
  ensureTables
};
