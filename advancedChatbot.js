// Advanced Conversational AI Chatbot for Music Assistant
// Entegre edilmiş NLP ve bağlamsal konuşma yetenekleriyle gelişmiş yapay zeka sohbet sistemi

import { analyzeEmotion } from './emotionAI';
import { getAIRecommendations } from './musicAI';

// Sohbet geçmişi ve bağlam yönetimi için değişkenler
let conversationHistory = [];
let userPreferences = {};
let sessionContext = {};

// Türkçe karşılama mesajları
const greetingMessages = [
  'Merhaba! Bugün nasılsınız? Size hangi müziklerle yardımcı olabilirim?',
  'Hoş geldiniz! Müzik zevkiniz hakkında bana biraz bilgi verebilir misiniz?',
  'Selam! Müzik asistanınız olarak size nasıl yardımcı olabilirim?',
  'Merhaba! Bugün nasıl bir müzik modundasınız?',
  'Hoş geldiniz! Favori sanatçılarınız veya tarzlarınız nelerdir?',
];

// Türkçe yanıt şablonları
const responseTemplates = {
  greeting: [
    'Merhaba {name}! Bugün size nasıl yardımcı olabilirim?',
    'Hoş geldiniz! Müzik önerileri mi arıyorsunuz yoksa sohbet mi etmek istersiniz?',
    'Selam! Bugün hangi müzik türünü keşfetmek istersiniz?',
  ],
  music_recommendation: [
    'Size {genre} tarzında harika şarkılar önerebilirim. Örneğin {song} - {artist} nasıl olur?',
    '{mood} ruh halinize uygun olarak {artist} dinlemeyi deneyebilirsiniz.',
    'Şu anda {genre} kategorisinde trend olan {song} parçasını çok beğenebilirsiniz.',
  ],
  music_information: [
    '{artist} hakkında bilgi mi arıyorsunuz? {info}',
    '{song} şarkısı, {year} yılında {artist} tarafından yayınlandı ve {genre} tarzına ait.',
    "Bu parça, {artist}'in en popüler şarkılarından biri ve şu ana kadar {views} kez dinlendi.",
  ],
  casual_conversation: [
    'Bu konu hakkında konuşmak gerçekten keyifli! Müzik zevkiniz çok etkileyici.',
    'Benimle paylaştığınız için teşekkürler. Müzik konusunda başka merak ettiğiniz bir şey var mı?',
    'İlginç bir bakış açısı! Müzik tercihinizin kişiliğinizi yansıttığını düşünüyor musunuz?',
  ],
  fallback: [
    'Üzgünüm, tam olarak anlayamadım. Müzik önerileri, sanatçı bilgileri veya şarkı arama konusunda size yardımcı olabilirim.',
    'Bu konuda yeterli bilgim yok. Ama size müzik önerileri sunabilirim. Hangi tarzı seversiniz?',
    'Sanırım konuyu değiştirdik. Müzik hakkında konuşmaya geri dönmek ister misiniz?',
  ],
};

/**
 * Kullanıcı mesajını işleyip uygun yanıtı döndüren ana fonksiyon
 * @param {string} message - Kullanıcı mesajı
 * @param {Object} userData - Kullanıcı bilgileri ve tercihleri
 * @param {Array} songDatabase - Şarkı veritabanı
 * @returns {Promise<Object>} - Bot yanıtı
 */
async function processUserMessage(message, userData = {}, songDatabase = []) {
  try {
    // Kullanıcı verilerini güncelle
    updateUserPreferences(userData);

    // Mesajı geçmişe ekle
    addToConversationHistory('user', message);

    // Mesajı analiz et ve niyet belirle
    const analysis = await analyzeMessage(message);

    // Bağlama göre yanıt oluştur
    const response = await generateResponse(analysis, message, songDatabase);

    // Oluşturulan yanıtı geçmişe ekle
    addToConversationHistory('bot', response.text);

    return response;
  } catch (error) {
    console.error('Chatbot yanıt hatası:', error);
    return {
      text: 'Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.',
      songs: [],
      intent: 'error',
      confidence: 0,
    };
  }
}

/**
 * Kullanıcı tercihlerini günceller
 * @param {Object} userData - Kullanıcı verileri
 */
function updateUserPreferences(userData) {
  if (!userData) return;

  userPreferences = {
    ...userPreferences,
    ...userData,
    lastActive: new Date().toISOString(),
  };

  // Oturum bağlamını güncelle
  if (userData.currentSong) {
    sessionContext.lastPlayedSong = userData.currentSong;
  }

  if (userData.mood) {
    sessionContext.userMood = userData.mood;
  }
}

/**
 * Geçmiş konuşmaya mesaj ekler
 * @param {string} role - 'user' veya 'bot'
 * @param {string} message - Mesaj içeriği
 */
function addToConversationHistory(role, message) {
  // Geçmiş boyutunu sınırla (son 10 mesaj)
  if (conversationHistory.length > 20) {
    conversationHistory = conversationHistory.slice(-20);
  }

  conversationHistory.push({
    role,
    content: message,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Kullanıcı mesajını analiz eder
 * @param {string} message - Kullanıcı mesajı
 * @returns {Promise<Object>} - Analiz sonuçları
 */
async function analyzeMessage(message) {
  // Basit anahtar kelime analizi
  const lowerMessage = message.toLowerCase();

  // İntent (niyet) sınıflandırma
  let intent = 'conversation'; // varsayılan
  let confidence = 0.5;

  // Selamlama ifadeleri
  if (lowerMessage.match(/merhaba|selam|günaydın|iyi\s*günler|nasılsın/i)) {
    intent = 'greeting';
    confidence = 0.9;
  }
  // Müzik önerisi istekleri
  else if (lowerMessage.match(/öneri|öner|dinle|müzik|şarkı|parça|liste/i)) {
    intent = 'music_recommendation';
    confidence = 0.8;
  }
  // Belirli bir sanatçı hakkında soru
  else if (lowerMessage.match(/kim|kimdir|hakkında|ne\s*zaman|albüm|tarih/i)) {
    intent = 'music_information';
    confidence = 0.7;
  }
  // Duygu analizi
  else if (lowerMessage.match(/mutsuz|mutlu|hüzünlü|enerjik|sakin|üzgün|sevinçli/i)) {
    intent = 'mood_detection';
    confidence = 0.8;
  }
  // Kapanış ifadeleri
  else if (lowerMessage.match(/güle\s*güle|hoşça\s*kal|görüşürüz|bay\s*bay/i)) {
    intent = 'farewell';
    confidence = 0.9;
  }

  // Daha ileri analiz - duygu analizi ekle
  try {
    const emotionResults = await analyzeEmotion(message);

    return {
      intent,
      confidence,
      emotion: emotionResults.primaryEmotion,
      emotionConfidence: emotionResults.confidence,
      emotionScores: emotionResults.emotionScores,
      entities: extractEntities(message),
      messageLength: message.length,
    };
  } catch (error) {
    console.error('Mesaj analiz hatası:', error);
    return { intent, confidence, emotion: 'neutral', entities: [] };
  }
}

/**
 * Metinden varlıkları (sanatçı, tür, şarkı adı vb.) çıkarır
 * @param {string} message - Analiz edilecek mesaj
 * @returns {Object} - Çıkarılan varlıklar
 */
function extractEntities(message) {
  const lowerMessage = message.toLowerCase();
  const entities = {
    artists: [],
    genres: [],
    songs: [],
    moods: [],
    timeReferences: [],
  };

  // Basit kural tabanlı eşleştirmeler
  // NOT: Gerçek uygulamada, daha gelişmiş NER (Named Entity Recognition) kullanılmalıdır

  // Türkçe müzik türleri için basit kontrol
  const genres = [
    'pop',
    'rock',
    'jazz',
    'klasik',
    'hip hop',
    'rap',
    'metal',
    'türkü',
    'arabesk',
    'elektronik',
    'dans',
  ];
  genres.forEach((genre) => {
    if (lowerMessage.includes(genre)) {
      entities.genres.push(genre);
    }
  });

  // Ruh halleri için kontrol
  const moods = ['mutlu', 'üzgün', 'enerjik', 'sakin', 'hüzünlü', 'romantik', 'agresif', 'dingin'];
  moods.forEach((mood) => {
    if (lowerMessage.includes(mood)) {
      entities.moods.push(mood);
    }
  });

  // Zaman referansları
  if (lowerMessage.match(/bugün|şimdi|şu anda|günümüzde/i)) {
    entities.timeReferences.push('present');
  } else if (lowerMessage.match(/dün|geçen|eskiden|önceden/i)) {
    entities.timeReferences.push('past');
  } else if (lowerMessage.match(/yarın|gelecek|sonra|yakında/i)) {
    entities.timeReferences.push('future');
  }

  return entities;
}

/**
 * Analiz sonuçlarına göre yanıt oluşturur
 * @param {Object} analysis - Mesaj analizi sonuçları
 * @param {string} originalMessage - Orijinal kullanıcı mesajı
 * @param {Array} songDatabase - Şarkı veritabanı
 * @returns {Promise<Object>} - Oluşturulan yanıt
 */
async function generateResponse(analysis, originalMessage, songDatabase) {
  const { intent, emotion, entities } = analysis;
  let responseText = '';
  let recommendedSongs = [];

  // İntent'e göre yanıt stratejisi
  switch (intent) {
    case 'greeting':
      // Rastgele bir karşılama mesajı seç
      responseText = getRandomTemplate('greeting');
      // Kullanıcı ismini ekle (varsa)
      responseText = responseText.replace('{name}', userPreferences.name || '');
      break;

    case 'music_recommendation':
      // Duygu analizi ve varlıklara göre müzik önerisi
      try {
        const recommendationRequest = await getAIRecommendations(originalMessage, songDatabase, {
          favoriteGenres: userPreferences.favoriteGenres || [],
          recentArtists: userPreferences.recentArtists || [],
          avoidRepetition: true,
        });

        recommendedSongs = recommendationRequest.recommendations || [];

        if (recommendedSongs.length > 0) {
          // Öneri şablonunu özelleştir
          responseText = getRandomTemplate('music_recommendation')
            .replace('{genre}', entities.genres[0] || recommendedSongs[0].genre || '')
            .replace('{song}', recommendedSongs[0].title || '')
            .replace('{artist}', recommendedSongs[0].artist || '')
            .replace('{mood}', emotion || entities.moods[0] || '');

          // Açıklama ekle
          responseText += ' ' + recommendationRequest.explanation;
        } else {
          responseText =
            'Üzgünüm, belirttiğiniz kriterlere uygun şarkı bulamadım. Başka bir tür veya sanatçı deneyebilir misiniz?';
        }
      } catch (error) {
        console.error('Öneri hatası:', error);
        responseText =
          'Şu anda öneri sisteminde bir sorun yaşıyorum. Lütfen daha sonra tekrar deneyin.';
      }
      break;

    case 'music_information':
      // Sanatçı veya şarkı hakkında bilgi
      if (entities.artists.length > 0) {
        // Gerçek dünyada burası bir veritabanı sorgusu olacaktır
        const artistInfo = 'çok popüler bir sanatçıdır ve birçok hit şarkısı bulunmaktadır.';
        responseText = getRandomTemplate('music_information')
          .replace('{artist}', entities.artists[0])
          .replace('{info}', artistInfo)
          .replace('{song}', '')
          .replace('{year}', '')
          .replace('{genre}', '')
          .replace('{views}', '');
      } else if (entities.songs.length > 0) {
        responseText = 'Bu şarkı hakkında daha fazla bilgiyi yakında ekleyeceğim.';
      } else {
        responseText = 'Hangi sanatçı veya şarkı hakkında bilgi almak istiyorsunuz?';
      }
      break;

    case 'mood_detection':
      // Kullanıcının ruh haline göre yanıt ve öneriler
      responseText = `Şu anda ${emotion || entities.moods[0] || 'nötr'} hissettiğinizi anlıyorum. `;

      // Kullanıcının ruh haline uygun müzik önerisi
      try {
        const moodRecs = await getAIRecommendations(originalMessage, songDatabase, userPreferences);

        recommendedSongs = moodRecs.recommendations || [];

        if (recommendedSongs.length > 0) {
          responseText += `Bu ruh halinize uygun olarak ${recommendedSongs[0].title} - ${recommendedSongs[0].artist} gibi şarkılar dinleyebilirsiniz.`;
        } else {
          responseText +=
            'Bu ruh halinize uygun şarkılar için bana biraz daha bilgi verebilir misiniz?';
        }
      } catch (error) {
        console.error('Duygu önerisi hatası:', error);
        responseText += 'Ruh halinize uygun müzik önerileri için size yardımcı olabilirim.';
      }
      break;

    case 'farewell':
      responseText = 'Görüşmek üzere! İstediğiniz zaman müzik önerileri için bana yazabilirsiniz.';
      break;

    default:
      // Genel sohbet
      if (conversationHistory.length <= 2) {
        // İlk etkileşim için karşılama mesajlarından birini kullan
        responseText = greetingMessages[Math.floor(Math.random() * greetingMessages.length)];
      } else {
        // Varsayılan sohbet yanıtı
        responseText = getRandomTemplate('casual_conversation');
      }
  }

  // Eğer geçmiş boşsa, ilk karşılama mesajını gönder
  if (conversationHistory.length === 0) {
    responseText = greetingMessages[Math.floor(Math.random() * greetingMessages.length)];
  }

  return {
    text: responseText,
    songs: recommendedSongs,
    intent: intent,
    confidence: analysis.confidence,
    contextMaintained: true,
    emotion: emotion,
  };
}

/**
 * Belirli bir kategorideki şablon mesajlardan rastgele bir tanesi döndürür
 * @param {string} category - Şablon kategorisi
 * @returns {string} - Şablon mesaj
 */
function getRandomTemplate(category) {
  if (!responseTemplates[category] || responseTemplates[category].length === 0) {
    return responseTemplates.fallback[0];
  }

  return responseTemplates[category][
    Math.floor(Math.random() * responseTemplates[category].length)
  ];
}

/**
 * Konuşma geçmişini temizler
 */
function clearConversationHistory() {
  conversationHistory = [];
  sessionContext = {};
}

/**
 * Rastgele bir karşılama mesajı döndürür
 * @returns {string} - Karşılama mesajı
 */
function getRandomGreeting() {
  return greetingMessages[Math.floor(Math.random() * greetingMessages.length)];
}

// Dışa aktarılan fonksiyonlar
export {
  processUserMessage,
  clearConversationHistory,
  getRandomGreeting,
  addToConversationHistory,
};
