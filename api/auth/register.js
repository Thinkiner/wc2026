const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const COLORS = ['#f5c518','#e05c1a','#27ae60','#3498db','#9b59b6','#e74c3c','#1abc9c','#f39c12'];

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Заполните все поля' });
  if (password.length < 4) return res.status(400).json({ error: 'Пароль минимум 4 символа' });
  if (email.toLowerCase() === process.env.ADMIN_EMAIL) return res.status(400).json({ error: 'Email зарезервирован' });

  try {
    const countRes = await pool.query('SELECT COUNT(*) FROM users');
    const color = COLORS[parseInt(countRes.rows[0].count) % COLORS.length];
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash, color) VALUES ($1,$2,$3,$4) RETURNING id, name, email, color',
      [name, email.toLowerCase(), hash, color]
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email, isAdmin: false }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, color: user.color, isAdmin: false } });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Email уже зарегистрирован' });
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера: ' + err.message });
  }
};