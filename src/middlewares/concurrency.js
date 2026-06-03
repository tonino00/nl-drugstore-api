const DEFAULT_LIMIT = Number(process.env.CONCURRENCY_LIMIT || 64);
const QUEUE_LIMIT = Number(process.env.CONCURRENCY_QUEUE_LIMIT || 100);
const WAIT_TIMEOUT_MS = Number(process.env.CONCURRENCY_WAIT_TIMEOUT_MS || 300);

const EXCLUDE_SSE = String(process.env.EXCLUDE_SSE_FROM_CONCURRENCY || 'true').toLowerCase() === 'true';
const EXCLUDED_PATHS = new Set(EXCLUDE_SSE ? ['/api/notifications/stream'] : []);

function createConcurrencyMiddleware() {
  let current = 0;
  const queue = [];

  function release() {
    if (current > 0) current -= 1;
    while (queue.length) {
      const next = queue.shift();
      if (typeof next === 'function') {
        const started = next();
        if (started) {
          current += 1;
          return;
        }
      }
    }
  }

  return function concurrencyMiddleware(req, res, next) {
    try {
      if (EXCLUDED_PATHS.has(req.path)) return next();

      const tryAcquire = () => {
        if (current < DEFAULT_LIMIT) {
          current += 1;
          let released = false;
          const done = () => {
            if (!released) {
              released = true;
              release();
            }
          };
          res.on('finish', done);
          res.on('close', done);
          return next();
        }

        if (queue.length >= QUEUE_LIMIT) {
          res.setHeader('Retry-After', '1');
          return res.status(503).json({ error: 'Servidor ocupado, tente novamente em instantes' });
        }

        let timedOut = false;
        const tryStart = () => {
          if (timedOut) return false;
          if (res.writableEnded) return false;
          if (current >= DEFAULT_LIMIT) return false;

          clearTimeout(timer);
          current += 1;
          let released = false;
          const done = () => {
            if (!released) {
              released = true;
              release();
            }
          };
          res.on('finish', done);
          res.on('close', done);
          next();
          return true;
        };

        const timer = setTimeout(() => {
          timedOut = true;
          const idx = queue.indexOf(tryStart);
          if (idx !== -1) queue.splice(idx, 1);
          if (!res.headersSent) {
            res.setHeader('Retry-After', '1');
            res.status(503).json({ error: 'Servidor ocupado, tente novamente em instantes' });
          }
        }, WAIT_TIMEOUT_MS);

        req.on('aborted', () => {
          const idx = queue.indexOf(tryStart);
          if (idx !== -1) queue.splice(idx, 1);
          clearTimeout(timer);
        });

        queue.push(tryStart);
        return undefined;
      };

      return tryAcquire();
    } catch (err) {
      return next(err);
    }
  };
}

module.exports = createConcurrencyMiddleware();
