// Müzik Öneri Yapay Zeka Entegrasyonu
// Last.fm şarkı veritabanı ile birlikte çalışan gelişmiş öneri sistemi

import { analyzeEmotion } from './emotionAI';

/**
 * Duygu analizine göre şarkı önerileri getiren gelişmiş AI fonksiyonu
 * @param {string} text - Kullanıcının yazdığı metin
 * @param {Array} songs - Veritabanındaki şarkılar
 * @param {Object} userPreferences - Kullanıcı tercihleri (opsiyonel)
 * @returns {Promise<Array>} - Önerilen şarkılar
 */
async function getAIRecommendations(text, songs, userPreferences = {}) {
  try {
    // Duygu analizi yap
    const emotionAnalysis = await analyzeEmotion(text);

    // Kullanıcı tercihlerini ve duygu analiz sonuçlarını birleştir
    const combinedPreferences = combinePreferencesWithEmotion(userPreferences, emotionAnalysis);

    // Şarkıları filtreleme ve puanlama
    const scoredSongs = scoreAndFilterSongs(songs, combinedPreferences);

    // Çeşitlilik ekle (sadece bir sanatçıdan birden fazla şarkı olmasın)
    const diversifiedResults = addDiversity(scoredSongs);

    // Sonuçları döndür
    return {
      recommendations: diversifiedResults.slice(0, 10), // En iyi 10 öneriyi döndür
      emotionAnalysis: emotionAnalysis,
      explanation: generateExplanation(emotionAnalysis),
      userDominantGenres: getUserTastes(userPreferences),
    };
  } catch (error) {
    console.error('AI öneri hatası:', error);
    // Hata durumunda basit bir öneride bulun
    return {
      recommendations: getRandomSongs(songs, 5),
      emotionAnalysis: null,
      explanation: 'Şu anda zevkinize uygun rastgele öneriler sunuyoruz.',
      userDominantGenres: [],
    };
  }
}

/**
 * Kullanıcı tercihleri ile duygu analizini birleştirir
 * @param {Object} userPreferences - Kullanıcı tercihleri
 * @param {Object} emotionAnalysis - Duygu analizi sonuçları
 * @returns {Object} - Birleştirilmiş tercihler
 */
function combinePreferencesWithEmotion(userPreferences, emotionAnalysis) {
  // Tercih edilen türleri al
  const preferredGenres = userPreferences.favoriteGenres || [];

  // Duygu analizinden gelen müzik modlarını al
  const emotionMoods = emotionAnalysis.recommendedMusicMoods || [];

  // VAD değerlerini al (Valence, Arousal, Dominance)
  const vad = emotionAnalysis.emotionVAD || {
    valence: 0.5, // Olumlu/olumsuz
    arousal: 0.5, // Enerji seviyesi
    dominance: 0.5, // Etki gücü
  };

  // Kullanıcının tercih ağırlığı - 0.7 tercihlere, 0.3 duygu analizine
  const userWeight = userPreferences.historyWeight || 0.7;
  const emotionWeight = 1 - userWeight;

  return {
    genres: [...preferredGenres, ...emotionMoods],
    genreWeights: {
      userGenres: userWeight,
      emotionGenres: emotionWeight,
    },
    vad: vad,
    primaryEmotion: emotionAnalysis.primaryEmotion,
    recentArtists: userPreferences.recentArtists || [],
    recentGenres: userPreferences.recentGenres || [],
    skipRecentlyPlayed: userPreferences.avoidRepetition || false,
  };
}

/**
 * Şarkıları filtreleme ve puanlama algoritması
 * @param {Array} songs - Şarkı listesi
 * @param {Object} preferences - Kullanıcı tercihleri ve duygu analizi
 * @returns {Array} - Puanlanmış ve sıralanmış şarkılar
 */
function scoreAndFilterSongs(songs, preferences) {
  if (!songs || songs.length === 0) {
    return [];
  }

  const { genres, vad, primaryEmotion, recentArtists, skipRecentlyPlayed } = preferences;

  // Şarkıları puanla
  const scoredSongs = songs.map((song) => {
    let score = 0;

    // Tür eşleşmesi
    if (song.genre && genres.some((g) => song.genre.toLowerCase().includes(g.toLowerCase()))) {
      score += 2;
    }

    // Sanatçı önceden dinlenmişse küçük bir bonus ver
    if (song.artist && recentArtists.includes(song.artist)) {
      score += 0.5;
    }

    // Son zamanlarda çok dinlenmiş sanatçılardan kaçınma
    if (skipRecentlyPlayed && recentArtists.slice(0, 3).includes(song.artist)) {
      score -= 1;
    }

    // Duygu durumuna göre türler için bonus
    if (song.moods && song.moods.includes(primaryEmotion)) {
      score += 1.5;
    }

    // VAD değerlerine göre uygunluk
    // Bu değerler önceden hesaplanmış olmalı
    if (song.vad) {
      // VAD uygunluğunu ölç - değerler ne kadar yakınsa o kadar iyi
      const valenceDiff = Math.abs(song.vad.valence - vad.valence);
      const arousalDiff = Math.abs(song.vad.arousal - vad.arousal);
      const dominanceDiff = Math.abs(song.vad.dominance - vad.dominance);

      // Farkların ortalamasını al, küçük fark = yüksek puan
      const avgDiff = (valenceDiff + arousalDiff + dominanceDiff) / 3;
      score += (1 - avgDiff) * 3; // En fazla 3 puan ekle
    }

    return {
      ...song,
      score,
    };
  });

  // Puanlarına göre sırala
  return scoredSongs.sort((a, b) => b.score - a.score);
}

/**
 * Önerilerde çeşitlilik ekler
 * @param {Array} songs - Puanlanmış şarkılar
 * @returns {Array} - Çeşitlendirilmiş şarkılar
 */
function addDiversity(songs) {
  const result = [];
  const includedArtists = new Set();
  const remainingSongs = [];

  // İlk geçiş: Her sanatçıdan bir şarkı al
  for (const song of songs) {
    if (!includedArtists.has(song.artist)) {
      result.push(song);
      includedArtists.add(song.artist);
    } else {
      remainingSongs.push(song);
    }

    // 12 farklı sanatçı yeterli
    if (result.length >= 12) break;
  }

  // Kalan yüksek puanlı şarkıları ekle
  const topRemaining = remainingSongs.sort((a, b) => b.score - a.score).slice(0, 8);

  return [...result, ...topRemaining];
}

/**
 * Öneri açıklaması oluşturur
 * @param {Object} emotionAnalysis - Duygu analizi sonuçları
 * @returns {string} - Kullanıcıya gösterilecek açıklama
 */
function generateExplanation(emotionAnalysis) {
  const emotion = emotionAnalysis.primaryEmotion;
  const explanations = {
    joy: 'Pozitif ruh halinize uygun, enerjik ve mutluluk veren şarkılar önerdik.',
    sadness: 'Melankolik ruh halinize eşlik edecek, duygusal ve derinlikli şarkılar seçtik.',
    anger: 'Güçlü enerjinize uygun, yoğun ve dinamik parçalar bulduk.',
    fear: 'Şu an yaşadığınız duygulara sakinleştirici ve rahatlatıcı müzikler önerdik.',
    disgust: 'Alternatif ve farklı tarzlarda müzikler keşfetmenizi önerdik.',
    surprise: 'Keşfetme ruhunuza uygun, farklı ve sürpriz etkisi yaratacak parçalar seçtik.',
    neutral: 'Dengeli ruh halinize uygun, çeşitli türlerde müzikler önerdik.',
  };

  return explanations[emotion] || 'Size özel müzik önerileri hazırladık.';
}

/**
 * Kullanıcının baskın müzik zevklerini belirler
 * @param {Object} userPreferences - Kullanıcı tercihleri
 * @returns {Array} - Baskın türler
 */
function getUserTastes(userPreferences) {
  if (!userPreferences.favoriteGenres || userPreferences.favoriteGenres.length === 0) {
    return ['Pop', 'Rock']; // Varsayılan
  }

  return userPreferences.favoriteGenres.slice(0, 3); // En sevilen 3 tür
}

/**
 * Rastgele şarkı seçer
 * @param {Array} songs - Şarkı listesi
 * @param {number} count - Şarkı sayısı
 * @returns {Array} - Rastgele şarkılar
 */
function getRandomSongs(songs, count) {
  if (!songs || songs.length === 0) {
    return [];
  }

  const shuffled = [...songs].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Dışa aktarılan fonksiyonlar
export { getAIRecommendations, scoreAndFilterSongs, addDiversity };
