const { getPool } = require('../_lib/db');
const { verifyToken } = require('../_lib/auth');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const user = verifyToken(req);
    const pool = getPool();

    if (req.method === 'GET') {
      const result = await pool.query(
        'SELECT round_id, slot_idx, home_team, away_team, home_score, away_score, winner FROM playoff_results ORDER BY round_id, slot_idx'
      );
      const playoff = {};
      result.rows.forEach(r => {
        if (!playoff[r.round_id]) playoff[r.round_id] = [];
        playoff[r.round_id][r.slot_idx] = {
          home: r.home_team, away: r.away_team,
          homeScore: r.home_score, awayScore: r.away_score, winner: r.winner
        };
      });
      return res.json(playoff);
    }

    if (!user.isAdmin) return res.status(403).json({ error: 'Только для администратора' });

    if (req.method === 'POST') {
      const { roundId, slotIdx, homeTeam, awayTeam, homeScore, awayScore, winner } = req.body;
      if (!roundId || slotIdx == null) return res.status(400).json({ error: 'Нужны roundId и slotIdx' });
      await pool.query(
        `INSERT INTO playoff_results (round_id, slot_idx, home_team, away_team, home_score, away_score, winner)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (round_id, slot_idx) DO UPDATE SET home_team=$3, away_team=$4, home_score=$5, away_score=$6, winner=$7`,
        [roundId, slotIdx, homeTeam || '', awayTeam || '', homeScore, awayScore, winner || null]
      );
      return res.json({ ok: true });
    }

    res.status(405).end();
  } catch (e) {
    res.status(401).json({ error: e.message });
  }
};
