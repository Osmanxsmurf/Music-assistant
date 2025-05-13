import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function AIChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [library, setLibrary] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [dailyRecommendations, setDailyRecommendations] = useState([]);
  const messagesEndRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    setMessages([{ text: 'Merhaba! Sana nasıl yardımcı olabilirim?', sender: 'bot', timestamp: new Date().toISOString() }]);
    loadDailyRecommendations();
    loadLibrary();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadDailyRecommendations = async () => {
    try {
      const response = await axios.get('/api/songs?limit=5');
      setDailyRecommendations(response.data.songs);
    } catch (error) {
      console.error('Günlük öneriler yüklenemedi:', error);
    }
  };

  const loadLibrary = () => {
    const savedLibrary = JSON.parse(localStorage.getItem('musicLibrary')) || [];
    setLibrary(savedLibrary);
  };

  const saveToLibrary = (song) => {
    const updatedLibrary = [...library, song];
    setLibrary(updatedLibrary);
    localStorage.setItem('musicLibrary', JSON.stringify(updatedLibrary));
  };

  const searchSongs = async (query) => {
    if (!query.trim()) return;
    setIsLoading(true);
    try {
      const response = await axios.post('/api/ai-chat', { message: `şarkı ara ${query}` });
      setSearchResults(response.data.recommendations || []);
    } catch (error) {
      console.error('Arama hatası:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (messageText) => {
    if (!messageText.trim()) return;

    const userMessage = { text: messageText, sender: 'user', timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await axios.post('/api/ai-chat', { message: messageText });
      const data = response.data;
      setMessages((prev) => [
        ...prev,
        {
          text: data.text,
          sender: 'bot',
          recommendations: data.recommendations || [],
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error('Hata:', error);
      setMessages((prev) => [
        ...prev,
        { text: 'Bir hata oluştu, tekrar deneyin.', sender: 'bot', timestamp: new Date().toISOString() },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    searchSongs(searchInputRef.current.value);
  };

  const goToSong = (song) => {
    if (song.youtubeUrl) window.open(song.youtubeUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-100 to-teal-100 p-6 font-poppins">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-green-500 to-teal-600 text-white p-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Music Assistant</h1>
          <div className="text-sm italic">Doğa ile Müziğin Buluşması</div>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Günlük Öneriler</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {dailyRecommendations.map((song, idx) => (
                <div key={idx} className="flex items-center p-3 bg-green-50 rounded-lg shadow-sm hover:bg-green-100 transition-all">
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{song.title}</p>
                    <p className="text-sm text-gray-600">{song.artist}</p>
                  </div>
                  <button
                    onClick={() => goToSong(song)}
                    className="ml-3 text-teal-600 hover:text-teal-800 transition-colors"
                  >
                    ▶️
                  </button>
                  <button
                    onClick={() => saveToLibrary(song)}
                    className="ml-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    💾
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Şarkı Ara</h2>
            <form onSubmit={handleSearchSubmit} className="flex">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Şarkı veya sanatçı ara..."
                className="flex-1 p-3 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-3 bg-teal-500 text-white rounded-r-lg hover:bg-teal-600 transition-colors disabled:opacity-50"
              >
                Ara
              </button>
            </form>
            {searchResults.length > 0 && (
              <div className="mt-4 space-y-3">
                {searchResults.map((song, idx) => (
                  <div key={idx} className="flex items-center p-3 bg-green-50 rounded-lg shadow-sm hover:bg-green-100 transition-all">
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{song.title}</p>
                      <p className="text-sm text-gray-600">{song.artist}</p>
                    </div>
                    <button
                      onClick={() => goToSong(song)}
                      className="ml-3 text-teal-600 hover:text-teal-800 transition-colors"
                    >
                      ▶️
                    </button>
                    <button
                      onClick={() => saveToLibrary(song)}
                      className="ml-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      💾
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Kütüphanem</h2>
            {library.length === 0 ? (
              <p className="text-gray-600">Henüz kütüphanene şarkı eklemedin.</p>
            ) : (
              <div className="space-y-3">
                {library.map((song, idx) => (
                  <div key={idx} className="flex items-center p-3 bg-green-50 rounded-lg shadow-sm hover:bg-green-100 transition-all">
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{song.title}</p>
                      <p className="text-sm text-gray-600">{song.artist}</p>
                    </div>
                    <button
                      onClick={() => goToSong(song)}
                      className="ml-3 text-teal-600 hover:text-teal-800 transition-colors"
                    >
                      ▶️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="h-64 overflow-y-auto p-4 bg-green-50 rounded-lg">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`mb-3 p-3 rounded-lg ${
                  msg.sender === 'user' ? 'bg-blue-100 ml-auto' : 'bg-teal-100'
                } max-w-[80%]`}
              >
                <p>{msg.text}</p>
                {msg.recommendations && msg.recommendations.length > 0 && (
                  <div className="mt-2 space-y-2">
                    <p className="font-medium text-sm">Öneriler:</p>
                    {msg.recommendations.map((song, idx) => (
                      <div
                        key={idx}
                        className="flex items-center p-2 bg-white rounded cursor-pointer hover:bg-gray-100 transition-all"
                      >
                        <p className="flex-1">{song.title} - {song.artist}</p>
                        <button
                          onClick={() => goToSong(song)}
                          className="ml-2 text-teal-600 hover:text-teal-800 transition-colors"
                        >
                          ▶️
                        </button>
                        <button
                          onClick={() => saveToLibrary(song)}
                          className="ml-2 text-gray-600 hover:text-gray-800 transition-colors"
                        >
                          💾
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="mb-3 p-3 rounded-lg bg-teal-100 max-w-[80%]">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-teal-500 animate-pulse"></div>
                  <div className="w-2 h-2 bg-teal-500 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-teal-500 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="mt-4 flex">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Mesaj yaz..."
              className="flex-1 p-3 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-4 py-3 bg-teal-500 text-white rounded-r-lg hover:bg-teal-600 transition-colors disabled:opacity-50"
            >
              Gönder
            </button>
          </form>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap');
        .font-poppins {
          font-family: 'Poppins', sans-serif;
        }
        .bg-gradient-to-b {
          background: linear-gradient(to bottom, #f0fdf4, #ccfbf1);
        }
        .bg-gradient-to-r {
          background: linear-gradient(to right, #10b981, #14b8a6);
        }
        .rounded-lg {
          border-radius: 1rem;
        }
        .shadow-2xl {
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }
        .transition-all {
          transition: all 0.3s ease;
        }
        .animate-pulse {
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
