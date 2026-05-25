const { getPool } = require('../_lib/db');
const { verifyToken } = require('../_lib/auth');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).end();

  try {
    verifyToken(req);
    const pool = getPool();
    const [groupRes, poRes] = await Promise.all([
      pool.query(`SELECT p.user_id, u.name, u.color, p.match_id, p.home_score, p.away_score
                  FROM predictions p JOIN users u ON u.id = p.user_id ORDER BY p.user_id, p.match_id`),
      pool.query(`SELECT p.user_id, p.round_id, p.slot_idx, p.home_score, p.away_score
                  FROM playoff_predictions p`),
    ]);
    const byUser = {};
    groupRes.rows.forEach(r => {
      if (!byUser[r.user_id]) byUser[r.user_id] = { name: r.name, color: r.color, group: {}, playoff: {} };
      byUser[r.user_id].group[r.match_id] = { h: r.home_score, a: r.away_score };
    });
    poRes.rows.forEach(r => {
      if (!byUser[r.user_id]) byUser[r.user_id] = { name: '?', color: '#aaa', group: {}, playoff: {} };
      byUser[r.user_id].playoff[`${r.round_id}_${r.slot_idx}`] = { h: r.home_score, a: r.away_score };
    });
    res.json(byUser);
  } catch (e) {
    res.status(401).json({ error: e.message });
  }
};
