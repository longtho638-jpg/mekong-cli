import { createClient } from 'redis';
import Logger from '../utils/logger';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redisClient = createClient({
  url: redisUrl,
});

redisClient.on('error', (err) => Logger.error('Redis Client Error', err));
redisClient.on('connect', () => Logger.info('Redis Client Connected'));

// Don't connect immediately at module level to avoid issues in tests
// Connection will be handled in server startup

export default redisClient;
