// backend/routes/matches.js
// GET  /api/matches/results         — все реальные результаты
// POST /api/matches/results         — сохранить результат матча (только админ)
// GET  /api/matches/playoff         — состояние плей-офф сетки
// POST /api/matches/playoff         — обновить сетку плей-офф (только админ)
// GET  /api/users                   — список игроков (только админ)

const express = require('express');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// ── Реальные результаты матчей ───────────────────
router.get('/results', requireAuth, async (req, res) => {
  try {
    const result = await db.query('SELECT match_id, home_score, away_score FROM match_results');
    // Превращаем в { matchId: {homeScore, awayScore} }
    const results = {};
    result.rows.forEach(r => {
      results[r.match_id] = { homeScore: r.home_score, awayScore: r.away_score };
    });
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ── Сохранить результат матча (только админ) ──────
router.post('/results', requireAdmin, async (req, res) => {
  const { matchId, homeScore, awayScore } = req.body;

  if (matchId == null || homeScore == null || awayScore == null) {
    return res.status(400).json({ error: 'Нужны matchId, homeScore, awayScore' });
  }

  try {
    await db.query(
      `INSERT INTO match_results (match_id, home_score, away_score, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (match_id)
       DO UPDATE SET home_score = $2, away_score = $3, updated_at = NOW()`,
      [matchId, homeScore, awayScore]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ── Удалить результат матча (только админ) ────────
router.delete('/results/:matchId', requireAdmin, async (req, res) => {
  try {
    await db.query('DELETE FROM match_results WHERE match_id = $1', [req.params.matchId]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ── Плей-офф сетка ───────────────────────────────
router.get('/playoff', requireAuth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT round_id, slot_idx, home_team, away_team, home_score, away_score, winner FROM playoff_results ORDER BY round_id, slot_idx'
    );
    // Группируем по раундам
    const playoff = {};
    result.rows.forEach(r => {
      if (!playoff[r.round_id]) playoff[r.round_id] = [];
      playoff[r.round_id][r.slot_idx] = {
        home: r.home_team, away: r.away_team,
        homeScore: r.home_score, awayScore: r.away_score, winner: r.winner
      };
    });
    res.json(playoff);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ── Обновить плей-офф (только админ) ─────────────
router.post('/playoff', requireAdmin, async (req, res) => {
  // Принимаем один матч за раз
  const { roundId, slotIdx, homeTeam, awayTeam, homeScore, awayScore, winner } = req.body;

  if (!roundId || slotIdx == null) {
    return res.status(400).json({ error: 'Нужны roundId и slotIdx' });
  }

  try {
    await db.query(
      `INSERT INTO playoff_results (round_id, slot_idx, home_team, away_team, home_score, away_score, winner)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (round_id, slot_idx)
       DO UPDATE SET home_team=$3, away_team=$4, home_score=$5, away_score=$6, winner=$7`,
      [roundId, slotIdx, homeTeam || '', awayTeam || '', homeScore, awayScore, winner || null]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ── Список игроков (только админ) ────────────────
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, name, email, color, created_at FROM users ORDER BY created_at'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ── Удалить игрока (только админ) ────────────────
router.delete('/users/:id', requireAdmin, async (req, res) => {
  try {
    await db.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
