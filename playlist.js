import React, { useState } from 'react';

export default function Playlist() {
  const [playlists, setPlaylists] = useState(() => {
    if (typeof window !== 'undefined') {
      const pls = localStorage.getItem('musicPlaylists');
      return pls ? JSON.parse(pls) : [];
    }
    return [];
  });

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('musicPlaylists', JSON.stringify(playlists));
    }
  }, [playlists]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-accent text-gray-800 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <h1 className="text-3xl font-bold mb-8 text-primary">Çalma Listelerim</h1>
        {playlists.length === 0 ? (
          <p className="text-lg text-gray-700">Henüz hiç çalma listesi oluşturmadınız.</p>
        ) : (
          <div className="w-full max-w-4xl">
            {playlists.map((pl) => (
              <div
                key={pl.name}
                className="mb-8 p-6 glass rounded-2xl shadow-2xl hover:scale-102 transition-transform duration-300"
              >
                <h2 className="font-bold text-2xl text-secondary mb-4">{pl.name}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {pl.songs.map((song) => (
                    <div
                      key={song.id}
                      className="flex items-center gap-4 p-3 bg-white/30 backdrop-blur-sm rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300"
                    >
                      <img
                        src={song.coverUrl || '/default-cover.png'}
                        alt="Album Cover"
                        className="w-12 h-12 rounded-lg object-cover border border-secondary/50 shadow-sm"
                        loading="lazy"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src =
                            'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150"><rect width="150" height="150" fill="%23A8E6CF"/><text x="50%" y="50%" font-family="Arial" font-size="18" fill="white" text-anchor="middle" dominant-baseline="middle">Müzik</text></svg>';
                        }}
                      />
                      <div className="flex-1">
                        <span className="font-bold text-primary">{song.title}</span>{' '}
                        <span className="text-secondary">- {song.artist}</span>
                      </div>
                      <a
                        href={song.youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-accent px-3 py-1 rounded-xl hover:bg-secondary text-white font-semibold shadow-md transition-colors duration-300"
                      >
                        Oynat
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
