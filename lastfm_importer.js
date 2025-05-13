// Last.fm API'den 5 milyon şarkı çekme ve veritabanına ekleme işlemi
// API Key: b31bc18f527499bcfc5a7891fa0d1770
// Creator: osmanxsmurf

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// API Ayarları
const API_KEY = 'ed0f28ee6e2da02b1796c1bce3d85535';
const API_SECRET = '43b7e7967ba6f2510394db06eac3d110';
const API_BASE_URL = 'https://ws.audioscrobbler.com/2.0/';

// Türkçe sanatçılar listesi (popülerlik sırasına göre)
const turkishArtists = [
  'Tarkan',
  'Sezen Aksu',
  'Murat Boz',
  'Sıla',
  'Hadise',
  'Gökhan Türkmen',
  'Mabel Matiz',
  'Sertab Erener',
  'Yalın',
  'Kenan Doğulu',
  'Gülşen',
  'Emre Aydın',
  'Barış Manço',
  'MFÖ',
  'Teoman',
  'Cem Karaca',
  'Yaşar',
  'Mustafa Sandal',
  'Ceza',
  'Duman',
  'Hayko Cepkin',
  'Demet Akalın',
  'Edis',
  'Hande Yener',
  'Aleyna Tilki',
  'Müslüm Gürses',
  'İbrahim Tatlıses',
  'Ferdi Tayfur',
  'Ajda Pekkan',
  'Emrah',
  'Ebru Gündeş',
  'Orhan Gencebay',
  'Athena',
  'Manga',
  'Mor ve Ötesi',
  'Cem Adrian',
  'Buray',
  'Murat Dalkılıç',
];

// Popüler dünya sanatçıları
const worldArtists = [
  'The Beatles',
  'Queen',
  'Michael Jackson',
  'Madonna',
  'Coldplay',
  'Ed Sheeran',
  'Taylor Swift',
  'Drake',
  'Rihanna',
  'Beyoncé',
  'Adele',
  'Ariana Grande',
  'Eminem',
  'Bruno Mars',
  'Dua Lipa',
  'Billie Eilish',
  'Post Malone',
  'The Weeknd',
  'BTS',
  'Justin Bieber',
  'Lady Gaga',
  'David Bowie',
  'Pink Floyd',
  'Led Zeppelin',
  'Elton John',
  'AC/DC',
  'Mariah Carey',
  'U2',
  'Metallica',
  'Nirvana',
  'Radiohead',
  'Daft Punk',
];

// Tür etiketleri (tür tahmini için)
const genreMap = {
  pop: 'Pop',
  rock: 'Rock',
  türkçe: 'Türkçe Pop',
  turkish: 'Türkçe Pop',
  turk: 'Türkçe Pop',
  'turkish pop': 'Türkçe Pop',
  'hip hop': 'Hip Hop',
  rap: 'Hip Hop',
  electronic: 'Elektronik',
  dance: 'Dance',
  caz: 'Jazz',
  jazz: 'Jazz',
  klasik: 'Klasik',
  classical: 'Klasik',
  arabesk: 'Arabesk',
  folk: 'Folk',
  türkü: 'Türkü',
  halk: 'Türkü',
};

// Dosya işlemleri için değişkenler
const DATA_DIR = path.join(__dirname, '../data');
const SONGS_FILE = path.join(__dirname, '../public/songs.json');
const BATCH_SIZE = 10000; // Her seferde kaydedilecek şarkı sayısı
const MAX_SONGS = 500000; // Toplam hedef şarkı sayısı
let processedSongs = 0;
let totalSongs = 0;
let savedSongs = [];

// Başlamadan önce data klasörünü oluştur
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Konsola renkli log yazma fonksiyonu
const log = {
  info: (msg) => console.log(`\x1b[36m[INFO]\x1b[0m ${msg}`),
  success: (msg) => console.log(`\x1b[32m[SUCCESS]\x1b[0m ${msg}`),
  error: (msg) => console.log(`\x1b[31m[ERROR]\x1b[0m ${msg}`),
  warning: (msg) => console.log(`\x1b[33m[WARNING]\x1b[0m ${msg}`),
  progress: (current, total) => {
    const percent = ((current / total) * 100).toFixed(2);
    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);
    process.stdout.write(
      `\x1b[35m[PROGRESS]\x1b[0m ${current.toLocaleString()} / ${total.toLocaleString()} (${percent}%)`
    );
  },
};

// Last.fm API'ye istek atma fonksiyonu
async function callLastFmApi(method, params = {}) {
  try {
    const response = await axios.get(API_BASE_URL, {
      params: {
        method,
        api_key: API_KEY,
        format: 'json',
        ...params,
      },
    });
    return response.data;
  } catch (error) {
    log.error(`API isteği başarısız: ${error.message}`);
    if (error.response) {
      log.error(
        `Durum kodu: ${error.response.status}, Mesaj: ${JSON.stringify(error.response.data)}`
      );
    }
    return null;
  }
}

// Şarkı-Sanatçı uyumunu kontrol etme
function verifyArtistSongMatch(artistName, songTitle, genre) {
  // Türkçe sanatçılar için yabancı şarkı adı kontrolü
  if (
    turkishArtists.includes(artistName) &&
    !/[ğüşıöçĞÜŞİÖÇ]/.test(songTitle) &&
    !/türk|turkish/.test(genre.toLowerCase())
  ) {
    return false;
  }

  // Aşırı uyumsuz tür-sanatçı kombinasyonları
  if (
    (artistName === 'Tarkan' && genre === 'Heavy Metal') ||
    (artistName === 'Metallica' && genre === 'Türkçe Pop')
  ) {
    return false;
  }

  return true;
}

// Şarkı verisini temiz bir formatta hazırlama
function processSongData(track, tags = [], similarTracks = []) {
  try {
    if (!track.name || !track.artist) {
      return null;
    }

    const artistName = track.artist.name || track.artist;
    const songTitle = track.name;

    // Ortalama dinlenme ve puanlar
    const listeners = parseInt(track.listeners || '0', 10);
    const playcount = parseInt(track.playcount || '0', 10);

    // Popülerlik skoru (0-1 arası)
    const popularity = Math.min(listeners / 1000000, 1);

    // YouTube URL'i (gerçek olmayan örnek link)
    const youtubeUrl = `https://www.youtube.com/watch?v=example${Math.floor(Math.random() * 100000)}`;

    // Albüm kapak resmi
    let coverUrl =
      'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png'; // Varsayılan

    if (track.album && track.album.image && track.album.image.length > 0) {
      const images = track.album.image;
      // En büyük albüm kapağı resmini bul
      for (const img of images) {
        if (img.size === 'large' || img.size === 'extralarge') {
          coverUrl = img['#text'];
          break;
        }
      }
    }

    // Tür belirle (tag'lere bakarak)
    let genre = 'Pop'; // Varsayılan

    if (tags && tags.length > 0) {
      // Tag'lerden genre belirle
      for (const tag of tags) {
        const tagName = tag.name.toLowerCase();
        if (genreMap[tagName]) {
          genre = genreMap[tagName];
          break;
        }
      }
    }

    // Türkçe sanatçılar için otomatik tür ataması
    if (turkishArtists.includes(artistName) && !/türk/i.test(genre)) {
      genre = 'Türkçe Pop';
    }

    // Uyumsuzluk kontrolü
    if (!verifyArtistSongMatch(artistName, songTitle, genre)) {
      log.warning(`Uyumsuz şarkı-sanatçı-tür: ${songTitle} - ${artistName} (${genre})`);
      return null;
    }

    // Duygu değerleri (rastgele - bu değerler daha sonra doğru şekilde belirlenebilir)
    // valence: mutluluk, arousal: enerji seviyesi, dominance: baskınlık
    const mood = {
      valence: parseFloat((Math.random() * 0.5 + 0.25).toFixed(2)),
      arousal: parseFloat((Math.random() * 0.5 + 0.25).toFixed(2)),
      dominance: parseFloat((Math.random() * 0.5 + 0.25).toFixed(2)),
    };

    return {
      id: totalSongs + 1,
      title: songTitle,
      artist: artistName,
      genre: genre,
      youtubeUrl,
      coverUrl,
      valence: mood.valence,
      arousal: mood.arousal,
      dominance: mood.dominance,
      popularity: popularity.toFixed(2),
    };
  } catch (error) {
    log.error(`Şarkı işleme hatası: ${error.message}`);
    return null;
  }
}

// Sanatçı için şarkıları çekme
async function getArtistTracks(artist, limit = 50) {
  log.info(`${artist} için şarkılar çekiliyor...`);
  try {
    const data = await callLastFmApi('artist.getTopTracks', {
      artist,
      limit,
    });

    if (!data || !data.toptracks || !data.toptracks.track) {
      log.warning(`${artist} için şarkı bulunamadı`);
      return [];
    }

    const tracks = data.toptracks.track;
    const results = [];

    for (const track of tracks) {
      // Her şarkı için detay bilgileri çek
      const trackInfo = await callLastFmApi('track.getInfo', {
        artist: track.artist.name,
        track: track.name,
      });

      // Tag'leri çek
      const trackTags =
        trackInfo && trackInfo.track && trackInfo.track.toptags ? trackInfo.track.toptags.tag : [];

      const processedTrack = processSongData(track, trackTags);
      if (processedTrack) {
        results.push(processedTrack);
      }

      // Toplam şarkı sayısı kontrolü
      totalSongs++;
      if (totalSongs >= MAX_SONGS) {
        return results;
      }

      // API rate limiti için bekle
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return results;
  } catch (error) {
    log.error(`Sanatçı şarkılarını çekme hatası: ${error.message}`);
    return [];
  }
}

// Tür bazlı şarkıları çekme
async function getGenreTracks(tag, limit = 100) {
  log.info(`${tag} türü için şarkılar çekiliyor...`);
  try {
    const data = await callLastFmApi('tag.getTopTracks', {
      tag,
      limit,
    });

    if (!data || !data.tracks || !data.tracks.track) {
      log.warning(`${tag} türü için şarkı bulunamadı`);
      return [];
    }

    const tracks = data.tracks.track;
    const results = [];

    for (const track of tracks) {
      // Tag bilgisi doğrudan verelim
      const tags = [{ name: tag }];

      const processedTrack = processSongData(track, tags);
      if (processedTrack) {
        results.push(processedTrack);
      }

      // Toplam şarkı sayısı kontrolü
      totalSongs++;
      if (totalSongs >= MAX_SONGS) {
        return results;
      }

      // API rate limiti için bekle
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return results;
  } catch (error) {
    log.error(`Tür şarkılarını çekme hatası: ${error.message}`);
    return [];
  }
}

// Toplu şarkı kaydetme işlemi
async function saveSongBatch() {
  const batchFile = path.join(
    DATA_DIR,
    `songs_batch_${Math.floor(processedSongs / BATCH_SIZE)}.json`
  );

  try {
    fs.writeFileSync(batchFile, JSON.stringify(savedSongs, null, 2));
    log.success(`${savedSongs.length} şarkı ${batchFile} dosyasına kaydedildi`);
    savedSongs = [];
  } catch (error) {
    log.error(`Şarkı batch kaydetme hatası: ${error.message}`);
  }
}

// Ana çalıştırma fonksiyonu
async function main() {
  log.info('Last.fm API entegrasyonu başlatılıyor...');
  log.info(`Hedef: ${MAX_SONGS.toLocaleString()} şarkı (Türkçe ağırlıklı)`);

  // Türkçe müzik oranı %60
  const turkishRatio = 0.6;

  // Önce mevcut şarkıları kontrol et (varsa)
  try {
    if (fs.existsSync(SONGS_FILE)) {
      const existingSongs = JSON.parse(fs.readFileSync(SONGS_FILE));
      log.info(`${existingSongs.length} mevcut şarkı bulundu.`);
      savedSongs = existingSongs;
      processedSongs = existingSongs.length;
      totalSongs = existingSongs.length;
    }
  } catch (error) {
    log.error(`Mevcut şarkıları okuma hatası: ${error.message}`);
  }

  // Sanatçı ve tür listelerini hazırla
  const artistsToProcess = [
    ...turkishArtists.slice(0, Math.ceil(turkishArtists.length * 0.8)),
    ...worldArtists.slice(0, Math.ceil(worldArtists.length * 0.4)),
  ];

  const genresToProcess = [
    'turkish pop',
    'türkçe pop',
    'pop',
    'rock',
    'hip hop',
    'electronic',
    'arabesk',
    'türkü',
    'folk',
    'classical',
  ];

  // Döngüye başla - sanatçı bazlı veri çekme
  for (const artist of artistsToProcess) {
    if (totalSongs >= MAX_SONGS) break;

    const artistTracks = await getArtistTracks(artist, 100);
    savedSongs.push(...artistTracks);
    processedSongs += artistTracks.length;

    log.progress(totalSongs, MAX_SONGS);

    // Her BATCH_SIZE kadar şarkıyı kaydet
    if (savedSongs.length >= BATCH_SIZE) {
      await saveSongBatch();
    }

    // API rate limit aşımını önlemek için bekle
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // Tür bazlı veri çekme
  for (const genre of genresToProcess) {
    if (totalSongs >= MAX_SONGS) break;

    const genreTracks = await getGenreTracks(genre, 200);
    savedSongs.push(...genreTracks);
    processedSongs += genreTracks.length;

    log.progress(totalSongs, MAX_SONGS);

    // Her BATCH_SIZE kadar şarkıyı kaydet
    if (savedSongs.length >= BATCH_SIZE) {
      await saveSongBatch();
    }

    // API rate limit aşımını önlemek için bekle
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // Kalan şarkıları kaydet
  if (savedSongs.length > 0) {
    await saveSongBatch();
  }

  // Tüm veriyi birleştirip ana song.json dosyasına yaz
  combineAllBatches();

  log.success(`Toplam ${totalSongs.toLocaleString()} şarkı başarıyla işlendi!`);
}

// Tüm batch dosyalarını birleştirip ana songs.json dosyasına yazma
function combineAllBatches() {
  log.info('Tüm şarkılar birleştiriliyor...');

  let allSongs = [];
  const batchFiles = fs.readdirSync(DATA_DIR).filter((file) => file.startsWith('songs_batch_'));

  for (const file of batchFiles) {
    try {
      const songs = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file)));
      allSongs.push(...songs);
      log.info(`${file} dosyasındaki ${songs.length} şarkı eklendi.`);
    } catch (error) {
      log.error(`${file} dosyasını okurken hata: ${error.message}`);
    }
  }

  // Tekrarlanan şarkıları temizle (id, artist-title kombinasyonu baz alınır)
  const uniqueSongs = [];
  const trackIds = new Set();

  for (const song of allSongs) {
    const trackId = `${song.artist}-${song.title}`.toLowerCase();
    if (!trackIds.has(trackId)) {
      trackIds.add(trackId);
      uniqueSongs.push(song);
    }
  }

  // Yeni id'ler ata
  uniqueSongs.forEach((song, index) => {
    song.id = index + 1;
  });

  // Ana songs.json dosyasına yaz
  try {
    fs.writeFileSync(SONGS_FILE, JSON.stringify(uniqueSongs, null, 2));
    log.success(`Toplam ${uniqueSongs.length} benzersiz şarkı songs.json dosyasına kaydedildi!`);
  } catch (error) {
    log.error(`Ana dosyaya yazma hatası: ${error.message}`);
  }
}

// Process başlat
main().catch((error) => {
  log.error(`Uygulama hatası: ${error.message}`);
  log.error(error.stack);
});
