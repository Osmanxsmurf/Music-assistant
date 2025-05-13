import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const db = new sqlite3.Database('./users.db');

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { email, password } = req.body;
    try {
      db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err || !user) {
          return res.status(401).json({ message: 'Kullanıcı bulunamadı' });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          return res.status(401).json({ message: 'Şifre yanlış' });
        }
        const token = jwt.sign({ id: user.id }, 'secret_key', { expiresIn: '1h' });
        res.status(200).json({ token });
      });
    } catch (error) {
      res.status(500).json({ message: 'Sunucu hatası' });
    }
  } else {
    res.status(405).json({ message: 'Geçersiz istek metodu' });
  }
}
