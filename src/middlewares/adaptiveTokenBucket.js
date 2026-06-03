const { monitorEventLoopDelay } = require('perf_hooks');

class AdaptiveTokenBucket {
  constructor() {
    this.tokens = Number(process.env.ATB_TOKENS || 100);
    this.maxTokensFree = Number(process.env.ATB_MAX_TOKENS_FREE || 200);
    this.maxTokensMed = Number(process.env.ATB_MAX_TOKENS_MED || 100);
    this.maxTokensHigh = Number(process.env.ATB_MAX_TOKENS_HIGH || 50);
    this.maxTokens = this.maxTokensFree;
    this.refillRate = Number(process.env.ATB_REFILL_RATE || 10);
    this.lastRefill = Date.now();
    this.serverLoad = 0;
  }

  refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    const newTokens = elapsed * this.refillRate;
    this.tokens = Math.min(this.maxTokens, this.tokens + newTokens);
    this.lastRefill = now;
  }

  updateServerLoad(eventLoopDelayMs, memoryUsageRatio) {
    const eldRef = Number(process.env.ATB_ELD_REF_MS || 50);
    const memRef = Number(process.env.ATB_MEM_REF || 0.8);
    const load = (eventLoopDelayMs / eldRef) * 0.7 + (memoryUsageRatio / memRef) * 0.3;
    this.serverLoad = Math.min(100, Math.max(0, load * 100));
    if (this.serverLoad > 80) {
      this.maxTokens = this.maxTokensHigh;
    } else if (this.serverLoad > 50) {
      this.maxTokens = this.maxTokensMed;
    } else {
      this.maxTokens = this.maxTokensFree;
    }
    if (this.tokens > this.maxTokens) this.tokens = this.maxTokens;
  }

  consume(amount = 1) {
    this.refill();
    if (this.tokens >= amount) {
      this.tokens -= amount;
      return true;
    }
    return false;
  }
}

const histogram = monitorEventLoopDelay({ resolution: 20 });
histogram.enable();

const bucket = new AdaptiveTokenBucket();

const updateInterval = Number(process.env.ATB_UPDATE_INTERVAL_MS || 1000);
setInterval(() => {
  const meanNs = histogram.mean || 0;
  const eventLoopDelayMs = meanNs / 1e6;
  histogram.reset();
  const mu = process.memoryUsage();
  const memRatio = mu.heapTotal ? mu.heapUsed / mu.heapTotal : 0;
  bucket.updateServerLoad(eventLoopDelayMs, memRatio);
}, updateInterval).unref?.();

const EXCLUDED_PATHS = new Set(['/api/notifications/stream', '/health']);

module.exports = function adaptiveTokenBucket(req, res, next) {
  if (EXCLUDED_PATHS.has(req.path)) return next();
  const writeCost = Number(process.env.ATB_COST_WRITE || 1);
  const readCost = Number(process.env.ATB_COST_READ || 1);
  const method = req.method || 'GET';
  const amount = method === 'GET' || method === 'HEAD' ? readCost : writeCost;
  const ok = bucket.consume(amount);
  if (ok) {
    if (String(process.env.ATB_DEBUG_HEADERS || 'false').toLowerCase() === 'true') {
      res.setHeader('X-ATB-Tokens', bucket.tokens.toFixed(2));
      res.setHeader('X-ATB-Max', String(bucket.maxTokens));
      res.setHeader('X-ATB-Load', bucket.serverLoad.toFixed(1));
    }
    return next();
  }
  const retry = String(process.env.ATB_RETRY_AFTER || '1');
  const status = Number(process.env.ATB_REJECT_STATUS || 503);
  res.setHeader('Retry-After', retry);
  return res.status(status).json({ error: 'Servidor ocupado, tente novamente em instantes' });
};
