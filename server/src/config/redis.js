const Redis = require('ioredis');

// Support both Redis URL format (for Upstash/Railway) and individual config
let redisConfig;

if (process.env.REDIS_URL) {
  // Use Redis URL if provided (Upstash, Railway, etc.)
  redisConfig = process.env.REDIS_URL;
} else {
  // Use individual config (Redis Cloud, local, etc.)
  redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  };
}

const redisClient = new Redis(redisConfig);

redisClient.on('connect', () => {
  console.log('Redis Connected');
});

redisClient.on('error', (err) => {
  console.error('Redis connection error:', err);
});

module.exports = redisClient;


