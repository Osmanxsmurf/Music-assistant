import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Profile() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    // Token'dan e-posta bilgisini çözümle (isteğe bağlı, backend'den de çekilebilir)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setEmail(payload.email || 'Kullanıcı');
    } catch {
      setEmail('Kullanıcı');
    }
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary via-secondary to-accent">
        Yükleniyor...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-accent flex flex-col items-center justify-center">
      <Head>
        <title>Profil | Music Assistant</title>
      </Head>
      <div className="glass p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/30 hover:scale-105 transition-transform duration-300">
        <h1 className="text-2xl font-bold mb-4 text-primary">Profil</h1>
        <p className="mb-2">
          Hoş geldin, <span className="font-semibold">{email}</span>!
        </p>
        <button
          className="mt-4 bg-accent text-white py-2 px-4 rounded-xl hover:bg-secondary transition font-semibold shadow-md"
          onClick={() => {
            localStorage.removeItem('token');
            router.push('/login');
          }}
        >
          Çıkış Yap
        </button>
      </div>
    </div>
  );
}
