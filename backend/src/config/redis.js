import { createClient } from "redis";

const redisHost = process.env.REDIS_HOST || "redis";
const redisPort = process.env.REDIS_PORT || 6379;

const redisClient = createClient({
  url: `redis://${redisHost}:${redisPort}`
});

redisClient.on("error", (err) => {
  console.error("Redis Error:", err);
});

await redisClient.connect();

export default redisClient;