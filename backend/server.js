console.log("SERVER FILE STARTED");
// backend/server.js
// Точка входа — запускает Express-сервер

require('dotenv').config(); // загружает переменные из .env

const express = require('express');
const cors = require('cors');
const path = require('path');

// const authRoutes = require('./routes/auth');
// const predictionsRoutes = require('./routes/predictions');
// const matchesRoutes = require('./routes/matches');

const app = express();

// ── Middleware ────────────────────────────────────
app.use(cors()); // разрешаем запросы с любого домена
app.use(express.json()); // парсим JSON в теле запросов

// ── API маршруты ──────────────────────────────────
// app.use('/api/auth', authRoutes);
// app.use('/api/predictions', predictionsRoutes);
// app.use('/api/matches', matchesRoutes);

// ── Статичные файлы frontend ──────────────────────
// Render будет раздавать HTML/JS/CSS из папки frontend/public
app.use(express.static(path.join(__dirname, '../frontend/public')));

app.get('/', (req, res) => {
  res.send("OK");
});

// Все остальные запросы отдают index.html (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
});

// ── Запуск ────────────────────────────────────────
// process.env.PORT — Render сам задаёт этот порт, не меняйте
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен: http://localhost:${PORT}`);
  console.log(`📊 Режим: ${process.env.NODE_ENV || 'development'}`);
});
