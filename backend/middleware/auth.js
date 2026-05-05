// backend/middleware/auth.js
// Проверяет JWT-токен в заголовке Authorization

const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const header = req.headers['authorization'];
  // Ожидаем: "Bearer <token>"
  const token = header && header.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Нет токена — войдите в систему' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, isAdmin }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Токен недействителен или истёк' });
  }
}

function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Доступ только для администратора' });
    }
    next();
  });
}

module.exports = { requireAuth, requireAdmin };
