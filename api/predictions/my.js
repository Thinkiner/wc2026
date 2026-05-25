const { getPool } = require('../_lib/db');
const { verifyToken } = require('../_lib/auth');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).end();

  try {
    const user = verifyToken(req);
    if (user.isAdmin) return res.json({ group: {}, playoff: {} });

    const pool = getPool();
    const [groupRes, poRes] = await Promise.all([
      pool.query('SELECT match_id, home_score, away_score FROM predictions WHERE user_id = $1', [user.id]),
      pool.query('SELECT round_id, slot_idx, home_score, away_score FROM playoff_predictions WHERE user_id = $1', [user.id]),
    ]);

    const group = {};
    groupRes.rows.forEach(r => { group[r.match_id] = { h: r.home_score, a: r.away_score }; });
    const playoff = {};
    poRes.rows.forEach(r => { playoff[`${r.round_id}_${r.slot_idx}`] = { h: r.home_score, a: r.away_score }; });

    res.json({ group, playoff });
  } catch (e) {
    res.status(401).json({ error: e.message });
  }
};
