import { useState } from 'react';
import Head from 'next/head';

export default function Search() {
  const [searchTerm, setSearchTerm] = useState('');
  const [songs, setSongs] = useState([]);
  const [library, setLibrary] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    const res = await fetch(`/search?q=${encodeURIComponent(searchTerm)}`);
    const data = await res.json();
    setSongs(data.results || []);
  };

  const addToLibrary = (song) => {
    if (!library.find((s) => s.id === song.id)) {
      setLibrary([...library, song]);
      if (typeof window !== 'undefined') {
        localStorage.setItem('musicLibrary', JSON.stringify([...library, song]));
      }
    }
  };

  const addToPlaylist = (song) => {
    const playlistName = prompt('Çalma listesi adı:');
    if (playlistName) {
      let updated = false;
      const newPlaylists = playlists.map((pl) => {
        if (pl.name === playlistName) {
          updated = true;
          return { ...pl, songs: [...pl.songs, song] };
        }
        return pl;
      });
      if (!updated) {
        newPlaylists.push({ name: playlistName, songs: [song] });
      }
      setPlaylists(newPlaylists);
      if (typeof window !== 'undefined') {
        localStorage.setItem('musicPlaylists', JSON.stringify(newPlaylists));
      }
    }
  };

  const playSong = (song) => setCurrentSong(song);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-accent text-gray-800 flex flex-col">
      <Head>
        <title>Şarkı Ara | Music Assistant</title>
      </Head>
      <main className="flex-1 flex flex-col items-center justify-start p-8">
        <h1 className="text-3xl font-bold mb-8 text-primary">Şarkı Arama</h1>
        <div className="mb-10 w-full max-w-xl flex flex-row shadow-lg rounded-xl overflow-hidden bg-white bg-opacity-90">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Şarkı veya sanatçı ara..."
            className="p-4 border-none outline-none w-full bg-transparent text-lg"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            className="bg-accent text-gray-900 font-bold px-8 py-4 hover:bg-secondary transition text-lg"
          >
            Ara
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl">
          {songs.length === 0 && (
            <div className="text-center text-gray-500 col-span-full">
              Aramak için bir kelime yazın ve "Ara"ya tıklayın.
            </div>
          )}
          {songs.map((song) => (
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
              <div className="flex gap-2 mt-2">
                <a
                  href={song.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-accent hover:bg-secondary rounded-xl text-white font-semibold shadow text-center"
                >
                  Oynat
                </a>
                <button
                  onClick={() => addToLibrary(song)}
                  className="px-4 py-2 bg-primary hover:bg-accent rounded-xl text-secondary font-semibold shadow text-center"
                >
                  Kütüphaneye Ekle
                </button>
                <button
                  onClick={() => addToPlaylist(song)}
                  className="px-4 py-2 bg-secondary hover:bg-accent rounded-xl text-white font-semibold shadow text-center"
                >
                  Çalma Listesine
                </button>
              </div>
              <button
                onClick={() => playSong(song)}
                className="mt-2 px-4 py-2 bg-secondary hover:bg-primary rounded-xl text-secondary font-semibold shadow text-center"
              >
                Şimdi Çal
              </button>
            </div>
          ))}
        </div>
      </main>
      {/* Şimdi Çalıyor Çubuğu */}
      {currentSong && (
        <div className="fixed bottom-0 left-0 right-0 bg-white bg-opacity-95 p-4 shadow-lg flex items-center z-50 border-t border-primary">
          <img
            src={currentSong.coverUrl || '/default-cover.png'}
            alt="Album Cover"
            className="w-12 h-12 mr-4 rounded object-cover border border-secondary"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src =
                'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150"><rect width="150" height="150" fill="%23A8E6CF"/><text x="50%" y="50%" font-family="Arial" font-size="18" fill="white" text-anchor="middle" dominant-baseline="middle">Müzik</text></svg>';
            }}
          />
          <div className="flex-1">
            <span className="font-bold text-lg text-secondary">{currentSong.title}</span>{' '}
            <span className="text-primary">- {currentSong.artist}</span>
          </div>
          <button className="bg-primary text-white px-4 py-2 rounded hover:bg-secondary font-semibold mx-2">
            Duraklat
          </button>
          <button className="bg-accent text-white px-4 py-2 rounded hover:bg-secondary font-semibold mx-2">
            Sonraki
          </button>
        </div>
      )}
    </div>
  );
}
