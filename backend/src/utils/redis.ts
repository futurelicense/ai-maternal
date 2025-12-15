import Redis from 'ioredis';
import { env } from '../config/env.js';
import { logger } from './logger.js';

const redisConfig = {
  host: env.REDIS_HOST,
  port: parseInt(env.REDIS_PORT),
  password: env.REDIS_PASSWORD || undefined,
  retryStrategy: (times: number) => {
    // Stop retrying after 3 attempts
    if (times > 3) {
      return null; // Stop retrying
    }
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  lazyConnect: true, // Don't connect immediately
  enableOfflineQueue: false, // Don't queue commands when offline
};

export const redis = new Redis(redisConfig);

let redisAvailable = false;

redis.on('connect', () => {
  redisAvailable = true;
  logger.info('Redis connected successfully');
});

redis.on('error', (error: any) => {
  redisAvailable = false;
  // Only log error if it's not a connection refused (Redis not running)
  if (error.code !== 'ECONNREFUSED') {
    logger.error({ error }, 'Redis connection error');
  }
});

redis.on('close', () => {
  redisAvailable = false;
  logger.warn('Redis connection closed - caching disabled');
});

// Try to connect, but don't fail if it doesn't
redis.connect().catch(() => {
  logger.warn('Redis not available - running without cache. Install Redis for better performance.');
});

// Cache helper functions
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    if (!redisAvailable) return null;
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      // Silently fail if Redis is not available
      return null;
    }
  },

  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    if (!redisAvailable) return;
    try {
      await redis.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      // Silently fail if Redis is not available
    }
  },

  async del(key: string): Promise<void> {
    if (!redisAvailable) return;
    try {
      await redis.del(key);
    } catch (error) {
      // Silently fail if Redis is not available
    }
  },

  async delPattern(pattern: string): Promise<void> {
    if (!redisAvailable) return;
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      // Silently fail if Redis is not available
    }
  },
};

// Cache key generators
export const cacheKeys = {
  patients: {
    maternal: (page: number, limit: number, filters?: any) => 
      `patients:maternal:${page}:${limit}:${JSON.stringify(filters || {})}`,
    pediatric: (page: number, limit: number, filters?: any) => 
      `patients:pediatric:${page}:${limit}:${JSON.stringify(filters || {})}`,
    byId: (type: 'maternal' | 'pediatric', id: string) => 
      `patients:${type}:${id}`,
  },
  dashboard: () => 'dashboard:stats',
  insights: () => 'analytics:insights',
  trends: () => 'analytics:trends',
};
