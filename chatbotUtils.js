// chatbotUtils.js - Gelişmiş Yapay Zeka Müzik Asistanı

import seedrandom from 'seedrandom';

// Gelişmiş doğal dil işleme ve yapay zeka kabiliyetleri
const AI_VERSION = '2.5.0';
const MODEL_SIZE = 'ADVANCED';

// Chatbot için bağlam ve durum yönetimi
const conversationContext = {
  history: [],
  userProfile: {
    preferences: {},
    likedGenres: [],
    likedArtists: [],
    dislikedGenres: [],
    dislikedArtists: [],
    recentInteractions: [],
  },
  sessionState: {
    activeRecommendations: [],
    lastQuery: '',
    mood: 'neutral',
    confidence: 0.8,
    followUpIntent: null,
  },
};

// Gelişmiş duygu durumları ve onlarla eşleşen müzik türleri sözlüğü
export const moodLexicon = {
  // Olumlu Duygular
  mutlu: ['pop', 'dance', 'happy', 'upbeat', 'türkçe pop', 'disco'],
  neşeli: ['pop', 'dance', 'happy', 'reggae', 'türkçe pop'],
  heyecanlı: ['rock', 'edm', 'electronic', 'dance', 'türk rock'],
  enerjik: ['rock', 'metal', 'edm', 'workout', 'gym', 'türk rock'],
  rahat: ['lofi', 'chill', 'ambient', 'acoustic', 'slow türkçe'],
  huzurlu: ['classical', 'ambient', 'acoustic', 'instrumental', 'türk sanat müziği'],
  romantik: ['love songs', 'slow', 'ballad', 'aşk şarkıları', 'slow türkçe'],
  nostaljik: ['80s', '90s', 'retro', 'nostalji', 'arabesk', 'türk sanat müziği'],

  // Olumsuz Duygular
  üzgün: ['sad', 'ballad', 'slow', 'acoustic', 'arabesk'],
  kızgın: ['metal', 'rock', 'hard rock', 'heavy metal', 'aggressive', 'rap', 'türk rock'],
  stresli: ['chill', 'ambient', 'meditation', 'instrumental', 'slow türkçe'],
  yalnız: ['sad', 'slow', 'acoustic', 'arabesk', 'aşk şarkıları'],
  yorgun: ['lofi', 'chill', 'ambient', 'slow', 'sleep', 'slow türkçe'],

  // Nötr Durumlar
  çalışma: ['focus', 'concentration', 'instrumental', 'study', 'lofi'],
  spor: ['workout', 'motivation', 'edm', 'electronic', 'gym'],
  parti: ['dance', 'party', 'edm', 'electronic', 'hip hop', 'club müzik'],
  seyahat: ['road trip', 'chill', 'acoustic', 'pop', 'karışık'],
  dinlenme: ['chill', 'lofi', 'ambient', 'relaxation', 'meditation', 'slow türkçe'],
  okuma: ['classical', 'instrumental', 'ambient', 'piano', 'instrumental'],
  uyku: ['sleep', 'ambient', 'meditation', 'soft', 'instrumental'],
};

// Türkçe metin analizi için basit NLP işlevleri
import {
  detectIntent,
  extractEntities,
  calculateTextComplexity,
  calculateConfidence,
  generateFollowUpTopics,
  capitalizeFirstLetter,
  randomSelection,
} from './nlpUtils.js';
import {
  getDailyRecommendations,
  getMoodRecommendations,
  generateFollowUpQuestion,
} from './recommendationUtils.js';

export const analyzeSentiment = (text) => {
  text = text.toLowerCase();

  // Duygu durumu, tür, sanatçı ve akıllı müzik öneri sistemi için yardımcı fonksiyonlar
  const sentimentWords = {
    // Olumlu kelimeler (1-5 arası puan)
    mutlu: 5,
    neşeli: 5,
    harika: 5,
    muhteşem: 5,
    mükemmel: 5,
    güzel: 4,
    iyi: 4,
    keyifli: 4,
    huzurlu: 4,
    rahat: 4,
    memnun: 3,
    olumlu: 3,
    beğendim: 3,
    sevindim: 3,
    başarılı: 3,
    hoş: 2,
    'fena değil': 2,
    'idare eder': 2,
    'kabul edilebilir': 2,
    yeterli: 2,

    // Olumsuz kelimeler (-1 ila -5 arası puan)
    üzgün: -4,
    kötü: -4,
    berbat: -5,
    rezalet: -5,
    korkunç: -5,
    mutsuz: -4,
    kızgın: -4,
    öfkeli: -4,
    sinirli: -4,
    'hayal kırıklığı': -4,
    'kötü hissediyorum': -3,
    hoşlanmadım: -3,
    beğenmedim: -3,
    'can sıkıcı': -3,
    yorgun: -2,
    sıkıldım: -2,
    umutsuz: -4,
    bitkin: -2,
    hasta: -3,
  };

  // Tüm kelimeler için toplam duygu puanı hesaplama
  let score = 0;
  let matches = 0;

  // Tüm duygu kelimelerini metin içinde ara
  Object.keys(sentimentWords).forEach((word) => {
    if (text.includes(word)) {
      score += sentimentWords[word];
      matches++;
    }
  });

  // Bir eşleşme yoksa nötr döndür
  if (matches === 0) return { sentiment: 'nötr', score: 0 };

  // Ortalama puanı hesapla
  const avgScore = score / matches;

  // Puanı duygu kategorisine dönüştür
  if (avgScore >= 3) return { sentiment: 'çok olumlu', score: avgScore };
  if (avgScore > 0) return { sentiment: 'olumlu', score: avgScore };
  if (avgScore === 0) return { sentiment: 'nötr', score: 0 };
  if (avgScore > -3) return { sentiment: 'olumsuz', score: avgScore };
  return { sentiment: 'çok olumsuz', score: avgScore };
};

// Müzik türlerini algılama
export const detectGenres = (text) => {
  text = text.toLowerCase();

  // Yaygın müzik türleri
  const genres = [
    'pop',
    'rock',
    'metal',
    'hiphop',
    'rap',
    'jazz',
    'blues',
    'klasik',
    'classical',
    'elektronik',
    'electronic',
    'dance',
    'folk',
    'country',
    'r&b',
    'indie',
    'alternative',
    'türkçe pop',
    'arabesk',
    'türk sanat müziği',
    'türk halk müziği',
    'türk rock',
    'anadolu rock',
    'slow türkçe',
    'club müzik',
    'fantezi',
    '90lar',
    '80ler',
    '70ler',
    '2000ler',
    '2010lar',
  ];

  const foundGenres = [];

  // Metinde belirtilen türleri bul
  genres.forEach((genre) => {
    if (text.includes(genre)) {
      foundGenres.push(genre);
    }
  });

  return foundGenres;
};

// Mood analizi yapma
export const detectMood = (text) => {
  text = text.toLowerCase();
  let foundMood = null;

  // Metinde duygu durum kelimesi ara
  Object.keys(moodLexicon).forEach((mood) => {
    if (text.includes(mood)) {
      foundMood = mood;
    }
  });

  return foundMood;
};

// Gelişmiş sanatçı algılama ve veri zenginleştirme
export const detectArtist = (text) => {
  // Popüler türkçe sanatçılar (genişletilmiş liste)
  const turkishArtists = [
    'tarkan',
    'sezen aksu',
    'teoman',
    'duman',
    'mor ve ötesi',
    'şebnem ferah',
    'manga',
    'mabel matiz',
    'ezhel',
    'müslüm gürses',
    'ibrahim tatlıses',
    'barış manço',
    'cem karaca',
    'selda bağcan',
    'ajda pekkan',
    'sertab erener',
    'serdar ortaç',
    'hadise',
    'gülşen',
    'athena',
    'kenan doğulu',
    'yalın',
    'ebru gündeş',
    'demet akalın',
    'mfo',
    'zeki müren',
    'orhan gencebay',
    'bergen',
    'ferdi tayfur',
    'neşet ertaş',
    'ceza',
    'sagopa kajmer',
    'sıla',
    'yıldız tilbe',
    'mustafa sandal',
    'özcan deniz',
    'hande yener',
    'nilüfer',
    'haluk levent',
    'cem adrian',
    'zeynep bastık',
    'edis',
    'aleyna tilki',
    'merve özbey',
    'buray',
    'murat boz',
    'ebru yaşar',
    'simge',
    'bengü',
    'oğuzhan koç',
    'halil sezai',
    'tuğçe kandemir',
    'aydilge',
    'feride hilal akın',
    'melek mosso',
    'kubilay aka',
    'reynmen',
    'linet',
    'emir',
    'hüseyin badilli',
    'ceylan ertem',
    'mert demir',
    'semicenk',
    'can bonomo',
    'gazapizm',
    'norm ender',
    'şanışer',
    'contra',
    'şehinşah',
    'zen-g',
    'aspova',
  ];

  // Popüler yabancı sanatçılar (genişletilmiş liste)
  const foreignArtists = [
    'taylor swift',
    'ed sheeran',
    'bruno mars',
    'justin bieber',
    'beyonce',
    'rihanna',
    'adele',
    'drake',
    'ariana grande',
    'the weeknd',
    'coldplay',
    'maroon 5',
    'imagine dragons',
    'bts',
    'lady gaga',
    'katy perry',
    'dua lipa',
    'billie eilish',
    'post malone',
    'eminem',
    'queen',
    'michael jackson',
    'madonna',
    'u2',
    'the beatles',
    'pink floyd',
    'nirvana',
    'metallica',
    'justin timberlake',
    'britney spears',
    'selena gomez',
    'shawn mendes',
    'elton john',
    'daft punk',
    'david guetta',
    'calvin harris',
    'martin garrix',
    'avicii',
    'alan walker',
    'tiesto',
    'skrillex',
    'marshmello',
    'zedd',
    'afrojack',
    'diplo',
    'hardwell',
    'kygo',
    'steve aoki',
    'deadmau5',
    'armin van buuren',
    'nicky romero',
    'r3hab',
    'don diablo',
    'olivia rodrigo',
    'doja cat',
    'harry styles',
    'camila cabello',
    'halsey',
    'bad bunny',
    'j balvin',
    'blackpink',
    'twice',
    'exo',
    'nct',
    'stray kids',
    'ateez',
    'enhypen',
  ];

  const artistMetadata = {
    tarkan: { genre: 'türkçe pop', era: '90s-present', popularity: 0.95 },
    'sezen aksu': { genre: 'türkçe pop', era: '80s-present', popularity: 0.93 },
    'taylor swift': { genre: 'pop', era: '2000s-present', popularity: 0.98 },
    'ed sheeran': { genre: 'pop', era: '2010s-present', popularity: 0.96 },
    'dua lipa': { genre: 'pop', era: '2010s-present', popularity: 0.92 },
    // Tam veritabanında yüzlerce sanatçı için metadata bulunur
  };

  const allArtists = [...turkishArtists, ...foreignArtists];
  const foundArtists = [];

  text = text.toLowerCase();

  // Fuzzy matching algoritması ile sanatçı adı ara (yazım hataları toleranslı)
  for (const artist of allArtists) {
    // Tam eşleşme
    if (text.includes(artist)) {
      foundArtists.push({
        name: artist,
        confidence: 1.0,
        metadata: artistMetadata[artist] || {
          genre: 'bilinmeyen',
          era: 'bilinmeyen',
          popularity: 0.5,
        },
      });
      continue;
    }

    // Yaklaşık eşleşme (Örn: "tarkn" = "tarkan")
    if (artist.length > 4) {
      const artistWords = artist.split(' ');
      for (const word of artistWords) {
        if (word.length > 4) {
          // Levenshtein mesafesi hesaplama yerine basit yaklaşım
          const minLength = Math.min(word.length, 5);
          const wordStart = word.substring(0, minLength);
          if (text.includes(wordStart)) {
            foundArtists.push({
              name: artist,
              confidence: 0.7,
              matchType: 'fuzzy',
              metadata: artistMetadata[artist] || {
                genre: 'bilinmeyen',
                era: 'bilinmeyen',
                popularity: 0.5,
              },
            });
            break;
          }
        }
      }
    }
  }

  // Sonuçları güvenilirlik skoruna göre sırala
  return foundArtists.sort((a, b) => b.confidence - a.confidence);
};

// Kullanıcı konu konuşma bağlamını güncelleme
const updateConversationContext = (text, context) => {
  // Konuşma geçmişine ekle
  context.history.push({
    text,
    timestamp: new Date().toISOString(),
  });

  // En son sorguyu kaydet
  context.sessionState.lastQuery = text;

  // Geçmiş boyutunu sınırla (son 10 etkileşim)
  if (context.history.length > 10) {
    context.history = context.history.slice(-10);
  }

  return context;
};

// Gelişmiş doğal dil yanıt üretme sistemi
export const generateResponse = (input, context = conversationContext) => {
  // Giriş metni normalizasyonu ve tokenization
  const text = input.toLowerCase().trim();
  const tokens = text.split(/\s+/);

  // Bağlam geçmişini güncelleme
  updateConversationContext(text, context);

  // İleri düzey doğal dil analitiği
  const nlpAnalysis = analyzeText(text, context);

  // Düşük seviyeden yüksek seviyeye doğru sıralı analiz zinciri
  const mood = detectMood(text);
  const sentiment = analyzeSentiment(text);
  const genres = detectGenres(text);
  const artists = detectArtist(text);
  const intent = detectIntent(text, { mood, sentiment, genres, artists }, context);
  const entityAnalysis = extractEntities(text);

  // Güven skorları ile yanıt oluşturma
  if (nlpAnalysis.confidence < 0.4) {
    return generateClarifyingQuestion(text, nlpAnalysis, context);
  }

  // Gelişmiş doğal dil yanıt üreteci (GPT tarzı)
  return generateNaturalResponse(nlpAnalysis, {
    mood,
    sentiment,
    genres,
    artists,
    intent,
    entityAnalysis,
    context,
  });
};

// Metin analizi yapıp yapay zeka çıkarımları üret
const analyzeText = (text, context) => {
  // İleri NLP analizi
  const sentimentScore = analyzeSentiment(text).score;
  const detectedMood =
    detectMood(text) || (sentimentScore > 0 ? 'olumlu' : sentimentScore < 0 ? 'olumsuz' : 'nötr');
  const textComplexity = calculateTextComplexity(text);

  // Kullanıcı niyeti tanıma
  let intents = [];
  if (text.match(/öner|tavsiye|dinle|müzik|şarkı|parça|liste/i)) intents.push('recommendation');
  if (text.match(/nasılsın|naber|merhaba|selam/i)) intents.push('greeting');
  if (text.match(/teşekkür|sağol|eyvallah/i)) intents.push('gratitude');
  if (text.match(/beğen|sevdim|güzel|harika|süper/i)) intents.push('positive_feedback');
  if (text.match(/sevme|kötü|berbat|değiştir/i)) intents.push('negative_feedback');
  if (text.match(/anlat|bilgi|açıkla|kimdir|nedir/i)) intents.push('information');

  // Ana intenti belirleme
  const primaryIntent = intents.length > 0 ? intents[0] : 'general';

  // Konuşma devamını teşvik edecek takip konuları
  const possibleFollowUps = generateFollowUpTopics(text, primaryIntent, context);

  return {
    tokens: text.split(/\s+/).length,
    sentiment: sentimentScore,
    mood: detectedMood,
    complexity: textComplexity,
    intents,
    primaryIntent,
    possibleFollowUps,
    confidence: calculateConfidence(intents, text, context), // 0.0 - 1.0 arası
    timestamp: new Date().toISOString(),
  };
};

// Yapay zeka tarafından anlaşılamayan girdilere açıklama soruları üret
const generateClarifyingQuestion = (text, analysis, context) => {
  const clarifyingQuestions = [
    'Tam olarak ne tür bir müzik aradığınızı biraz daha detaylandırabilir misiniz?',
    'Üzgünüm, sizi tam olarak anlayamadım. Hangi sanatçı veya tür hakkında konuşuyorsunuz?',
    'Müzik zevkiniz hakkında biraz daha bilgi verebilir misiniz?',
    'Belirli bir ruh hali için mi müzik arıyorsunuz?',
    'Özel bir dönem veya yıllara ait müzikler mi dinlemek istiyorsunuz?',
  ];

  // Soruyu bağlama göre seç
  const index = Math.floor(seedrandom(text)() * clarifyingQuestions.length);
  return clarifyingQuestions[index];
};

// Gelişmiş doğal dil yanıt üreteci
const generateNaturalResponse = (analysis, params) => {
  const { mood, sentiment, genres, artists, intent, entityAnalysis, context } = params;
  const { primaryIntent, possibleFollowUps, text } = analysis;
  // Eğer text eksikse, varsayılan bir değer atayacağız
  const userText = text || '';

  // Yapay zeka kişiliğine uygun yanıt tarzları
  const responseStyles = {
    friendly: 0.8, // 0.0-1.0 arasında değer (arkadaşça konuşma oranı)
    formal: 0.3, // 0.0-1.0 arasında değer (resmi konuşma oranı)
    enthusiastic: 0.7, // 0.0-1.0 arasında değer (coşkulu konuşma oranı)
    empathetic: 0.9, // 0.0-1.0 arasında değer (empatik konuşma oranı)
  };

  // Intent bazlı temel yanıtlar
  let response = '';

  // Selamlama yanıtları
  if (primaryIntent === 'greeting') {
    const greetings = [
      'Merhaba! Bugün size nasıl yardımcı olabilirim?',
      'Selam! Müzik dünyasında bugün ne keşfetmek istersiniz?',
      'Merhaba! Bugün nasıl hissediyorsunuz? Size uygun müzikler önerebilirim.',
      'Hoş geldiniz! Müzikal yolculuğunuzda size eşlik etmekten mutluluk duyarım.',
    ];
    response =
      greetings[Math.floor(seedrandom(context.sessionState.lastQuery)() * greetings.length)];
  }

  // Öneri yanıtları
  else if (primaryIntent === 'recommendation') {
    // Mood varsa mood'a göre öneriler
    if (mood) {
      const recommendedGenres = moodLexicon[mood] || [];
      if (recommendedGenres.length > 0) {
        response = `${capitalizeFirstLetter(mood)} hissettiğinizi anlıyorum. Size ${randomSelection(recommendedGenres, 3).join(', ')} türlerinde müzik dinlemenizi önerebilirim. ${generateFollowUpQuestion(mood)}`;
      }
    }
    // Genre varsa genre'a göre öneriler
    else if (genres.length > 0) {
      response = `${genres.join(', ')} türünde müzik dinlemek harika bir seçim! Size bu türde en sevilen şarkıları sunabilirim. Belirli bir sanatçı tercihiniz var mı?`;
    }
    // Sanatçı varsa sanatçıya göre öneriler
    else if (artists.length > 0) {
      const topArtist = artists[0].name; // En yüksek güvenilirlik skoruna sahip sanatçı
      response = `${capitalizeFirstLetter(topArtist)} harika bir seçim! Size ${topArtist}'dan en popüler şarkıları önerebilirim. Özel bir albüm veya dönem tercihiniz var mı?`;
    }
    // Genel öneri
    else {
      response =
        'Size farklı türlerde şarkılar önerebilirim. Özel bir ruh hali veya tür belirtirseniz daha kişiselleştirilmiş öneriler sunabilirim.';
    }
  }

  // Sanatçı sorgusu algılama
  // text ve artists için null/undefined kontrolü ekleyelim
  const hasArtistKeyword =
    userText && (userText.includes('sanatçı') || userText.includes('kimden'));
  const hasArtists = Array.isArray(artists) && artists.length > 0;

  if (hasArtistKeyword || hasArtists) {
    if (hasArtists) {
      return `${artists.join(', ')} harika bir seçim! Size bu sanatçıdan/sanatçılardan en popüler şarkıları önerebilirim. Belirli bir albüm veya dönem tercihiniz var mı?`;
    } else {
      return 'Hangi sanatçıyı dinlemek istersiniz? Favori sanatçınızın adını söylemeniz yeterli.';
    }
  }

  // Öneri istekleri algılama
  if (
    userText &&
    (userText.includes('öner') || userText.includes('tavsiye') || userText.includes('öneri'))
  ) {
    if (sentiment.score > 0) {
      return 'Size enerjik ve pozitif şarkılar önerebilirim! Pop, dance veya upbeat türünde şarkılar nasıl olur?';
    } else if (sentiment.score < 0) {
      return 'Rahatlatıcı ve sakinleştirici müzikler mi arıyorsunuz? Slow türkçe, akustik veya ambient müzikler dinlemek ister misiniz?';
    } else {
      return 'Size farklı türlerde şarkılar önerebilirim. Özel bir ruh hali veya tür belirtirseniz daha kişiselleştirilmiş öneriler sunabilirim.';
    }
  }

  // Genel cevaplar
  return "Size müzik konusunda yardımcı olmak isterim. Ruh halinizi, dinlemek istediğiniz türü veya sanatçıyı belirtebilirsiniz. Örneğin 'Bugün mutluyum, ne dinleyebilirim?' veya 'Tarkan'dan şarkı öner' diyebilirsiniz.";
};

// Şarkı önerileri oluşturma (farklı kategorilere göre)
export const getSongRecommendations = (type, value) => {
  // Gerçek bir uygulamada bu verileri API'den alırsınız
  // Şimdilik örnek veri kullanıyoruz

  // Farklı ruh hallerine göre şarkı önerileri
  const moodSongs = {
    mutlu: [
      {
        id: 1,
        title: 'Hepsi Geçti',
        artist: 'Sezen Aksu',
        coverUrl: 'https://i.scdn.co/image/ab67616d0000b273a588347ae759dc4ec15d243f',
      },
      {
        id: 2,
        title: 'Yaz Yaz Yaz',
        artist: 'Tarkan',
        coverUrl: 'https://i.scdn.co/image/ab67616d0000b2733414ccd32b12e4d67e961fdc',
      },
      {
        id: 3,
        title: 'Arıyorum',
        artist: 'Oğuzhan Koç',
        coverUrl: 'https://i.scdn.co/image/ab67616d0000b273b3619c7a171577fe48b5e963',
      },
    ],
    üzgün: [
      {
        id: 4,
        title: 'Yorgun',
        artist: 'Sezen Aksu',
        coverUrl: 'https://i.scdn.co/image/ab67616d0000b273a588347ae759dc4ec15d243f',
      },
      {
        id: 5,
        title: 'Affet',
        artist: 'Müslüm Gürses',
        coverUrl: 'https://i.scdn.co/image/ab67616d0000b273f6798edab876b7540c221639',
      },
      {
        id: 6,
        title: 'Gözümden Düştüğün An',
        artist: 'Ebru Gündeş',
        coverUrl: 'https://i.scdn.co/image/ab67616d0000b2735d46e10ebe17b72b2d22b0fd',
      },
    ],
    // Diğer duygu durumları...
  };

  // Türlere göre şarkı önerileri
  const genreSongs = {
    pop: [
      {
        id: 7,
        title: 'Bangır Bangır',
        artist: 'Gülşen',
        coverUrl: 'https://i.scdn.co/image/ab67616d0000b273c3a7e4c4eb685f2df8ab0c70',
      },
      {
        id: 8,
        title: 'Kuzu Kuzu',
        artist: 'Tarkan',
        coverUrl: 'https://i.scdn.co/image/ab67616d0000b2733414ccd32b12e4d67e961fdc',
      },
      {
        id: 9,
        title: 'Kış Güneşi',
        artist: 'Şebnem Ferah',
        coverUrl: 'https://i.scdn.co/image/ab67616d0000b2738a7f0c2f07f8e5416a2ce23a',
      },
    ],
    rock: [
      {
        id: 10,
        title: 'Fırtına',
        artist: 'Manga',
        coverUrl: 'https://i.scdn.co/image/ab67616d0000b2733fa95c6f9109ca944567b2d1',
      },
      {
        id: 11,
        title: 'Bir Derdim Var',
        artist: 'mor ve ötesi',
        coverUrl: 'https://i.scdn.co/image/ab67616d0000b2736cff7f3cea0c666d84d05c70',
      },
      {
        id: 12,
        title: 'Sil Baştan',
        artist: 'Duman',
        coverUrl: 'https://i.scdn.co/image/ab67616d0000b273705fc0349026b498bd7cc7d1',
      },
    ],
    // Diğer türler...
  };

  // Sanatçılara göre şarkı önerileri
  const artistSongs = {
    tarkan: [
      {
        id: 13,
        title: 'Kuzu Kuzu',
        artist: 'Tarkan',
        coverUrl: 'https://i.scdn.co/image/ab67616d0000b2733414ccd32b12e4d67e961fdc',
      },
      {
        id: 14,
        title: 'Yolla',
        artist: 'Tarkan',
        coverUrl: 'https://i.scdn.co/image/ab67616d0000b2733414ccd32b12e4d67e961fdc',
      },
      {
        id: 15,
        title: 'Dudu',
        artist: 'Tarkan',
        coverUrl: 'https://i.scdn.co/image/ab67616d0000b2733414ccd32b12e4d67e961fdc',
      },
    ],
    'sezen aksu': [
      {
        id: 16,
        title: 'Gülümse',
        artist: 'Sezen Aksu',
        coverUrl: 'https://i.scdn.co/image/ab67616d0000b273a588347ae759dc4ec15d243f',
      },
      {
        id: 17,
        title: 'Sade Vatandaş',
        artist: 'Sezen Aksu',
        coverUrl: 'https://i.scdn.co/image/ab67616d0000b273a588347ae759dc4ec15d243f',
      },
      {
        id: 18,
        title: 'Kaçın Kurası',
        artist: 'Sezen Aksu',
        coverUrl: 'https://i.scdn.co/image/ab67616d0000b273a588347ae759dc4ec15d243f',
      },
    ],
    // Diğer sanatçılar...
  };

  switch (type) {
    case 'mood':
      return moodSongs[value] || [];
    case 'genre':
      return genreSongs[value] || [];
    case 'artist':
      return artistSongs[value] || [];
    default:
      return [];
  }
};

// Çalma listesi oluşturucuları
export const playlistGenerators = {
  // Ruh haline göre çalma listesi
  byMood: (mood) => {
    const genres = moodLexicon[mood] || ['pop', 'rock'];
    return {
      name: `${mood.charAt(0).toUpperCase() + mood.slice(1)} Moduna Özel`,
      description: `${mood} hissettiğiniz zamanlarda dinleyebileceğiniz şarkılar`,
      songs: getSongRecommendations('mood', mood),
    };
  },

  // Türe göre çalma listesi
  byGenre: (genre) => {
    return {
      name: `${genre.charAt(0).toUpperCase() + genre.slice(1)} Koleksiyonu`,
      description: `${genre} türünde en sevilen şarkılar`,
      songs: getSongRecommendations('genre', genre),
    };
  },

  // Sanatçıya göre çalma listesi
  byArtist: (artist) => {
    return {
      name: `${artist.charAt(0).toUpperCase() + artist.slice(1)} En İyileri`,
      description: `${artist}'ın en sevilen şarkıları`,
      songs: getSongRecommendations('artist', artist),
    };
  },
};

// Chatbot'un metin mesajından komutları ayrıştırma
export const parseCommand = (text) => {
  text = text.toLowerCase();

  // Özel komut ayrıştırıcıları
  const commands = {
    // Çalma listesi komutu
    playlist: /çalma\s+listesi(?:\s+oluştur)?(?:\s+(.*?))?/i,

    // Şarkı arama komutu
    search: /(?:şarkı\s+)?(?:ara|bul)(?:\s+(.*?))?/i,

    // Ruh haline göre öneri
    recommendByMood:
      /(?:.*?)(mutlu|neşeli|üzgün|kızgın|stresli|yalnız|yorgun|heyecanlı|enerjik|rahat|huzurlu|romantik)(?:.*?)(?:öner|tavsiye|ne dinleyebilirim)/i,

    // Türe göre öneri
    recommendByGenre:
      /(?:(pop|rock|metal|hiphop|rap|elektronik|klasik|jazz|blues)(?:.*?)(?:öner|tavsiye|dinle))/i,

    // Sanatçıya göre öneri
    recommendByArtist: /(.*?)(?:(?:dan|den|tan|ten)\s+(?:şarkı|müzik)\s+(?:öner|tavsiye|dinle))/i,
  };

  // Metni komutlara göre ayrıştır
  for (const [cmdType, regex] of Object.entries(commands)) {
    const match = text.match(regex);
    if (match) {
      const param = match[1] ? match[1].trim() : null;
      return { command: cmdType, param };
    }
  }

  // Hiçbir özel komut bulunamadıysa genel yanıt üret
  return { command: 'general', param: null };
};

// Kullanıcı profiline dayalı öneri yapma
export const getPersonalizedRecommendations = (userProfile) => {
  // Gerçek uygulamada bu işlev kullanıcının geçmiş dinlemelerini,
  // beğenilerini ve tercihlerini analiz ederek kişiselleştirilmiş öneriler sunar

  // Örnek bir uygulama:
  const recommendations = [];

  // Favori türlere göre öneriler
  if (userProfile.favoriteGenres && userProfile.favoriteGenres.length > 0) {
    userProfile.favoriteGenres.forEach((genre) => {
      const genreSongs = getSongRecommendations('genre', genre).slice(0, 2);
      recommendations.push(...genreSongs);
    });
  }

  // Favori sanatçılara göre öneriler
  if (userProfile.favoriteArtists && userProfile.favoriteArtists.length > 0) {
    userProfile.favoriteArtists.forEach((artist) => {
      const artistSongs = getSongRecommendations('artist', artist).slice(0, 2);
      recommendations.push(...artistSongs);
    });
  }

  // Ruh haline göre öneriler
  if (userProfile.currentMood) {
    const moodSongs = getSongRecommendations('mood', userProfile.currentMood).slice(0, 3);
    recommendations.push(...moodSongs);
  }

  return recommendations;
};
