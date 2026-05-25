const { getPool } = require('../_lib/db');
const { verifyToken } = require('../_lib/auth');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const user = verifyToken(req);
    if (!user.isAdmin) return res.status(403).json({ error: 'Только для администратора' });

    const pool = getPool();

    if (req.method === 'GET') {
      const result = await pool.query(
        'SELECT id, name, email, color, created_at FROM users ORDER BY created_at'
      );
      return res.json(result.rows);
    }

    if (req.method === 'DELETE') {
      const userId = req.url.split('/').pop();
      await pool.query('DELETE FROM users WHERE id = $1', [userId]);
      return res.json({ ok: true });
    }

    res.status(405).end();
  } catch (e) {
    res.status(401).json({ error: e.message });
  }
};
