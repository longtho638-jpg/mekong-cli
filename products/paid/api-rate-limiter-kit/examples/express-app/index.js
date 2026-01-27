const express = require('express');
const Redis = require('ioredis');

const app = express();
const port = 3001;

// Connect to Redis
const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
});

// Fixed Window Script (Lua) - Copied from the Python implementation for consistency
const FIXED_WINDOW_SCRIPT = `
local key = KEYS[1]
local window = tonumber(ARGV[1])
local limit = tonumber(ARGV[2])

local current = redis.call("INCR", key)

if current == 1 then
    redis.call("EXPIRE", key, window)
end

local ttl = redis.call("TTL", key)

if current > limit then
    return {0, current, ttl}
else
    return {1, current, ttl}
end
`;

// Middleware
const rateLimitMiddleware = async (req, res, next) => {
    // Hardcoded rule for demo: 5 reqs / 10 secs
    const limit = 5;
    const window = 10;
    // In Express, req.ip might need trust proxy setting behind load balancers
    const ip = req.ip || req.connection.remoteAddress;

    const key = `express:limiter:${req.method}:${req.path}:${ip}`;

    try {
        const result = await redis.eval(FIXED_WINDOW_SCRIPT, 1, key, window, limit);
        const [allowed, current, ttl] = result;

        const remaining = Math.max(0, limit - current);
        // Calculate reset time (Unix timestamp)
        const reset = Math.floor(Date.now() / 1000) + (ttl > 0 ? ttl : 0);

        res.set('X-RateLimit-Limit', limit);
        res.set('X-RateLimit-Remaining', remaining);
        res.set('X-RateLimit-Reset', reset);

        if (allowed === 0) {
            res.set('Retry-After', ttl);
            return res.status(429).json({
                error: 'Too Many Requests',
                metadata: { limit, remaining, reset, retry_after: ttl }
            });
        }

        next();
    } catch (err) {
        console.error("Redis error:", err);
        // Fail open or closed? Here we fail open (allow request) if Redis is down
        next();
    }
};

app.use(rateLimitMiddleware);

app.get('/', (req, res) => {
  res.send('Hello from Express Rate Limited App!');
});

app.listen(port, () => {
  console.log(`Express app listening at http://localhost:${port}`);
});
