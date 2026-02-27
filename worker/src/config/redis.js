const { createClient } = require('redis');

let redisClient = null;

const connectRedis = async () => {
  try {
    const redisHost = process.env.REDIS_HOST || 'redis';
    const redisPort = process.env.REDIS_PORT || 6379;
    const redisURL = `redis://${redisHost}:${redisPort}`;

    redisClient = createClient({ url: redisURL });

    redisClient.on('error', (err) => console.error('Redis Client Error:', err));
    redisClient.on('connect', () => console.log('Worker connected to Redis'));

    await redisClient.connect();

    return redisClient;
  } catch (error) {
    console.error('Redis connection error:', error);
    throw error;
  }
};

const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }
  return redisClient;
};

const disconnectRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log('Redis disconnected');
  }
};

module.exports = { connectRedis, getRedisClient, disconnectRedis };
