import { getAbsolutePath } from "../shared/utils";
import { envVarSchema } from "../shared/validator/validators";

const env = process.env.NODE_ENV || "development";

if (env === "development" || env === "test") {
  const { config } = await import("dotenv");

  config({
    path: getAbsolutePath(import.meta.url, "../../.env"),
  });

  config({
    path: getAbsolutePath(
      import.meta.url,
      `../../.env.${process.env.NODE_ENV}`,
    ),
  });
}

const result = envVarSchema.safeParse(process.env);
export const {
  NODE_ENV,
  BASE_URL,
  PORT,
  APP_NAME,
  COOKIE_SECRET,
  CORS_ORIGIN_URLS,
  BETTER_AUTH_SECRETS,
  LOG_LEVEL,
  LOGTAIL_SOURCE_TOKEN,
  LOGTAIL_INGESTION_HOST,
  DATABASE_URL,
  REDIS_URL,

  API_DOC_URI,
} = result.success ? result.data : {};

if (result.error) throw Error(`Missing env variables  ${result.error.message}`);
