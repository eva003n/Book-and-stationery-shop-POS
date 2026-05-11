import { Redis, type RedisOptions } from "ioredis";
import { APP_NAME, NODE_ENV, REDIS_URL } from "./env.js";
import { logger } from "better-auth";

const isProduction = NODE_ENV === "production"

 const redisConfig: RedisOptions =  {
  maxRetriesPerRequest: null, // due to queues
  lazyConnect: true, // only connect when a command is sent
  enableReadyCheck: true, // wait until data is loaded from disk before being ready

  retryStrategy(times) {
    const delay = Math.min(times * 100, 3000);

    return delay;
  },

  reconnectOnError(err) {
    const targetErrors = ["READONLY", "ETIMEDOUT"];

    if (targetErrors.some((e) => err.message.includes(e))) {
      return true;
    }

    return false;
  },

  ...(isProduction
    ? {
        tls: {},
      }
    : {}),

  connectionName: `${APP_NAME}-${process.pid}`,
  keepAlive: 30000,
  enableOfflineQueue: true,
};

// factory function to generate redis clients per workload
export function createRedisClient(name: string) {
  const client = new Redis(REDIS_URL as string, {
    ...redisConfig,
    connectionName: name,
  });

  client.on("connect", () => {
    logger.info(`[Redis:${name}] connecting...`);
  });

  client.on("ready", () => {
    logger.info(`[Redis:${name}] ready`);
  });

  client.on("error", (err) => {
    logger.error(`[Redis:${name}] error`, err);
  });

  client.on("close", () => {
    logger.warn(`[Redis:${name}] connection closed`);
  });

  client.on("reconnecting", () => {
    logger.warn(`[Redis:${name}] reconnecting`);
  });

  return client;
}