console.log("START");
// backend/server.js
// Точка входа — запускает Express-сервер

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const predictionsRoutes = require('./routes/predictions');
const matchesRoutes = require('./routes/matches');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/predictions', predictionsRoutes);
app.use('/api/matches', matchesRoutes);

app.use(express.static(path.join(__dirname, '../frontend/public')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен: http://localhost:${PORT}`);
});