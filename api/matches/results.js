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
      const result = await pool.query('SELECT match_id, home_score, away_score, penalty_winner FROM match_results');
      const results = {};
      result.rows.forEach(r => {
        results[r.match_id] = { homeScore: r.home_score, awayScore: r.away_score, penaltyWinner: r.penalty_winner };
      });
      return res.json(results);
    }

    if (!user.isAdmin) return res.status(403).json({ error: 'Только для администратора' });

    if (req.method === 'POST') {
      const { matchId, homeScore, awayScore, penaltyWinner } = req.body;
      if (matchId == null || homeScore == null || awayScore == null)
        return res.status(400).json({ error: 'Нужны matchId, homeScore, awayScore' });
      await pool.query(
        `INSERT INTO match_results (match_id, home_score, away_score, penalty_winner, updated_at)
         VALUES ($1,$2,$3,$4,NOW())
         ON CONFLICT (match_id) DO UPDATE SET home_score=$2, away_score=$3, penalty_winner=$4, updated_at=NOW()`,
        [matchId, homeScore, awayScore, penaltyWinner || null]
      );
      return res.json({ ok: true });
    }

    if (req.method === 'DELETE') {
      const matchId = req.url.split('/').pop();
      await pool.query('DELETE FROM match_results WHERE match_id = $1', [matchId]);
      return res.json({ ok: true });
    }

    res.status(405).end();
  } catch (e) {
    console.error(e);
    res.status(401).json({ error: e.message });
  }
};
