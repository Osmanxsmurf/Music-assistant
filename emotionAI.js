// Hugging Face Duygu Analizi AI Entegrasyonu
// j-hartmann/emotion-english-distilroberta-base modeli kullanıyoruz
// Bu model 7 temel duyguyu tespit eder: kızgınlık, iğrenme, korku, mutluluk, tarafsız, üzüntü, şaşkınlık

/**
 * Hugging Face API'ye metin gönderip duygu analizi yapan fonksiyon
 * @param {string} text - Analiz edilecek metin
 * @returns {Promise<Object>} - Duygu analizi sonuçları
 */
async function analyzeEmotion(text) {
  try {
    // Türkçe metni İngilizce'ye çevir (opsiyonel)
    // Eğer çeviriye gerek yoksa doğrudan metni kullan
    const translatedText = await translateIfNeeded(text);

    // API isteği için hazırlan
    const response = await fetch(
      'https://api-inference.huggingface.co/models/j-hartmann/emotion-english-distilroberta-base',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // NOT: Gerçek bir API anahtarı buraya yerleştirilmeli
          // Güvenlik açısından .env dosyasında saklamanız önerilir
          Authorization: 'Bearer hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        },
        body: JSON.stringify({ inputs: translatedText }),
      }
    );

    if (!response.ok) {
      throw new Error(`API isteği başarısız: ${response.statusText}`);
    }

    const result = await response.json();

    // Sonuçları formatlı bir şekilde döndür
    const emotions = result[0];

    // Duygular ve müzik modları arasında eşleştirme
    return mapEmotionsToMusicMoods(emotions);
  } catch (error) {
    console.error('Duygu analizi hatası:', error);
    // Hata durumunda varsayılan değer döndür
    return {
      primaryEmotion: 'neutral',
      emotionScores: [],
      recommendedMusicMoods: ['pop', 'rock'],
      confidence: 0.5,
    };
  }
}

/**
 * Gerekirse Türkçe metni İngilizce'ye çevirir
 * @param {string} text - Çevirilecek metin
 * @returns {Promise<string>} - Çevrilmiş metin
 */
async function translateIfNeeded(text) {
  // Türkçe karakterleri içeriyorsa çeviri yapılması gerekebilir
  const turkishChars = /[çğıöşüÇĞİÖŞÜ]/;

  if (turkishChars.test(text)) {
    try {
      // Burada gerçek çeviri API'si kullanılabilir
      // Örnek olarak basit bir istek gösteriliyor:
      /*
      const response = await fetch("https://api.mymemory.translated.net/get", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        params: {
          q: text,
          langpair: "tr|en"
        }
      });
      const data = await response.json();
      return data.responseData.translatedText;
      */

      // Şimdilik çeviri yapmadan geri dönüyoruz
      return text;
    } catch (error) {
      console.error('Çeviri hatası:', error);
      return text; // Hata durumunda orijinal metni döndür
    }
  }

  return text; // Türkçe karakter yoksa doğrudan döndür
}

/**
 * Duygu sonuçlarını müzik kategorilerine eşleştirir
 * @param {Array} emotions - Duygu analizi sonuçları
 * @returns {Object} - Müzik önerileri için formatlı veriler
 */
function mapEmotionsToMusicMoods(emotions) {
  // En yüksek skora sahip duyguyu bul
  let maxEmotion = emotions[0];
  for (const emotion of emotions) {
    if (emotion.score > maxEmotion.score) {
      maxEmotion = emotion;
    }
  }

  // Duygulara göre müzik modları eşleştirmesi
  const emotionToMusicMap = {
    joy: ['pop', 'dance', 'upbeat', 'happy', 'energetic'],
    sadness: ['acoustic', 'ballad', 'blues', 'slow', 'melancholic'],
    anger: ['rock', 'metal', 'intense', 'aggressive'],
    fear: ['ambient', 'soundtrack', 'instrumental'],
    disgust: ['punk', 'industrial', 'alternative'],
    surprise: ['experimental', 'electronic', 'fusion'],
    neutral: ['pop', 'rock', 'jazz', 'indie'],
  };

  // Valence (olumlu/olumsuz), Arousal (enerji) ve Dominance (yoğunluk) değerleri
  // Bu değerler 0-1 arasında olmalı ve müzik özelliklerini belirler
  const emotionToVAD = {
    joy: { valence: 0.9, arousal: 0.7, dominance: 0.6 },
    sadness: { valence: 0.2, arousal: 0.3, dominance: 0.3 },
    anger: { valence: 0.3, arousal: 0.9, dominance: 0.8 },
    fear: { valence: 0.2, arousal: 0.7, dominance: 0.3 },
    disgust: { valence: 0.2, arousal: 0.6, dominance: 0.5 },
    surprise: { valence: 0.7, arousal: 0.8, dominance: 0.5 },
    neutral: { valence: 0.5, arousal: 0.5, dominance: 0.5 },
  };

  return {
    primaryEmotion: maxEmotion.label,
    emotionScores: emotions,
    recommendedMusicMoods: emotionToMusicMap[maxEmotion.label] || emotionToMusicMap.neutral,
    emotionVAD: emotionToVAD[maxEmotion.label] || emotionToVAD.neutral,
    confidence: maxEmotion.score,
  };
}

/**
 * Metinden türlere göre müzik önerisi yapar
 * @param {string} text - Girilen metin
 * @returns {Promise<Object>} - Öneri sonuçları
 */
async function getRecommendationsByText(text) {
  // Duygu analizini yap
  const emotionResults = await analyzeEmotion(text);

  // Sonuçları döndür
  return {
    sourceText: text,
    ...emotionResults,
    timestamp: new Date().toISOString(),
  };
}

// Dışa aktarılan fonksiyonlar
export { analyzeEmotion, getRecommendationsByText };
