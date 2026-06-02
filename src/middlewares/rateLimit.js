const rateLimit = require('express-rate-limit');

const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
const max = Number(process.env.RATE_LIMIT_MAX_REQUESTS || 1000);

const authMax = Number(process.env.RATE_LIMIT_MAX_AUTH_REQUESTS || 3000);
const authMeMax = Number(process.env.RATE_LIMIT_MAX_AUTH_ME_REQUESTS || 20000);

const generalLimiter = rateLimit({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs,
  max: authMax,
  standardHeaders: true,
  legacyHeaders: false,
});

const authMeLimiter = rateLimit({
  windowMs,
  max: authMeMax,
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = (req, res, next) => {
  if (req.path.startsWith('/api/auth/')) {
    if (req.path === '/api/auth/me' && req.method === 'GET') {
      return authMeLimiter(req, res, next);
    }
    return authLimiter(req, res, next);
  }

  return generalLimiter(req, res, next);
};
