// İleri seviye NLP algoritmaları
// Bu dosya, Müzik Asistanı'nın doğal dil işleme yeteneklerini içerir

// Kullanıcı niyetini (intent) tespit etme
export const detectIntent = (text, params = {}) => {
  const { mood, sentiment, genres, artists } = params;

  // Temel niyetler
  if (text.match(/merhaba|selam|hey|hello|hi|nasılsın|naber/i)) {
    return 'greeting';
  }

  if (text.match(/öner|tavsiye|bul|keşfet|dinle/i)) {
    return 'recommendation';
  }

  if (text.match(/bilgi|kim|ne|nasıl|hangi|nedir|kimdir/i)) {
    return 'information';
  }

  if (text.match(/teşekk|sağol|eyvallah/i)) {
    return 'gratitude';
  }

  if (text.match(/çal|oynat|başlat|play/i)) {
    return 'playback';
  }

  if (artists && artists.length > 0) {
    return 'artist_query';
  }

  if (genres && genres.length > 0) {
    return 'genre_query';
  }

  if (mood) {
    return 'mood_query';
  }

  // Belirli bir niyet tespit edilemedi
  return 'general';
};

// Metinden varlıkları çıkarma (entities)
export const extractEntities = (text) => {
  // Çıkarılan varlıklar
  const entities = {
    years: [],
    numbers: [],
    timeExpressions: [],
    languages: [],
  };

  // Yıl ifadeleri (1980s, 90'lar, 2000'ler vb.)
  const yearMatches = text.match(/\b(19\d0'lar|20\d0'lar|\d0'lar|\d{4})\b/g);
  if (yearMatches) entities.years = yearMatches;

  // Dil ifadeleri
  const languageMatches = text.match(
    /\b(türkçe|ingilizce|ispanyolca|fransızca|almanca|korece|japonca)\b/gi
  );
  if (languageMatches) entities.languages = languageMatches.map((l) => l.toLowerCase());

  // Sayılar
  const numberMatches = text.match(/\b\d+\b/g);
  if (numberMatches) entities.numbers = numberMatches.map((n) => parseInt(n));

  // Zaman ifadeleri (sabah, akşam, gece vb.)
  const timeMatches = text.match(/\b(sabah|öğle|akşam|gece|gündüz|dün|yarın|bugün)\b/gi);
  if (timeMatches) entities.timeExpressions = timeMatches.map((t) => t.toLowerCase());

  return entities;
};

// Metin karmaşıklığını hesaplama
export const calculateTextComplexity = (text) => {
  // Basit bir metrik: kelime sayısı ve ortalama kelime uzunluğu
  const words = text.split(/\s+/);
  const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / (words.length || 1);

  // 1-10 arası bir karmaşıklık skoru döndür
  return Math.min(10, Math.max(1, words.length / 5 + avgWordLength / 2));
};

// Yapay zeka güven skorunu hesaplama
export const calculateConfidence = (intents, text, context) => {
  // Başlangıç güven skoru
  let confidence = 0.5;

  // Belirli bir niyet varsa güveni artır
  if (intents && intents.length > 0) confidence += 0.2;

  // Soru sormak genellikle düşük güven gerektiren bir durumdur
  if (text.includes('?')) confidence -= 0.1;

  // Yeterli uzunlukta bir girdi güveni artırır
  if (text.length > 15) confidence += 0.1;

  // 0-1 arasında sınırla
  return Math.min(1, Math.max(0, confidence));
};

// Takip konuları oluşturma
export const generateFollowUpTopics = (text, intent, context) => {
  switch (intent) {
    case 'greeting':
      return ['ruh hali', 'müzik önerileri', 'tür tercihleri'];
    case 'recommendation':
      return ['sanatçı bilgileri', 'benzer şarkılar', 'çalma listesi oluşturma'];
    case 'artist_query':
      return ['sanatçı hakkında bilgi', 'popüler şarkıları', 'benzer sanatçılar'];
    case 'genre_query':
      return ['tür özellikleri', 'popüler sanatçılar', 'alt türler'];
    default:
      return ['müzik önerileri', 'sanatçı keşfi', 'popüler şarkılar'];
  }
};

// İlk harfi büyük yapma
export const capitalizeFirstLetter = (string) => {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1);
};

// Diziden rastgele öğeler seçme
export const randomSelection = (array, count) => {
  if (!array || array.length === 0) return [];
  if (count >= array.length) return array;

  const result = [];
  const copy = [...array];

  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * copy.length);
    result.push(copy[randomIndex]);
    copy.splice(randomIndex, 1); // Seçilen öğeyi kaldır
  }

  return result;
};
