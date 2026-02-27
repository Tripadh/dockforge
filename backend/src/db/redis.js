const { createClient } = require('redis');

let redisClient = null;

const connectRedis = async () => {
  try {
    const redisURL = process.env.REDIS_URL || 'redis://redis:6379';
    
    redisClient = createClient({ url: redisURL });
    
    redisClient.on('error', (err) => console.error('Redis Client Error:', err));
    redisClient.on('connect', () => console.log('Redis connected successfully'));
    
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
    console.log('Redis disconnected');
  }
};

module.exports = { connectRedis, getRedisClient, disconnectRedis };
