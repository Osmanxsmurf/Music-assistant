// Music Assistant AI Entegrasyonları
// Duygu analizi, müzik öneri ve animasyon entegrasyonları

import { getAIRecommendations } from './musicAI';
import { analyzeEmotion } from './emotionAI';

/**
 * Ana AI entegrasyon fonksiyonu
 * @param {string} userInput - Kullanıcı girdisi
 * @param {Array} songDatabase - Şarkı veritabanı
 * @param {Object} userPreferences - Kullanıcı tercihleri
 * @returns {Promise<Object>} - AI yanıtı
 */
async function processMusicAIRequest(userInput, songDatabase, userPreferences = {}) {
  try {
    // 1. Kullanıcı metnini analiz et
    const emotionResults = await analyzeEmotion(userInput);

    // 2. Duygu analizine göre müzik önerisi al
    const musicRecommendations = await getAIRecommendations(
      userInput,
      songDatabase,
      userPreferences
    );

    // 3. Sonuçları formatlı bir şekilde döndür
    return formatAIResponse(emotionResults, musicRecommendations, userInput);
  } catch (error) {
    console.error('AI işleme hatası:', error);
    // Hata durumunda basit bir yanıt oluştur
    return {
      responseMessage: 'Şu anda müzik önerisi sağlarken bir sorun oluştu. Lütfen tekrar deneyin.',
      songRecommendations: [],
      emotionDetails: null,
      durationMs: 0,
      animationClass: 'neutral-animation',
    };
  }
}

/**
 * AI yanıtlarını formatlar
 * @param {Object} emotionResults - Duygu analizi sonuçları
 * @param {Object} musicRecommendations - Müzik önerileri
 * @param {string} userInput - Kullanıcı girdisi
 * @returns {Object} - Formatlanmış yanıt
 */
function formatAIResponse(emotionResults, musicRecommendations, userInput) {
  // Duyguya göre özelleştirilmiş mesaj şablonları
  const messageTemplates = {
    joy: [
      'Mutlu hissetmenize sevindim! İşte size harika şarkılar:',
      'Harika bir ruh hali için harika müzikler. Umarım bu önerilerim size enerji verir:',
      'Pozitif enerjinize yakışır müzik önerileri hazırladım:',
    ],
    sadness: [
      'Duygularınızı anladım, bu şarkılar ruh halinize eşlik edebilir:',
      'Bazen üzgün hissetmek normaldir. Bu şarkılar belki size iyi gelebilir:',
      'Hislerinize dokunan birkaç parça seçtim:',
    ],
    anger: [
      'Bu enerjiyi anlıyorum. İşte size uygun müzik önerileri:',
      'Bu duyguyla baş etmenize yardımcı olabilecek güçlü parçalar:',
      'Enerjinizi yansıtan, güçlü ritimlere sahip şarkılar buldum:',
    ],
    fear: [
      'Endişelerinizi hafifletebilecek sakinleştirici müzikler:',
      'Kendinizi daha güvende hissetmenize yardımcı olabilecek müzikler:',
      'Sizi rahatlatabilecek, daha huzurlu bir ruh haline geçmenizi sağlayacak parçalar seçtim:',
    ],
    surprise: [
      'Şaşkınlığınıza eşlik edecek ilginç müzik keşifleri:',
      'İşte sizi biraz daha şaşırtabilecek, ilginç parçalar:',
      'Beklenmedik müzik maceraları için önerilerim:',
    ],
    disgust: [
      'Farklı bir müzikal deneyim için alternatif önerilerim:',
      'Belki bir çeşitlilik sizi daha iyi hissettirebilir. İşte farklı tarzda öneriler:',
      'Müzikal perspektifinizi değiştirebilecek öneriler hazırladım:',
    ],
    neutral: [
      'İşte size özel seçtiğim müzik önerileri:',
      'Dengeli bir müzik deneyimi için bu şarkıları dinleyebilirsiniz:',
      'Keyifli vakit geçirmeniz için önerilerim:',
    ],
  };

  // Duyguya göre animasyon sınıfları
  const emotionAnimations = {
    joy: 'joy-animation',
    sadness: 'sadness-animation',
    anger: 'anger-animation',
    fear: 'fear-animation',
    surprise: 'surprise-animation',
    disgust: 'pulse',
    neutral: 'fade-in',
  };

  // Ana duyguyu al
  const primaryEmotion = emotionResults.primaryEmotion || 'neutral';

  // İlgili duygudaki mesaj şablonlarından rastgele seç
  const templates = messageTemplates[primaryEmotion] || messageTemplates.neutral;
  const randomTemplate = templates[Math.floor(Math.random() * templates.length)];

  // Önerilen şarkılar
  const songs = musicRecommendations.recommendations || [];

  // Yanıt mesajı
  let responseMessage = randomTemplate;
  if (songs.length === 0) {
    responseMessage =
      'Şu anda müzik önerisi bulamadım, ama beğenebileceğiniz başka türler deneyebilirim.';
  }

  // Açıklama ekle
  if (musicRecommendations.explanation) {
    responseMessage += ' ' + musicRecommendations.explanation;
  }

  return {
    responseMessage: responseMessage,
    songRecommendations: songs.slice(0, 5), // En iyi 5 öneri
    emotionDetails: {
      primary: primaryEmotion,
      scores: emotionResults.emotionScores,
      confidence: emotionResults.confidence,
    },
    userInput: userInput,
    animationClass: emotionAnimations[primaryEmotion] || 'fade-in',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Şarkı veritabanına VAD (Valence, Arousal, Dominance) değerleri ekler
 * @param {Array} songs - Şarkı veritabanı
 * @returns {Array} - VAD değerleri eklenmiş şarkılar
 */
function enhanceSongsWithVAD(songs) {
  if (!songs || !Array.isArray(songs)) return [];

  // Bazı tür-duygu eşleştirmeleri
  const genreToVAD = {
    pop: { valence: 0.7, arousal: 0.6, dominance: 0.5 },
    rock: { valence: 0.6, arousal: 0.8, dominance: 0.7 },
    metal: { valence: 0.4, arousal: 0.9, dominance: 0.8 },
    jazz: { valence: 0.6, arousal: 0.5, dominance: 0.5 },
    blues: { valence: 0.4, arousal: 0.4, dominance: 0.4 },
    classical: { valence: 0.5, arousal: 0.3, dominance: 0.5 },
    electronic: { valence: 0.6, arousal: 0.7, dominance: 0.6 },
    dance: { valence: 0.8, arousal: 0.8, dominance: 0.6 },
    'hip hop': { valence: 0.6, arousal: 0.7, dominance: 0.7 },
    'r&b': { valence: 0.7, arousal: 0.5, dominance: 0.5 },
    reggae: { valence: 0.8, arousal: 0.4, dominance: 0.5 },
    country: { valence: 0.6, arousal: 0.5, dominance: 0.5 },
    folk: { valence: 0.5, arousal: 0.4, dominance: 0.4 },
    indie: { valence: 0.5, arousal: 0.6, dominance: 0.4 },
    alternative: { valence: 0.5, arousal: 0.6, dominance: 0.5 },
    punk: { valence: 0.5, arousal: 0.9, dominance: 0.7 },
    chill: { valence: 0.7, arousal: 0.3, dominance: 0.4 },
    ambient: { valence: 0.5, arousal: 0.2, dominance: 0.3 },
    sad: { valence: 0.2, arousal: 0.3, dominance: 0.3 },
    happy: { valence: 0.9, arousal: 0.7, dominance: 0.6 },
    'türkçe pop': { valence: 0.7, arousal: 0.6, dominance: 0.5 },
    arabesk: { valence: 0.3, arousal: 0.5, dominance: 0.4 },
  };

  // Varsayılan VAD değerleri
  const defaultVAD = { valence: 0.5, arousal: 0.5, dominance: 0.5 };

  return songs.map((song) => {
    // Halihazırda VAD değerleri varsa, değiştirme
    if (song.vad) return song;

    let vad = { ...defaultVAD };

    // Şarkının türüne göre VAD değerlerini belirle
    if (song.genre) {
      const lowerGenre = song.genre.toLowerCase();

      // Her eşleşen tür için VAD değerlerini güncelle
      Object.keys(genreToVAD).forEach((genreKey) => {
        if (lowerGenre.includes(genreKey)) {
          const genreVAD = genreToVAD[genreKey];
          // Türe göre değerleri ağırlıklandırarak VAD değerlerini oluştur
          vad.valence = (vad.valence + genreVAD.valence) / 2;
          vad.arousal = (vad.arousal + genreVAD.arousal) / 2;
          vad.dominance = (vad.dominance + genreVAD.dominance) / 2;
        }
      });

      // Şarkı adında belirli kelimeler varsa VAD değerlerini ayarla
      const songTitle = song.title ? song.title.toLowerCase() : '';
      const keywords = {
        happy: { valence: +0.2 },
        sad: { valence: -0.2 },
        love: { valence: +0.1 },
        angry: { arousal: +0.2 },
        slow: { arousal: -0.2 },
        fast: { arousal: +0.2 },
        chill: { arousal: -0.1, valence: +0.1 },
        power: { dominance: +0.2 },
        soft: { arousal: -0.1, dominance: -0.1 },
      };

      Object.keys(keywords).forEach((key) => {
        if (songTitle.includes(key)) {
          Object.keys(keywords[key]).forEach((prop) => {
            vad[prop] += keywords[key][prop];
          });
        }
      });

      // Değer aralığını 0-1 arası sınırla
      vad.valence = Math.max(0, Math.min(1, vad.valence));
      vad.arousal = Math.max(0, Math.min(1, vad.arousal));
      vad.dominance = Math.max(0, Math.min(1, vad.dominance));
    }

    // Sonuçta oluşan VAD değerlerini şarkıya ekle
    return {
      ...song,
      vad,
    };
  });
}

// Dışarı aktarma
export { processMusicAIRequest, enhanceSongsWithVAD };
