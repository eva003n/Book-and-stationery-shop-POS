import Redis from "ioredis";
import { authRedisClient } from "./session.js";
import { cacheRedisClient } from "./cache.js";
import { createQueuesClient } from "./bullmq.js";

export const redisClient = {
  auth: authRedisClient,
  cache: cacheRedisClient,
  messageQueue: createQueuesClient,
};

// graceful shutdown
export const shutDownRedis = async() => {
    await Promise.allSettled(Object.values(redisClient)
    .filter(client => client instanceof Redis)
    .map((client: Redis) => client.quit()))
}


