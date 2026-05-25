const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getPool } = require('../_lib/db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: 'Заполните все поля'
    });
  }

  if (email.toLowerCase() === process.env.ADMIN_EMAIL) {

    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({
        error: 'Неверный email или пароль'
      });
    }

    const token = jwt.sign(
      {
        id: 'admin',
        email,
        isAdmin: true
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '30d'
      }
    );

    return res.json({
      token,
      user: {
        id: 'admin',
        name: 'Администратор',
        email,
        color: '#e05c1a',
        isAdmin: true
      }
    });
  }

  const pool = getPool();

  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email.toLowerCase()]
  );

  const user = result.rows[0];

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({
      error: 'Неверный email или пароль'
    });
  }

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      isAdmin: false
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '30d'
    }
  );

  return res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      color: user.color,
      isAdmin: false
    }
  });
};
