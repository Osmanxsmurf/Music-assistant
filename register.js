import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';

const db = new sqlite3.Database('./users.db');

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { email, password } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      db.run(
        'INSERT INTO users (email, password) VALUES (?, ?)',
        [email, hashedPassword],
        (err) => {
          if (err) {
            return res.status(400).json({ message: 'Kullanıcı zaten mevcut' });
          }
          res.status(201).json({ message: 'Kullanıcı kaydedildi' });
        }
      );
    } catch (error) {
      res.status(500).json({ message: 'Sunucu hatası' });
    }
  } else {
    res.status(405).json({ message: 'Geçersiz istek metodu' });
  }
}
