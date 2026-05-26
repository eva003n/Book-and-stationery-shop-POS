import Redis from "ioredis";
import { authRedisClient } from "./session.js";
import { cacheRedisClient } from "./cache.js";

export const redisClient = {
    auth: authRedisClient,
    cache: cacheRedisClient,
}

// graceful shutdown
export const shutDownRedis = async() => {
    await Promise.allSettled(Object.values(redisClient).map((client: Redis) => client.quit()))
}


