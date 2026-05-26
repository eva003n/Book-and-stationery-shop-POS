import { APP_NAME } from "../../config/env.js";
import { createRedisClient } from "../../config/redis.js";

const connectionName = `${APP_NAME}-auth`

export const authRedisClient = createRedisClient(connectionName)
