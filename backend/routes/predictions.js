// backend/routes/predictions.js
// GET  /api/predictions/my         — мои прогнозы (авторизованный)
// POST /api/predictions/group      — сохранить прогноз на матч группового этапа
// POST /api/predictions/playoff    — сохранить прогноз на матч плей-офф
// GET  /api/predictions/all        — все прогнозы всех игроков (только админ)

const express = require('express');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// ── Мои прогнозы ─────────────────────────────────
router.get('/my', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Админ не является игроком — у него нет строки в таблице users
    // Возвращаем пустые прогнозы чтобы не было ошибки
    if (req.user.isAdmin) {
      return res.json({ group: {}, playoff: {} });
    }

    // Групповые прогнозы
    const groupRes = await db.query(
      'SELECT match_id, home_score, away_score FROM predictions WHERE user_id = $1',
      [userId]
    );

    // Плей-офф прогнозы
    const poRes = await db.query(
      'SELECT round_id, slot_idx, home_score, away_score FROM playoff_predictions WHERE user_id = $1',
      [userId]
    );

    // Превращаем в удобный объект { matchId: {h, a} }
    const group = {};
    groupRes.rows.forEach(row => {
      group[row.match_id] = { h: row.home_score, a: row.away_score };
    });

    // Плей-офф: { 'r32_0': {h, a}, ... }
    const playoff = {};
    poRes.rows.forEach(row => {
      playoff[`${row.round_id}_${row.slot_idx}`] = { h: row.home_score, a: row.away_score };
    });

    res.json({ group, playoff });

  } catch (err) {
    console.error('Ошибка получения прогнозов:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ── Сохранить групповой прогноз ──────────────────
router.post('/group', requireAuth, async (req, res) => {
  const { matchId, homeScore, awayScore } = req.body;
  const userId = req.user.id;

  if (matchId == null || homeScore == null || awayScore == null) {
    return res.status(400).json({ error: 'Не переданы matchId, homeScore, awayScore' });
  }

  try {
    // INSERT ... ON CONFLICT — если уже есть, обновляем
    await db.query(
      `INSERT INTO predictions (user_id, match_id, home_score, away_score)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, match_id)
       DO UPDATE SET home_score = $3, away_score = $4`,
      [userId, matchId, homeScore, awayScore]
    );
    res.json({ ok: true });

  } catch (err) {
    console.error('Ошибка сохранения прогноза:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ── Сохранить плей-офф прогноз ───────────────────
router.post('/playoff', requireAuth, async (req, res) => {
  const { roundId, slotIdx, homeScore, awayScore } = req.body;
  const userId = req.user.id;

  if (!roundId || slotIdx == null || homeScore == null || awayScore == null) {
    return res.status(400).json({ error: 'Не переданы roundId, slotIdx, homeScore, awayScore' });
  }

  try {
    await db.query(
      `INSERT INTO playoff_predictions (user_id, round_id, slot_idx, home_score, away_score)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, round_id, slot_idx)
       DO UPDATE SET home_score = $4, away_score = $5`,
      [userId, roundId, slotIdx, homeScore, awayScore]
    );
    res.json({ ok: true });

  } catch (err) {
    console.error('Ошибка сохранения плей-офф прогноза:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ── Все прогнозы всех игроков (все авторизованные) ─
// Нужно игрокам для таблицы лидеров, и админу для просмотра прогнозов
router.get('/all', requireAuth, async (req, res) => {
  try {
    // Присоединяем имя пользователя
    const groupRes = await db.query(
      `SELECT p.user_id, u.name, u.color, p.match_id, p.home_score, p.away_score
       FROM predictions p
       JOIN users u ON u.id = p.user_id
       ORDER BY p.user_id, p.match_id`
    );

    const poRes = await db.query(
      `SELECT p.user_id, u.name, p.round_id, p.slot_idx, p.home_score, p.away_score
       FROM playoff_predictions p
       JOIN users u ON u.id = p.user_id`
    );

    // Группируем по user_id
    const byUser = {};
    groupRes.rows.forEach(row => {
      if (!byUser[row.user_id]) byUser[row.user_id] = { name: row.name, color: row.color, group: {}, playoff: {} };
      byUser[row.user_id].group[row.match_id] = { h: row.home_score, a: row.away_score };
    });
    poRes.rows.forEach(row => {
      if (!byUser[row.user_id]) byUser[row.user_id] = { name: row.name, color: '#aaa', group: {}, playoff: {} };
      byUser[row.user_id].playoff[`${row.round_id}_${row.slot_idx}`] = { h: row.home_score, a: row.away_score };
    });

    res.json(byUser);

  } catch (err) {
    console.error('Ошибка получения всех прогнозов:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
