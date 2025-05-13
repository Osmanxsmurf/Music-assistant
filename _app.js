import '../styles/globals.css';
import 'tailwindcss/tailwind.css';
import '../styles/animations.css';
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import NavBar from '../components/NavBar';

const navLinks = [
  { href: '/', label: 'Ana Sayfa', icon: '🏠' },
  { href: '/search', label: 'Arama', icon: '🔍' },
  { href: '/library', label: 'Kütüphane', icon: '📚' },
  { href: '/playlist', label: 'Çalma Listeleri', icon: '🎵' },
  { href: '/profile', label: 'Profil', icon: '👤' },
];

// Tema renkleri
const themes = {
  default: {
    primary: 'primary',
    secondary: 'secondary',
    accent: 'accent',
    highlight: 'accent',
    background: 'from-primary via-secondary to-accent',
  },
  dark: {
    primary: 'dark-bg',
    secondary: 'dark-secondary',
    accent: 'secondary',
    highlight: 'accent',
    background: 'from-dark-bg via-dark-secondary to-dark-bg',
  },
  sunset: {
    primary: 'primary',
    secondary: 'secondary',
    accent: 'accent',
    highlight: 'secondary',
    background: 'from-primary via-secondary to-accent',
  },
};

// Bu bileşen artık components/NavBar.js'e taşındı

function AppProgressBar() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleStart = () => setLoading(true);
    const handleComplete = () => setLoading(false);

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
    };
  }, [router]);

  return loading ? (
    <div className="fixed top-0 left-0 h-1 bg-pastel-pink animate-pulse w-full z-50"></div>
  ) : null;
}

function InstallPWAPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    // PWA yükleme hatırlatıcısını kontrol et
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeinstallprompt', (e) => {
        // Tarayıcının varsayılan hatırlatıcısını engelle
        e.preventDefault();
        // Hatırlatıcıyı daha sonra kullanmak üzere sakla
        setDeferredPrompt(e);
        // Kurulum hatırlatıcısını göster
        setShowPrompt(true);
      });
    }
  }, []);

  const handleInstallClick = () => {
    if (!deferredPrompt) return;

    // Kurulum hatırlatıcısını göster
    deferredPrompt.prompt();

    // Kullanıcının yanıtını bekle
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('Kullanıcı kurulumu kabul etti');
      } else {
        console.log('Kullanıcı kurulumu reddetti');
      }
      setDeferredPrompt(null);
      setShowPrompt(false);
    });
  };

  return showPrompt ? (
    <div className="fixed bottom-16 left-0 right-0 p-4 flex justify-center">
      <div className="bg-white shadow-xl rounded-xl p-4 max-w-md flex items-center">
        <div className="mr-4">
          <p className="font-bold">Music Assistant'ı yükle</p>
          <p className="text-sm text-gray-600">
            Daha iyi bir deneyim için uygulamayı cihazına ekle
          </p>
        </div>
        <button
          onClick={handleInstallClick}
          className="bg-pastel-green px-4 py-2 rounded-xl text-white font-semibold"
        >
          Yükle
        </button>
        <button onClick={() => setShowPrompt(false)} className="ml-2 text-gray-400">
          ✕
        </button>
      </div>
    </div>
  ) : null;
}

export default function MyApp({ Component, pageProps }) {
  const [theme, setTheme] = useState('default');

  const router = useRouter();

  useEffect(() => {
    // Tema tercihi varsa yerel depolamadan al
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme && themes[savedTheme]) {
        setTheme(savedTheme);
      }

      // Ana sayfadaysa ve giriş yapılmamışsa login sayfasına yönlendir
      const token = localStorage.getItem('token');
      if (router.pathname === '/' && !token) {
        router.push('/login');
      } else if (router.pathname === '/' && token) {
        // Eğer giriş yapılmış ve ana sayfadaysa direkt AI Chat'e yönlendir
        router.push('/ai-chat');
      }
    }
  }, [router.pathname]);

  // Yeni tema seçimi
  const changeTheme = (newTheme) => {
    if (themes[newTheme]) {
      setTheme(newTheme);
      localStorage.setItem('theme', newTheme);
    }
  };

  const currentTheme = themes[theme] || themes.default;

  // PWA servis çalışanını kaydet
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('/sw.js').then(
          function (registration) {
            console.log('Service Worker kaydı başarılı:', registration.scope);
          },
          function (err) {
            console.log('Service Worker kaydı başarısız:', err);
          }
        );
      });
    }

    // PWA yükleme bildirimi
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;

      // Kurulum butonunu göster
      const installButton = document.getElementById('pwa-install-button');
      if (installButton) {
        installButton.style.display = 'flex';
        installButton.addEventListener('click', () => {
          // Yükleme bildirimini göster
          deferredPrompt.prompt();

          // Kullanıcı yanıtını bekle
          deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
              console.log('Kullanıcı uygulamayı yükledi');
            }
            deferredPrompt = null;
            installButton.style.display = 'none';
          });
        });
      }
    });
  }, []);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#60A5FA" />
        <meta name="description" content="Music Assistant - Kişisel müzik asistanınız" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="manifest" href="/manifest.json" />
        <title>Music Assistant</title>
      </Head>
      <div className={`min-h-screen flex flex-col bg-gradient-to-br ${currentTheme.background}`}>
        <AppProgressBar />
        {router.pathname !== '/login' && router.pathname !== '/register' && (
          <NavBar theme={theme} />
        )}
        <main className="flex-1">
          <Component {...pageProps} theme={theme} changeTheme={changeTheme} />
        </main>
        <InstallPWAPrompt />
      </div>
    </>
  );
}
