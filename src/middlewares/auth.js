const jwt = require('jsonwebtoken');
const { User } = require('../models');

function extractToken(req) {
  // Prioridade: cookie httpOnly > Authorization header > query param
  const cookieToken = req.cookies?.token;
  if (cookieToken) return cookieToken;

  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) return auth.slice('Bearer '.length);
  if (req.query && req.query.token) return req.query.token;
  return null;
}

module.exports = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) return res.status(401).json({ error: 'Token ausente' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(decoded.id);
    if (!user || !user.active) return res.status(401).json({ error: 'Usuário inválido' });

    req.user = {
      id: user.id,
      role: user.role,
      email: user.email,
      nome: user.nome,
    };

    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};
