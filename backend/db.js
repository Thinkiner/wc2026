// backend/db.js
// Подключение к PostgreSQL через переменную DATABASE_URL

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Render требует SSL для внешних подключений
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('render.com')
    ? { rejectUnauthorized: false }
    : false,
});

// Проверяем подключение при старте
// pool.connect((err, client, release) => {
//   if (err) {
//     console.error('❌ Ошибка подключения к базе данных:', err.message);
//   } else {
//     console.log('✅ База данных подключена');
//     release();
//   }
// });

module.exports = pool;
