/**
 * Xata veritabanı şema tanımları
 * Music Assistant uygulaması için veri modelini tanımlar
 */

// Şarkı tablosu şeması - Xata'da oluşturulacak tablo yapısı
const songSchema = {
  id: { type: 'string', unique: true },
  title: { type: 'string', notNull: true },
  artist: { type: 'string', notNull: true },
  album: { type: 'string' },
  genre: { type: 'string' },
  youtubeUrl: { type: 'string' },
  coverUrl: { type: 'string' },
  valence: { type: 'float' },
  arousal: { type: 'float' },
  dominance: { type: 'float' },
  mood: { type: 'multiple' }, // Xata'da multiple type kullanarak dizi saklayabilirsiniz
  playCount: { type: 'int', defaultValue: 0 },
  isTurkish: { type: 'bool', defaultValue: false },
  createdAt: { type: 'datetime' },
  updatedAt: { type: 'datetime' }
};

// Kullanıcı tablosu şeması
const userSchema = {
  id: { type: 'string', unique: true },
  username: { type: 'string', unique: true, notNull: true },
  email: { type: 'string', unique: true },
  password: { type: 'string', notNull: true }, // Şifrelenmiş olmalı
  favoriteGenres: { type: 'multiple' },
  favoriteMoods: { type: 'multiple' },
  createdAt: { type: 'datetime' },
  updatedAt: { type: 'datetime' }
};

// Çalma listesi tablosu şeması
const playlistSchema = {
  id: { type: 'string', unique: true },
  name: { type: 'string', notNull: true },
  description: { type: 'text' },
  userId: { type: 'link', link: { table: 'users' } }, // Kullanıcı ile ilişki
  isPublic: { type: 'bool', defaultValue: true },
  createdAt: { type: 'datetime' },
  updatedAt: { type: 'datetime' }
};

// Çalma listesi ve şarkı arasındaki ilişki tablosu
const playlistSongSchema = {
  id: { type: 'string', unique: true },
  playlistId: { type: 'link', link: { table: 'playlists' } },
  songId: { type: 'link', link: { table: 'songs' } },
  order: { type: 'int', defaultValue: 0 },
  addedAt: { type: 'datetime' }
};

// Kullanıcı etkileşimleri tablosu (beğeniler, tıklamalar, vb.)
const userInteractionSchema = {
  id: { type: 'string', unique: true },
  userId: { type: 'link', link: { table: 'users' } },
  songId: { type: 'link', link: { table: 'songs' } },
  interactionType: { type: 'string', notNull: true }, // like, view, skip, vs.
  createdAt: { type: 'datetime' }
};

module.exports = {
  songSchema,
  userSchema,
  playlistSchema,
  playlistSongSchema,
  userInteractionSchema
};
