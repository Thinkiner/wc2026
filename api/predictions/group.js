const { getPool } = require('../_lib/db');
const { verifyToken } = require('../_lib/auth');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const user = verifyToken(req);
    const { matchId, homeScore, awayScore } = req.body;
    if (matchId == null || homeScore == null || awayScore == null)
      return res.status(400).json({ error: 'Нужны matchId, homeScore, awayScore' });

    const pool = getPool();
    await pool.query(
      `INSERT INTO predictions (user_id, match_id, home_score, away_score)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (user_id, match_id) DO UPDATE SET home_score=$3, away_score=$4`,
      [user.id, matchId, homeScore, awayScore]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(401).json({ error: e.message });
  }
};
