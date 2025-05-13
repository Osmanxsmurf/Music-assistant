// Müzik öneri algoritmaları
// Bu dosya, Müzik Asistanı'nın akıllı öneri sistemini içerir

// Seed değeri üzerinden rastgele sayı üretimi için yardımcı fonksiyon
const seedrandom = (seed) => {
  const x =
    Math.sin(
      seed
        .toString()
        .split('')
        .reduce((a, b) => a + b.charCodeAt(0), 0)
    ) * 10000;
  return () => x - Math.floor(x);
};

// Mantıklı şarkı önerileri oluştur
export const getPersonalizedRecommendations = (userProfile, count = 5) => {
  // Öneriler için ağırlık belirleme
  const likedGenres = userProfile.likedGenres || [];
  const likedArtists = userProfile.likedArtists || [];
  const recentMoods = userProfile.recentMoods || ['mutlu']; // Varsayılan olarak 'mutlu'

  // Örnek bir veri yapısı
  const recommendations = [];

  // Top 100 popüler şarkı havuzundan seçim yap
  const songPool = generateMockSongDatabase(100);

  // Kullanıcının tercihlerine göre önerileri puanla ve sırala
  const scoredSongs = songPool.map((song) => {
    let score = 0;

    // Tür eşleşmesi
    if (likedGenres.some((genre) => song.genres.includes(genre))) {
      score += 5;
    }

    // Sanatçı eşleşmesi
    if (likedArtists.includes(song.artist)) {
      score += 10;
    }

    // Ruh hali eşleşmesi
    if (recentMoods.some((mood) => song.moods.includes(mood))) {
      score += 3;
    }

    // Popülerlik skoru (0.0-1.0 arası)
    score += song.popularity * 2;

    return { ...song, score };
  });

  // En yüksek skorlu şarkıları seç
  const topRecommendations = scoredSongs.sort((a, b) => b.score - a.score).slice(0, count);

  return topRecommendations;
};

// Kullanıcı için günlük öneriler oluştur
export const getDailyRecommendations = (songs, count = 10) => {
  // Bugünün tarihi için sabit bir tohum değeri oluştur
  const today = new Date();
  const seed = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  const rng = seedrandom(seed);

  // Öneriler için tür dağılımı
  const genreDistribution = [
    { genre: 'pop', weight: 0.3 },
    { genre: 'rock', weight: 0.2 },
    { genre: 'türkçe pop', weight: 0.3 },
    { genre: 'hiphop', weight: 0.1 },
    { genre: 'electronic', weight: 0.1 },
  ];

  // Şarkı havuzundan rastgele, ancak günlük olarak sabit seçim yap
  return songs
    .filter((song) => {
      // Şarkı türü dağılımına göre filtreleme
      const randomValue = rng();
      let cumulativeWeight = 0;

      for (const { genre, weight } of genreDistribution) {
        cumulativeWeight += weight;
        if (randomValue < cumulativeWeight && song.genre && song.genre.includes(genre)) {
          return true;
        }
      }

      return false;
    })
    .slice(0, count); // Günlük önerilerde count şarkı göster
};

// Ruh haline göre şarkı önerileri
export const getMoodRecommendations = (userMood, songs, moodLexicon) => {
  // Kullanıcının ruh haline uygun türleri al
  const matchingGenres = moodLexicon[userMood] || [];

  if (matchingGenres.length === 0 || !songs || songs.length === 0) {
    return [];
  }

  // Ruh haline uygun şarkıları filtrele
  const matchingSongs = songs.filter((song) => {
    if (!song.genre) return false;

    // Şarkı türü ile eşleşen ruh hali türlerini kontrol et
    return matchingGenres.some((genre) => song.genre.toLowerCase().includes(genre.toLowerCase()));
  });

  // Eşleşen şarkı yoksa boş dizi döndür
  if (matchingSongs.length === 0) {
    return [];
  }

  // En fazla 10 şarkı döndür
  return matchingSongs.slice(0, 10);
};

// Konuşmayı takip eden sorular üretme
export const generateFollowUpQuestion = (mood) => {
  const followUps = {
    mutlu: [
      'Bugün sizi neşelendiren ne oldu?',
      'Mutlu hissettiğinizde dinlemeyi sevdiğiniz başka türler var mı?',
      'Ne tarz müzikler sizi daha mutlu eder?',
    ],
    üzgün: [
      'Kendinizi daha iyi hissetmek için ne tür müzikler sizi rahatlatır?',
      'Yavaş tempolu müzikleri mi yoksa enerjik parçaları mı tercih edersiniz?',
      'Müziğin ruh halinizi iyileştirdiğini hissediyor musunuz?',
    ],
    enerjik: [
      'Enerjinizi yüksek tutmak için hangi tür müzikler dinlemeyi seversiniz?',
      'Egzersiz yaparken müzik dinler misiniz?',
      'Enerji veren başka sanatçı önerilerine açık mısınız?',
    ],
    sakin: [
      'Rahatlamak için başka aktiviteler yaparken de müzik dinler misiniz?',
      'Akustik müzikler mi yoksa ambient sesler mi sizi daha çok rahatlatır?',
      'Sakinleştirici müziklerle birlikte nasıl bir ortam tercih edersiniz?',
    ],
  };

  // Eğer verilen ruh hali için takip sorusu yoksa genel sorular kullan
  const questions = followUps[mood] || [
    'Bu tarz müzikler hoşunuza gider mi?',
    'Başka nasıl müzik önerileri istersiniz?',
    'Yeni sanatçılar keşfetmeye açık mısınız?',
  ];

  // Rastgele bir soru seç
  return questions[Math.floor(Math.random() * questions.length)];
};

// Test için örnek şarkı veritabanı oluştur
const generateMockSongDatabase = (count) => {
  const genres = [
    'pop',
    'rock',
    'hip hop',
    'electronic',
    'türkçe pop',
    'jazz',
    'classical',
    'metal',
  ];
  const moods = ['mutlu', 'üzgün', 'enerjik', 'sakin', 'romantik', 'heyecanlı'];
  const artists = [
    'Tarkan',
    'Sezen Aksu',
    'Teoman',
    'MFÖ',
    'Duman',
    'Taylor Swift',
    'Ed Sheeran',
    'Billie Eilish',
    'The Weeknd',
    'Dua Lipa',
  ];

  return Array.from({ length: count }, (_, i) => ({
    id: `song_${i + 1}`,
    title: `Şarkı ${i + 1}`,
    artist: artists[Math.floor(Math.random() * artists.length)],
    genres: [genres[Math.floor(Math.random() * genres.length)]],
    moods: [moods[Math.floor(Math.random() * moods.length)]],
    popularity: Math.random(),
    releaseYear: 2000 + Math.floor(Math.random() * 23),
    youtubeUrl: `https://youtube.com/watch?v=example${i}`,
  }));
};
