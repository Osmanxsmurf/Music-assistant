import React from 'react';
import styles from '../styles/SongCard.module.css';

const SongCard = ({ song, onPlay, onAddLibrary, onAddFavorite }) => {
  if (!song) return null;

  return (
    <div className={styles.songCard || 'song-card'}>
      <div className={styles.songImage || 'song-image'}>
        {song.thumbnail_url ? (
          <img 
            src={song.thumbnail_url} 
            alt={`${song.title} kapak`} 
            className={styles.coverImage || 'cover-image'}
          />
        ) : (
          <div className={styles.placeholderImage || 'placeholder-image'}>
            <span>🎵</span>
          </div>
        )}
      </div>
      <div className={styles.songInfo || 'song-info'}>
        <h3 className={styles.songTitle || 'song-title'}>{song.title || 'Bilinmeyen Şarkı'}</h3>
        <p className={styles.artistName || 'artist-name'}>{song.artist || 'Bilinmeyen Sanatçı'}</p>
        <p className={styles.songMeta || 'song-meta'}>
          {song.genre && <span className={styles.genre || 'genre'}>{song.genre}</span>}
          {song.mood && <span className={styles.mood || 'mood'}>{song.mood}</span>}
        </p>
      </div>
      <div className={styles.songActions || 'song-actions'}>
        <button 
          className={styles.playButton || 'play-button'} 
          onClick={() => onPlay && onPlay(song)}
          title="Şarkıyı Çal"
        >
          ▶️
        </button>
        <button 
          className={styles.addButton || 'add-button'} 
          onClick={() => onAddLibrary && onAddLibrary(song)}
          title="Kütüphaneye Ekle"
        >
          ➕
        </button>
        <button 
          className={styles.favoriteButton || 'favorite-button'} 
          onClick={() => onAddFavorite && onAddFavorite(song)}
          title="Favorilere Ekle"
        >
          ❤️
        </button>
      </div>
    </div>
  );
};

export default SongCard;
