import React from 'react';
import Head from 'next/head';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from '../styles/Home.module.css';
import { useRouter } from 'next/router';

// Offline mod için şarkı veritabanı (geçici kullanım için)
const offlineSongDatabase = [];

// Geliştirilmiş Mood kelimeleri için örnek VAD değerleri
const moodLexicon = {
  mutlu: { valence: 0.8, arousal: 0.6, dominance: 0.7 },
  üzgün: { valence: 0.2, arousal: 0.3, dominance: 0.3 },
  enerjik: { valence: 0.7, arousal: 0.9, dominance: 0.8 },
  romantik: { valence: 0.7, arousal: 0.4, dominance: 0.5 },
  nostaljik: { valence: 0.6, arousal: 0.3, dominance: 0.4 },
  sakin: { valence: 0.5, arousal: 0.2, dominance: 0.4 },
};

// Günlük öneri fonksiyonu
function getDailyRecommendations(songs) {
  if (!songs || songs.length === 0) return [];
  // Rastgele öneriler döndür, maksimum 10 şarkı
  return [...songs].sort(() => 0.5 - Math.random()).slice(0, 10);
}

// Ruh haline göre öneri fonksiyonu
function getMoodRecommendations(userMood, songs, moodLexicon) {
  if (!songs || songs.length === 0 || !userMood || !moodLexicon) return [];

  // Ruh hali verisini al, yoksa varsayılan değerler kullan
  const moodData = moodLexicon[userMood.toLowerCase()] || {
    valence: 0.5,
    arousal: 0.5,
    dominance: 0.5,
  };

  // Şarkıları VAD değerlerine göre sırala
  const scoredSongs = songs.map((song) => {
    // Şarkının VAD değerleri
    const valence = song.valence || 0.5;
    const arousal = song.arousal || 0.5;
    const dominance = song.dominance || 0.5;

    // Öklid mesafesi kullanarak benzerlik skoru hesapla
    const score = Math.sqrt(
      Math.pow(valence - moodData.valence, 2) +
        Math.pow(arousal - moodData.arousal, 2) +
        Math.pow(dominance - moodData.dominance, 2)
    );

    return { ...song, score };
  });

  // En düşük skorlu (en benzer) şarkıları döndür
  return scoredSongs.sort((a, b) => a.score - b.score).slice(0, 10);
}

// YouTube Player API entegrasyonu
const useYouTubePlayer = (currentSong) => {
  const playerRef = useRef(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [playerError, setPlayerError] = useState(null);

  // YouTube URL'sinden video ID'sini çıkar
  const getYoutubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[1].length === 11 ? match[1] : null;
  };

  useEffect(() => {
    // YouTube API sadece bir kez yüklensin
    if (typeof window !== 'undefined') {
      if (!window.YT) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        window.onYouTubeIframeAPIReady = () => {
          setPlayerReady(true);
        };
      } else if (window.YT && window.YT.Player) {
        setPlayerReady(true);
      }
    }
  }, []);

  useEffect(() => {
    if (playerReady && currentSong && typeof window !== 'undefined') {
      const videoId = getYoutubeId(currentSong.youtubeUrl);
      if (!videoId) {
        setPlayerError('Geçerli bir YouTube ID bulunamadı.');
        return;
      }
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          /* ignore */
        }
      }
      try {
        playerRef.current = new window.YT.Player('youtube-player', {
          height: '0',
          width: '0',
          videoId: videoId,
          playerVars: {
            playsinline: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            rel: 0,
            modestbranding: 1,
          },
          events: {
            onReady: (event) => {
              event.target.setVolume(80);
            },
            onStateChange: (event) => {
              // Video bittiğinde
              if (event.data === window.YT.PlayerState.ENDED) {
                document.dispatchEvent(new CustomEvent('yt-video-ended'));
              }
            },
            onError: (event) => {
              setPlayerError(`YouTube oynatıcı hatası: ${event.data}`);
            },
          },
        });
      } catch (error) {
        setPlayerError(`Player oluşturma hatası: ${error.message}`);
      }
    }
    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (error) {
          console.error('YouTube player kapatılırken hata:', error);
        }
      }
    };
  }, [playerReady, currentSong]);

  const playVideo = () => {
    try {
      if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
        playerRef.current.playVideo();
        return true;
      }
    } catch (error) {
      setPlayerError(`Oynatma hatası: ${error.message}`);
    }
    return false;
  };

  const pauseVideo = () => {
    try {
      if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
        playerRef.current.pauseVideo();
        return true;
      }
    } catch (error) {
      setPlayerError(`Duraklatma hatası: ${error.message}`);
    }
    return false;
  };

  const seekTo = (seconds) => {
    try {
      if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
        playerRef.current.seekTo(seconds, true);
        return true;
      }
    } catch (error) {
      setPlayerError(`İlerleme hatası: ${error.message}`);
    }
    return false;
  };

  const setVolume = (volume) => {
    try {
      if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
        playerRef.current.setVolume(volume);
        return true;
      }
    } catch (error) {
      setPlayerError(`Ses ayarlama hatası: ${error.message}`);
    }
    return false;
  };

  return {
    playVideo,
    pauseVideo,
    seekTo,
    setVolume,
    playerError,
  };
};

// Ana Sayfa Komponenti
const Home = () => {
  const router = useRouter();
  const [songs, setSongs] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [library, setLibrary] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [nowPlaying, setNowPlaying] = useState(null);
  const [selectedMood, setSelectedMood] = useState('');
  const [theme, setTheme] = useState('default'); // 'default', 'dark', 'sunset'
  const [welcomeMessage, setWelcomeMessage] = useState('Bugün nasılsınız?');
  const [chatMessages, setChatMessages] = useState([
    { sender: 'ai', message: 'Bugün nasılsınız? Size nasıl yardımcı olabilirim?', songs: [] },
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // YouTube Player Hooks
  const { playVideo, pauseVideo, seekTo, setVolume, playerError } = useYouTubePlayer(nowPlaying);
  const [playerState, setPlayerState] = useState({
    isPlaying: false,
    progress: 0,
    duration: 0,
    volume: 80,
  });

  // Progress tracking intervali
  const progressInterval = useRef(null);

  // Theme switch
  const toggleTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('musicAssistantTheme', newTheme);
    document.body.className = `theme-${newTheme}`;
  };

  // Initialize with saved theme
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('musicAssistantTheme') || 'default';
      toggleTheme(savedTheme);
    }
  }, []);

  // Sayfa yüklenince şarkıları getir
  useEffect(() => {
    fetchSongs();

    // Video bittiğinde bir sonraki şarkıya geç
    const handleVideoEnded = () => {
      const currentIndex = songs.findIndex(
        (song) => song.title === nowPlaying?.title && song.artist === nowPlaying?.artist
      );
      if (currentIndex >= 0 && currentIndex < songs.length - 1) {
        playSong(songs[currentIndex + 1]);
      }
    };

    document.addEventListener('yt-video-ended', handleVideoEnded);
    return () => {
      document.removeEventListener('yt-video-ended', handleVideoEnded);
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [nowPlaying, songs]);

  // Chat mesajları değiştiğinde en alta scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Şarkıları çek
  const fetchSongs = async (mood = '') => {
    setLoading(true);
    try {
      let url = '/api/songs?limit=100';
      if (mood) {
        url += `&mood=${encodeURIComponent(mood)}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Şarkılar yüklenirken bir hata oluştu');
      }

      const data = await response.json();
      console.log('API Yanıtı:', data); // Veri yapısını kontrol et
      
      // API yanıtı formata göre doğru şekilde işle
      if (data && data.results && Array.isArray(data.results)) {
        setSongs(data.results);
        // İlk şarkılar geldiğinde öneriler de güncelle
        if (!mood) {
          setRecommendations(getDailyRecommendations(data.results));
        }
      } else if (data && Array.isArray(data)) {
        setSongs(data);
        if (!mood) {
          setRecommendations(getDailyRecommendations(data));
        }
      } else {
        console.error('Beklenmeyen veri formatı:', data);
        setSongs([]);
      }
    } catch (error) {
      console.error('Şarkı çekme hatası:', error);
      setSongs([]);
    } finally {
      setLoading(false);
    }
  };

  // Şarkı arama
  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/songs?search=${encodeURIComponent(searchTerm)}&limit=20`);

      if (!response.ok) {
        throw new Error('Arama sonuçları yüklenirken bir hata oluştu');
      }

      const data = await response.json();
      setSongs(data);
    } catch (error) {
      console.error('Arama hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  // Şarkı çalma
  const playSong = (song) => {
    if (!song) return;

    setNowPlaying(song);

    // Progress tracking'i başlat
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }

    // YouTube oynatıcıyı başlat
    setTimeout(() => {
      if (playVideo()) {
        setPlayerState((prev) => ({ ...prev, isPlaying: true }));

        // Progress senkronizasyonu
        progressInterval.current = setInterval(() => {
          const player = document.getElementById('youtube-player');
          if (player && player.getCurrentTime && player.getDuration) {
            try {
              const currentTime = player.getCurrentTime();
              const duration = player.getDuration();

              setPlayerState((prev) => ({
                ...prev,
                progress: currentTime,
                duration: duration,
              }));
            } catch (error) {
              console.error('Player progress hatası:', error);
            }
          }
        }, 1000);
      }
    }, 500);
  };

  // Şarkıyı duraklat/devam ettir
  const togglePlayPause = () => {
    if (playerState.isPlaying) {
      if (pauseVideo()) {
        setPlayerState((prev) => ({ ...prev, isPlaying: false }));
      }
    } else {
      if (playVideo()) {
        setPlayerState((prev) => ({ ...prev, isPlaying: true }));
      }
    }
  };

  // Chat mesajı gönderme
  const sendMessage = async (message) => {
    if (!message.trim()) return;

    // Kullanıcı mesajını ekle
    setChatMessages((prev) => [
      ...prev,
      {
        sender: 'user',
        message,
        songs: [],
      },
    ]);

    setInputText('');
    setChatLoading(true);

    try {
      // AI'dan yanıt al
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error('AI yanıtı alınamadı');
      }

      const data = await response.json();

      // AI yanıtını ekle
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          message: data.text,
          songs: data.songs || [],
        },
      ]);

      // İntente göre işlem yap
      if (data.intent === 'recommend_mood' && data.songs?.length > 0) {
        setRecommendations(data.songs);
      }
    } catch (error) {
      console.error('AI mesaj hatası:', error);

      // Hata mesajı ekle
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          message: 'Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.',
          songs: [],
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // Ruh hali seçildiğinde
  const handleMoodSelection = (mood) => {
    setSelectedMood(mood);
    fetchSongs(mood);

    // Ruh haline uygun mesaj gönder
    const moodMessages = {
      mutlu: 'Mutlu hissediyorum',
      üzgün: 'Bugün biraz hüzünlüyüm',
      romantik: 'Romantik bir ruh halindeyim',
      enerjik: 'Kendimi enerjik hissediyorum',
      nostaljik: 'Nostaljik bir ruh halindeyim',
      sakin: 'Sakin müzikler dinlemek istiyorum',
    };

    sendMessage(moodMessages[mood] || `${mood} hissediyorum`);
  };

  // Kütüphaneye ekleme
  const addToLibrary = (song) => {
    if (!song) return;

    const isAlreadyInLibrary = library.some(
      (item) => item.title === song.title && item.artist === song.artist
    );

    if (!isAlreadyInLibrary) {
      const newLibrary = [...library, song];
      setLibrary(newLibrary);

      // Local Storage'a kaydet
      localStorage.setItem('musicAssistantLibrary', JSON.stringify(newLibrary));

      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          message: `"${song.title}" şarkısı kütüphanenize eklendi.`,
          songs: [],
        },
      ]);
    } else {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          message: `"${song.title}" şarkısı zaten kütüphanenizde mevcut.`,
          songs: [],
        },
      ]);
    }
  };

  // Favori şarkıya ekleme
  const toggleFavorite = (song) => {
    if (!song) return;

    const updatedSongs = songs.map((s) => {
      if (s.title === song.title && s.artist === song.artist) {
        return { ...s, isFavorite: !s.isFavorite };
      }
      return s;
    });

    setSongs(updatedSongs);

    const message = updatedSongs.find((s) => s.title === song.title && s.artist === song.artist)
      .isFavorite
      ? `"${song.title}" favorilerinize eklendi.`
      : `"${song.title}" favorilerinizden çıkarıldı.`;

    setChatMessages((prev) => [
      ...prev,
      {
        sender: 'ai',
        message,
        songs: [],
      },
    ]);
  };

  // Çalma listesi oluşturma
  const createPlaylist = (name, songList) => {
    if (!name || !songList || songList.length === 0) return;

    const newPlaylist = {
      id: Date.now().toString(),
      name,
      songs: songList,
    };

    const updatedPlaylists = [...playlists, newPlaylist];
    setPlaylists(updatedPlaylists);

    // Local Storage'a kaydet
    localStorage.setItem('musicAssistantPlaylists', JSON.stringify(updatedPlaylists));

    setChatMessages((prev) => [
      ...prev,
      {
        sender: 'ai',
        message: `"${name}" çalma listesi oluşturuldu. ${songList.length} şarkı eklendi.`,
        songs: [],
      },
    ]);
  };

  // Geçmiş öneriler kısmını render et
  const renderSuggestions = () => {
    if (!recommendations || recommendations.length === 0) return null;

    return (
      <div className={styles.recommendations}>
        <h3>Sizin İçin Önerilen Şarkılar</h3>
        <div className={styles.songGrid}>
          {recommendations.map((song, index) => (
            <SongCard
              key={`rec-${index}-${song.title}`}
              song={song}
              onPlay={() => playSong(song)}
              onAddLibrary={() => addToLibrary(song)}
              onAddFavorite={() => toggleFavorite(song)}
            />
          ))}
        </div>
      </div>
    );
  };

  // Chat mesajlarını render et
  const renderChatMessages = () => {
    return (
      <div className={styles.chatContainer} ref={chatEndRef}>
        {chatMessages.map((msg, index) => (
          <div 
            key={`chat-${index}`}
            className={`${styles.chatBubble || 'chat-bubble'} ${msg.sender === 'user' ? styles.userMessage || 'user-message' : styles.botMessage || 'bot-message'}`}
          >
            <div className={styles.senderName || 'sender-name'}>{msg.sender === 'user' ? 'Siz' : 'Asistan'}</div>
            <div className={styles.messageContent || 'message-content'}>{msg.message}</div>
          </div>
        ))}
        {chatLoading && (
          <div className={styles.loadingIndicator}>
            <div className={styles.typingDot}></div>
            <div className={styles.typingDot}></div>
            <div className={styles.typingDot}></div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
    );
  };

  // Now Playing kısmını render et
  const renderNowPlaying = () => {
    if (!nowPlaying) return null;

    return (
      <div className={styles.nowPlayingBar}>
        <div className={styles.songInfo}>
          <img
            src={nowPlaying.coverUrl || 'https://via.placeholder.com/60'}
            alt={nowPlaying.title}
            className={styles.nowPlayingCover}
          />
          <div className={styles.songDetails}>
            <div className={styles.songTitle}>{nowPlaying.title}</div>
            <div className={styles.songArtist}>{nowPlaying.artist}</div>
          </div>
        </div>

        <div className={styles.playerControls}>
          <button
            className={styles.playerButton}
            onClick={() => {
              const index = songs.findIndex(
                (s) => s.title === nowPlaying.title && s.artist === nowPlaying.artist
              );
              if (index > 0) {
                playSong(songs[index - 1]);
              }
            }}
          >
            <span className="material-icons">skip_previous</span>
          </button>

          <button className={styles.playPauseButton} onClick={togglePlayPause}>
            <span className="material-icons">{playerState.isPlaying ? 'pause' : 'play_arrow'}</span>
          </button>

          <button
            className={styles.playerButton}
            onClick={() => {
              const index = songs.findIndex(
                (s) => s.title === nowPlaying.title && s.artist === nowPlaying.artist
              );
              if (index < songs.length - 1) {
                playSong(songs[index + 1]);
              }
            }}
          >
            <span className="material-icons">skip_next</span>
          </button>
        </div>

        <ProgressBar
          progress={playerState.progress}
          duration={playerState.duration}
          onSeek={(time) => seekTo(time)}
        />

        <div className={styles.volumeControl}>
          <span className="material-icons">volume_up</span>
          <input
            type="range"
            min="0"
            max="100"
            value={playerState.volume}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              setVolume(value);
              setPlayerState((prev) => ({ ...prev, volume: value }));
            }}
            className={styles.volumeSlider}
          />
        </div>

        <div id="youtube-player" style={{ display: 'none' }}></div>
      </div>
    );
  };

  return (
    <div className={`${styles.container} theme-${theme}`}>
      <Head>
        <title>Music Assistant | AI Müzik Asistanınız</title>
        <meta
          name="description"
          content="AI destekli müzik asistanı, kişisel müzik önerileri ve ruh halinize uygun şarkılar sunar."
        />
        <link rel="icon" href="/favicon.ico" />
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#4A90E2" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
      </Head>

      <div className="nav-container">
        <div className="search-container">
          <input
            type="text"
            placeholder="Şarkı veya sanatçı ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button onClick={handleSearch} className="search-button">
            Ara
          </button>
        </div>
        <div className="theme-toggle">
          <button onClick={toggleTheme} className="theme-button">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      <main className={styles.main}>
        <div className={`${styles.sidebar} ${showMobileMenu ? styles.showMobile : ''}`}>
          <div className={styles.sidebarSection}>
            <h3>Ruh Haliniz</h3>
            <div className={styles.moodSelector || 'mood-selector'}>
              {['Mutlu', 'Üzgün', 'Enerjik', 'Romantik', 'Nostaljik', 'Sakin'].map((mood) => (
                <button 
                  key={mood}
                  onClick={() => handleMoodSelection(mood.toLowerCase())}
                  className={styles.moodButton || 'mood-button'}
                >
                  {mood}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.sidebarSection}>
            <h3>Kütüphanem</h3>
            <div className={styles.libraryList}>
              {library.length > 0 ? (
                library.map((song, index) => (
                  <div
                    key={`lib-${index}`}
                    className={styles.librarySong}
                    onClick={() => playSong(song)}
                  >
                    <img src={song.coverUrl || 'https://via.placeholder.com/40'} alt={song.title} />
                    <div className={styles.libraryText}>
                      <div className={styles.libraryTitle}>{song.title}</div>
                      <div className={styles.libraryArtist}>{song.artist}</div>
                    </div>
                  </div>
                ))
              ) : (
                <p className={styles.emptyMessage}>Kütüphanenizde henüz şarkı yok.</p>
              )}
            </div>
          </div>

          <div className={styles.sidebarSection}>
            <h3>Çalma Listelerim</h3>
            <div className={styles.playlistList}>
              {playlists.length > 0 ? (
                playlists.map((playlist) => (
                  <div key={playlist.id} className={styles.playlistItem}>
                    <div className={styles.playlistName}>{playlist.name}</div>
                    <div className={styles.playlistCount}>{playlist.songs.length} şarkı</div>
                  </div>
                ))
              ) : (
                <p className={styles.emptyMessage}>Henüz çalma listeniz yok.</p>
              )}
            </div>
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.chatbox}>
            {renderChatMessages()}
            <div className={styles.chatInputContainer || 'chat-input-container'}>
              <input
                type="text"
                className={styles.chatInputField || 'chat-input-field'}
                placeholder="Bir mesaj yazın..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={chatLoading}
                onKeyPress={(e) => e.key === 'Enter' && !chatLoading && sendMessage(inputText)}
              />
              <button 
                className={styles.sendButton || 'send-button'}
                onClick={() => !chatLoading && sendMessage(inputText)}
                disabled={chatLoading}
              >
                Gönder
              </button>
            </div>
          </div>

          {recommendations.length > 0 && renderSuggestions()}

          <div className={styles.songSection}>
            <h2>Şarkılar</h2>
            {loading ? (
              <div className={styles.loadingSpinner}>Yükleniyor...</div>
            ) : (
              <div className={styles.songGrid}>
                {songs && Array.isArray(songs) && songs.length > 0 ? 
                  songs.slice(0, 20).map((song, index) => (
                    <SongCard
                      key={`song-${index}`}
                      song={song}
                      onPlay={() => playSong(song)}
                      onAddLibrary={() => addToLibrary(song)}
                      onAddFavorite={() => toggleFavorite(song)}
                    />
                  )) : 
                  <div className={styles.noResults || 'no-results'}>Şarkı bulunamadı</div>
                }
              </div>
            )}
          </div>
        </div>
      </main>

      {renderNowPlaying()}

      <footer className={styles.footer}>
        <p>Music Assistant &copy; {new Date().getFullYear()} | AI Destekli Müzik Asistanınız</p>
      </footer>
    </div>
  );
};

export default Home;
