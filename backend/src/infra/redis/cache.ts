import { APP_NAME } from "../../config/env.js";
import { createRedisClient } from "../../config/redis.js";

const connectopnName = `${APP_NAME}-cache`

export const cacheRedisClient = createRedisClient(connectopnName)
