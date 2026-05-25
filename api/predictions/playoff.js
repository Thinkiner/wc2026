const { getPool } = require('../_lib/db');
const { verifyToken } = require('../_lib/auth');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const user = verifyToken(req);
    const { roundId, slotIdx, homeScore, awayScore } = req.body;
    if (!roundId || slotIdx == null || homeScore == null || awayScore == null)
      return res.status(400).json({ error: 'Нужны roundId, slotIdx, homeScore, awayScore' });

    const pool = getPool();
    await pool.query(
      `INSERT INTO playoff_predictions (user_id, round_id, slot_idx, home_score, away_score)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (user_id, round_id, slot_idx) DO UPDATE SET home_score=$4, away_score=$5`,
      [user.id, roundId, slotIdx, homeScore, awayScore]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(401).json({ error: e.message });
  }
};
