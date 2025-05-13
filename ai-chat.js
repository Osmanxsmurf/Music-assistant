// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
"use strict";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log('AI Chat isteği:', message);
    
    // Harici servislere bağlanma denemesini atlayıp direk yedek yanıt kullanıyoruz
    // Bu sayede herhangi bir 500 hatası olmayacak
    const aiResponse = await generateFallbackResponse(message);
    console.log('Oluşturulan yanıt:', aiResponse);
    
    // Başarılı yanıt dön

    return res.status(200).json(aiResponse);
  } catch (error) {
    console.error('AI chat hatası:', error);
    return res.status(500).json({
      text: 'Üzgünüm, bir sorun oluştu. Lütfen daha sonra tekrar deneyin.',
      recommendations: [],
    });
  }
}

// Yedek yanıt oluşturma
async function generateFallbackResponse(message) {
  const lowerMessage = message.toLowerCase();

  // Selamlaşma kontrolü
  const greetings = ['merhaba', 'selam', 'merhabalar', 'selamlar', 'hey', 'hi', 'hello'];
  if (greetings.some((g) => lowerMessage.includes(g))) {
    return {
      text: 'Bugün nasılsınız? Size nasıl yardımcı olabilirim?',
      recommendations: [],
    };
  }

  // Duygu durumu kontrolü
  const moodDict = {
    mutlu: ['mutlu', 'neşeli', 'sevinçli', 'keyifli', 'güzel'],
    üzgün: ['üzgün', 'hüzünlü', 'kederli', 'mutsuz', 'karamsar'],
    enerjik: ['enerjik', 'canlı', 'dinamik', 'hareketli', 'coşkulu'],
    romantik: ['romantik', 'aşk', 'sevgi', 'sevda', 'duygusal'],
    sakin: ['sakin', 'huzurlu', 'rahat', 'dingin', 'sessiz'],
    nostaljik: ['nostaljik', 'eski', 'geçmiş', 'anılar', 'eskiden'],
  };

  let detectedMood = null;

  for (const [mood, keywords] of Object.entries(moodDict)) {
    if (keywords.some((k) => lowerMessage.includes(k))) {
      detectedMood = mood;
      break;
    }
  }

  if (detectedMood) {
    // Duygu durumuna göre yedek öneriler
    const fallbackSongs = {
      mutlu: [
        {
          id: 'm1',
          title: 'Yolla',
          artist: 'Tarkan',
          coverUrl: 'https://i.ytimg.com/vi/XveW8-RuGjk/mqdefault.jpg',
          youtubeUrl: 'https://www.youtube.com/watch?v=XveW8-RuGjk',
        },
        {
          id: 'm2',
          title: 'Yan Benimle',
          artist: 'Sıla',
          coverUrl: 'https://i.ytimg.com/vi/f4_X1q81XWM/mqdefault.jpg',
          youtubeUrl: 'https://www.youtube.com/watch?v=f4_X1q81XWM',
        },
        {
          id: 'm3',
          title: 'Çakkıdı',
          artist: 'Kenan Doğulu',
          coverUrl: 'https://i.ytimg.com/vi/KS4evT9UVY4/mqdefault.jpg',
          youtubeUrl: 'https://www.youtube.com/watch?v=KS4evT9UVY4',
        },
      ],
      üzgün: [
        {
          id: 'u1',
          title: 'Gidiyorum',
          artist: 'Sezen Aksu',
          coverUrl: 'https://i.ytimg.com/vi/iAgYJbDMLns/mqdefault.jpg',
          youtubeUrl: 'https://www.youtube.com/watch?v=iAgYJbDMLns',
        },
        {
          id: 'u2',
          title: 'Bir Bahar Akşamı',
          artist: 'Yalın',
          coverUrl: 'https://i.ytimg.com/vi/Kb2mKbgLZwo/mqdefault.jpg',
          youtubeUrl: 'https://www.youtube.com/watch?v=Kb2mKbgLZwo',
        },
        {
          id: 'u3',
          title: 'Her Şeyi Yak',
          artist: 'Duman',
          coverUrl: 'https://i.ytimg.com/vi/HLJu06lRVJc/mqdefault.jpg',
          youtubeUrl: 'https://www.youtube.com/watch?v=HLJu06lRVJc',
        },
      ],
      enerjik: [
        {
          id: 'e1',
          title: 'Fırtınadayım',
          artist: 'Mabel Matiz',
          coverUrl: 'https://i.ytimg.com/vi/lYdmGfZqWMY/mqdefault.jpg',
          youtubeUrl: 'https://www.youtube.com/watch?v=lYdmGfZqWMY',
        },
        {
          id: 'e2',
          title: 'Cambaz',
          artist: 'Mor ve Ötesi',
          coverUrl: 'https://i.ytimg.com/vi/_G_QANBVFGw/mqdefault.jpg',
          youtubeUrl: 'https://www.youtube.com/watch?v=_G_QANBVFGw',
        },
        {
          id: 'e3',
          title: 'Ben Böyleyim',
          artist: 'Athena',
          coverUrl: 'https://i.ytimg.com/vi/7PK-l1BfeQw/mqdefault.jpg',
          youtubeUrl: 'https://www.youtube.com/watch?v=7PK-l1BfeQw',
        },
      ],
      romantik: [
        {
          id: 'r1',
          title: 'Rüya',
          artist: 'Mabel Matiz',
          coverUrl: 'https://i.ytimg.com/vi/w0DTBlCB9ko/mqdefault.jpg',
          youtubeUrl: 'https://www.youtube.com/watch?v=w0DTBlCB9ko',
        },
        {
          id: 'r2',
          title: 'Ben Bazen',
          artist: 'Sıla',
          coverUrl: 'https://i.ytimg.com/vi/i3RBbRLupo4/mqdefault.jpg',
          youtubeUrl: 'https://www.youtube.com/watch?v=i3RBbRLupo4',
        },
        {
          id: 'r3',
          title: 'Aşk',
          artist: 'Sezen Aksu',
          coverUrl: 'https://i.ytimg.com/vi/mYJUQBwBUPg/mqdefault.jpg',
          youtubeUrl: 'https://www.youtube.com/watch?v=mYJUQBwBUPg',
        },
      ],
      sakin: [
        {
          id: 's1',
          title: 'Geceler',
          artist: 'Yüzyüzeyken Konuşuruz',
          coverUrl: 'https://i.ytimg.com/vi/UUKK0s6TNMY/mqdefault.jpg',
          youtubeUrl: 'https://www.youtube.com/watch?v=UUKK0s6TNMY',
        },
        {
          id: 's2',
          title: 'Akustik Travma',
          artist: 'Mor ve Ötesi',
          coverUrl: 'https://i.ytimg.com/vi/bpYo-3RI6OY/mqdefault.jpg',
          youtubeUrl: 'https://www.youtube.com/watch?v=bpYo-3RI6OY',
        },
        {
          id: 's3',
          title: 'Bir Derdim Var',
          artist: 'Mor ve Ötesi',
          coverUrl: 'https://i.ytimg.com/vi/SX05B4diXqE/mqdefault.jpg',
          youtubeUrl: 'https://www.youtube.com/watch?v=SX05B4diXqE',
        },
      ],
      nostaljik: [
        {
          id: 'n1',
          title: 'Dönence',
          artist: 'Barış Manço',
          coverUrl: 'https://i.ytimg.com/vi/LWCrh2gUNz0/mqdefault.jpg',
          youtubeUrl: 'https://www.youtube.com/watch?v=LWCrh2gUNz0',
        },
        {
          id: 'n2',
          title: 'Islak Islak',
          artist: 'Cem Karaca',
          coverUrl: 'https://i.ytimg.com/vi/glJf8QhPZlA/mqdefault.jpg',
          youtubeUrl: 'https://www.youtube.com/watch?v=glJf8QhPZlA',
        },
        {
          id: 'n3',
          title: 'Bodrum Bodrum',
          artist: 'Ajda Pekkan',
          coverUrl: 'https://i.ytimg.com/vi/BpC8aTTuGjc/mqdefault.jpg',
          youtubeUrl: 'https://www.youtube.com/watch?v=BpC8aTTuGjc',
        },
      ],
    };

    const recommendations = fallbackSongs[detectedMood] || fallbackSongs.mutlu;

    return {
      text: `'${detectedMood}' ruh halinize uygun müzikler buldum:`,
      recommendations,
    };
  }

  // Diğer metin
  return {
    text: 'Size nasıl yardımcı olabilirim? Ruh halinizi söylerseniz size uygun müzikler önerebilirim.',
    recommendations: [],
  };
}
