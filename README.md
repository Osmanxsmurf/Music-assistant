# Music Assistant - Yapay Zeka Destekli Müzik Öneri Sistemi

Music Assistant, yapay zeka ile kullanıcının ruh haline ve tercihlerine göre kişiselleştirilmiş müzik önerileri sunan gelişmiş bir müzik platformudur. Türkçe dil desteği ve doğal konuşma özelliği ile kullanıcı deneyimini en üst seviyeye çıkarır.

![Music Assistant Logo](https://via.placeholder.com/800x200/9f7aea/ffffff?text=Music+Assistant)

## 🎵 Özellikler

- **Yapay Zeka Sohbet Asistanı**: Türkçe doğal dil anlama ve cevaplama yeteneği ile kullanıcıların müzik isteklerini anlar.
- **Duygu Analizi**: Kullanıcının mesajlarından duygu durumunu tespit eder ve buna uygun müzik önerileri sunar.
- **Geniş Müzik Veritabanı**: 100.000+ şarkıdan oluşan kapsamlı bir müzik kütüphanesi.
- **Last.fm Entegrasyonu**: En güncel ve popüler müzikleri Last.fm API ile sisteme entegre eder.
- **YouTube Bağlantısı**: Önerilen şarkıları doğrudan YouTube üzerinden dinleme imkanı.
- **Kişiselleştirilmiş Öneriler**: Kullanıcının dinleme geçmişine ve tercihlerine göre özel öneriler.
- **Mobil Uyumlu Tasarım**: Tüm cihazlarda sorunsuz çalışan responsive arayüz.
- **Tema Seçenekleri**: Kişiselleştirilebilir temalar (Pastel, Karanlık, Gün Batımı).
- **PWA Desteği**: Progressive Web App desteği ile mobil cihazlara kurulabilir.

## 🚀 Teknoloji Yığını

### Frontend

- **Next.js**: React tabanlı web framework
- **React**: Kullanıcı arayüzü kütüphanesi
- **Tailwind CSS**: Modern ve responsive tasarım
- **Heroicons**: Ücretsiz ve yüksek kaliteli ikonlar

### Backend

- **FastAPI**: Yüksek performanslı Python API framework
- **Express.js/Node.js**: JavaScript backend sunucusu
- **MongoDB**: Veritabanı sistemi

### Yapay Zeka

- **BERT**: Dil analizi için transformers modeli
- **PyTorch**: Derin öğrenme kütüphanesi

### Harici API'ler

- **Last.fm API**: Müzik verileri ve öneriler
- **YouTube API**: Müzik oynatma ve video bilgileri

## 🛠️ Kurulum

### Gereksinimler

- Node.js (v14+)
- Python (v3.8+)
- MongoDB

### Kurulum Adımları

1. Projeyi klonlayın:

```bash
git clone https://github.com/yourusername/music-assistant.git
cd music-assistant
```

2. Frontend bağımlılıklarını yükleyin:

```bash
npm install
```

3. Python bağımlılıklarını yükleyin:

```bash
pip install -r requirements-ai.txt
```

4. FastAPI sunucusunu başlatın:

```bash
cd api
uvicorn main:app --reload
```

5. Next.js uygulamasını başlatın:

```bash
npm run dev
```

6. Tarayıcınızda `http://localhost:3000` adresine gidin.

## 📱 Ekran Görüntüleri

### Ana Sayfa ve Yapay Zeka Sohbet

![Ana Sayfa](https://via.placeholder.com/800x450/9f7aea/ffffff?text=Music+Assistant+Home)

### Müzik Önerileri

![Müzik Önerileri](https://via.placeholder.com/800x450/4c51bf/ffffff?text=Music+Recommendations)

### Çalma Listesi

![Çalma Listesi](https://via.placeholder.com/800x450/ed8936/ffffff?text=Playlist+View)

## 🧠 Yapay Zeka Özellikleri

### Duygu Analizi

Music Assistant, BERT tabanlı duygu analiz modeli ile kullanıcının mesajlarındaki duygu durumunu tespit eder. 21 farklı duygu durumunu algılayabilen sistem, melankolik, enerjik, romantik, nostaljik gibi çeşitli durumlara uygun müzik önerileri sunar.

### Doğal Dil İşleme

Türkçe dil desteği ile kullanıcının doğal dilde yazdığı mesajları anlayabilir ve uygun yanıtlar verebilir. Örneğin, "bugün yağmurlu hava için müzik önerir misin" gibi karmaşık istekleri işleyebilir.

### Eğitim Veri Seti

Sistem, 1000+ örnek ile eğitilmiş bir veri seti kullanarak kullanıcı isteklerini doğru şekilde anlama yeteneğine sahiptir.

## 🔧 API Endpoints

### Müzik API Endpoints

- `GET /songs`: Tüm şarkıları getirir
- `GET /recommendations/mood/{mood}`: Ruh haline göre öneriler
- `GET /recommendations/artist/{artist}`: Sanatçıya göre öneriler
- `GET /search?q={query}`: Şarkı arama

### Yapay Zeka API Endpoints

- `POST /ai/chat`: Yapay zeka ile sohbet
- `GET /ai/status`: Yapay zeka sisteminin durumu

## 🔮 Gelecek Planları

- Sesli asistan entegrasyonu
- Offline müzik çalma desteği
- Arkadaş önerileri ve sosyal özellikler
- Gelişmiş müzik analizi ve özelleştirilmiş çalma listeleri
- Podcast ve radyo entegrasyonu

## 📜 Lisans

Bu proje MIT lisansı altında lisanslanmıştır - detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 👥 Katkıda Bulunanlar

- [Sizin Adınız](https://github.com/yourusername) - Proje Sahibi

## 📞 İletişim

Sorularınız veya önerileriniz için [e-posta@adresiniz.com](mailto:e-posta@adresiniz.com) adresine e-posta gönderebilirsiniz.

---

Music Assistant - Müziğinizi duygularınızla keşfedin 🎵
