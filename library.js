import Head from 'next/head';
import React, { useState } from 'react';

export default function Library() {
  const [library, setLibrary] = useState(() => {
    if (typeof window !== 'undefined') {
      const lib = localStorage.getItem('musicLibrary');
      return lib ? JSON.parse(lib) : [];
    }
    return [];
  });

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('musicLibrary', JSON.stringify(library));
    }
  }, [library]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-accent text-gray-800 flex flex-col">
      <Head>
        <title>Kütüphane | Music Assistant</title>
      </Head>
      <main className="flex-1 flex flex-col items-center justify-center p-8">
        <h1 className="text-3xl font-bold mb-8 text-primary">Kütüphanem</h1>
        {library.length === 0 ? (
          <p className="text-lg text-gray-700">Henüz hiç şarkı eklemediniz.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl">
            {library.map((song) => (
              <div
                key={song.id}
                className="p-6 bg-white bg-opacity-90 rounded-2xl shadow-2xl flex flex-col items-start border-2 border-primary hover:scale-105 transition-transform"
              >
                <img
                  src={song.coverUrl || '/default-cover.png'}
                  alt="Album Cover"
                  className="w-20 h-20 rounded-lg mb-2 object-cover border border-secondary shadow"
                  loading="lazy"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src =
                      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150"><rect width="150" height="150" fill="%23A8E6CF"/><text x="50%" y="50%" font-family="Arial" font-size="18" fill="white" text-anchor="middle" dominant-baseline="middle">Müzik</text></svg>';
                  }}
                />
                <h3 className="font-bold text-xl mb-1 text-primary">{song.title}</h3>
                <p className="mb-3 text-secondary italic">{song.artist}</p>
                <a
                  href={song.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto bg-accent px-4 py-2 rounded-xl hover:bg-secondary transition font-bold shadow text-white"
                >
                  Oynat
                </a>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
