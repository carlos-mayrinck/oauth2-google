import redis from 'redis';

export const redisClient = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: Number(process.env.REDIS_PORT ?? 6379),
  }
});