// backend/routes/auth.js
// POST /api/auth/register  — регистрация
// POST /api/auth/login     — вход

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();

// Цвета аватаров — назначаются по порядку
const COLORS = ['#f5c518','#e05c1a','#27ae60','#3498db','#9b59b6','#e74c3c','#1abc9c','#f39c12'];

// ── Регистрация ──────────────────────────────────
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  // Простая валидация
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Заполните все поля' });
  }
  if (password.length < 4) {
    return res.status(400).json({ error: 'Пароль минимум 4 символа' });
  }
  if (email.toLowerCase() === process.env.ADMIN_EMAIL) {
    return res.status(400).json({ error: 'Этот email зарезервирован' });
  }

  try {
    // Хешируем пароль (10 — количество "раундов", чем больше — тем безопаснее)
    const passwordHash = await bcrypt.hash(password, 10);

    // Считаем сколько уже пользователей — для выбора цвета
    const countRes = await db.query('SELECT COUNT(*) FROM users');
    const count = parseInt(countRes.rows[0].count);
    const color = COLORS[count % COLORS.length];

    // Сохраняем в базу
    const result = await db.query(
      'INSERT INTO users (name, email, password_hash, color) VALUES ($1, $2, $3, $4) RETURNING id, name, email, color',
      [name, email.toLowerCase(), passwordHash, color]
    );
    const user = result.rows[0];

    // Создаём JWT-токен
    const token = jwt.sign(
      { id: user.id, email: user.email, isAdmin: false },
      process.env.JWT_SECRET,
      { expiresIn: '30d' } // токен живёт 30 дней
    );

    res.json({ token, user: { id: user.id, name: user.name, email: user.email, color: user.color, isAdmin: false } });

  } catch (err) {
    // Код 23505 — нарушение UNIQUE (email уже есть)
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Пользователь с таким email уже есть' });
    }
    console.error('Ошибка регистрации:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ── Вход ─────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Заполните все поля' });
  }

  const emailLower = email.toLowerCase();

  // Проверяем, не пытается ли войти админ
  if (emailLower === process.env.ADMIN_EMAIL) {
    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }
    const token = jwt.sign(
      { id: 'admin', email: emailLower, isAdmin: true },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    return res.json({
      token,
      user: { id: 'admin', name: 'Администратор', email: emailLower, color: '#e05c1a', isAdmin: true }
    });
  }

  try {
    // Ищем пользователя в базе
    const result = await db.query('SELECT * FROM users WHERE email = $1', [emailLower]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    // Сравниваем пароль с хешем
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, isAdmin: false },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, color: user.color, isAdmin: false }
    });

  } catch (err) {
    console.error('Ошибка входа:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
