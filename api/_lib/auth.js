const jwt = require('jsonwebtoken');

function verifyToken(req) {
  const header = req.headers['authorization'] || '';
  const token = header.replace('Bearer ', '').trim();
  if (!token) throw new Error('Нет токена');
  return jwt.verify(token, process.env.JWT_SECRET);
}
module.exports = { verifyToken };
