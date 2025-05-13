import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function Settings() {
  const [user, setUser] = useState(null);
  const [currentTheme, setCurrentTheme] = useState('default');
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const router = useRouter();

  // Tema seçenekleri
  const themes = [
    {
      id: 'default',
      name: 'Modern Cam',
      color: 'from-primary via-secondary to-accent',
      description: 'Varsayılan glassmorphism teması',
    },
    {
      id: 'dark',
      name: 'Karanlık',
      color: 'from-gray-900 via-gray-800 to-gray-700',
      description: 'Koyu renk tonları',
    },
    {
      id: 'sunset',
      name: 'Gün Batımı',
      color: 'from-sunset-primary via-orange-400 to-sunset-secondary',
      description: 'Turuncu ve kırmızı tonları',
    },
  ];

  useEffect(() => {
    // Kullanıcı bilgilerini al
    const savedUser = localStorage.getItem('musicAssistantUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      router.push('/login');
    }

    // Kayıtlı tema ayarını al
    const savedTheme = localStorage.getItem('musicAssistantTheme');
    if (savedTheme) {
      setCurrentTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, [router]);

  const changeTheme = (themeId) => {
    setCurrentTheme(themeId);
    localStorage.setItem('musicAssistantTheme', themeId);
    document.documentElement.setAttribute('data-theme', themeId);

    // Bildirim göster
    setNotification({
      show: true,
      message: 'Tema başarıyla değiştirildi!',
      type: 'success',
    });

    // 3 saniye sonra bildirimi kapat
    setTimeout(() => {
      setNotification({ ...notification, show: false });
    }, 3000);
  };

  // Dil seçeneği (şu an sadece Türkçe)
  const languages = [{ id: 'tr', name: 'Türkçe', flag: '🇹🇷' }];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-accent">
      <Head>
        <title>Ayarlar | Music Assistant</title>
        <meta name="description" content="Music Assistant uygulama ayarları" />
      </Head>

      <div className="container mx-auto px-4 py-8">
        <div className="glass p-8 rounded-2xl shadow-2xl max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-primary">Ayarlar</h1>

          {notification.show && (
            <div
              className={`mb-6 p-3 rounded-lg ${notification.type === 'success' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}
            >
              {notification.message}
            </div>
          )}

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-secondary">Temalar</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {themes.map((theme) => (
                <div
                  key={theme.id}
                  className={`p-4 rounded-xl cursor-pointer transition-all duration-300 hover:scale-105 
                    ${currentTheme === theme.id ? 'ring-4 ring-accent ring-opacity-70 shadow-lg' : 'border border-white/30'}`}
                  onClick={() => changeTheme(theme.id)}
                >
                  <div
                    className={`h-20 w-full rounded-lg mb-3 bg-gradient-to-r ${theme.color}`}
                  ></div>
                  <h3 className="font-medium text-lg">{theme.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{theme.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-secondary">Dil Seçenekleri</h2>
            <div className="flex flex-wrap gap-3">
              {languages.map((lang) => (
                <button
                  key={lang.id}
                  className="px-4 py-2 rounded-lg bg-white bg-opacity-30 backdrop-blur-sm 
                           border border-white/20 flex items-center gap-2 font-medium"
                  disabled
                >
                  <span className="text-lg">{lang.flag}</span>
                  {lang.name}
                </button>
              ))}
              <p className="w-full mt-2 text-sm text-gray-600 italic">
                * Yakında daha fazla dil seçeneği eklenecek
              </p>
            </div>
          </section>

          <section className="mb-4">
            <h2 className="text-2xl font-semibold mb-4 text-secondary">Ses Ayarları</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Ses Kalitesi</label>
              <select
                className="w-full p-2 rounded-lg bg-white bg-opacity-50 backdrop-blur-sm
                              border border-white/30 focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="high">Yüksek (320kbps)</option>
                <option value="medium">Orta (192kbps)</option>
                <option value="low">Düşük (128kbps)</option>
                <option value="auto">Otomatik (bağlantıya göre)</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Çalma Modu</label>
              <div className="flex items-center gap-4">
                <label className="inline-flex items-center">
                  <input type="radio" className="form-radio" name="playMode" value="shuffle" />
                  <span className="ml-2">Karışık</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio"
                    name="playMode"
                    value="sequential"
                    checked
                  />
                  <span className="ml-2">Sıralı</span>
                </label>
                <label className="inline-flex items-center">
                  <input type="radio" className="form-radio" name="playMode" value="repeat" />
                  <span className="ml-2">Tekrar</span>
                </label>
              </div>
            </div>
          </section>

          <button
            onClick={() => router.push('/')}
            className="mt-6 bg-primary hover:bg-accent text-white py-2 px-6 rounded-lg
                     transition-colors font-medium flex items-center gap-2"
          >
            <span className="material-icons">arrow_back</span>
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    </div>
  );
}
