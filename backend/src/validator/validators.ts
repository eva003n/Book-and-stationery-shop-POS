import { z } from "zod";

// common(Frontend + Backend)

export const apiResponseSchema = z.object({
  success: z.boolean(),
  status: z.number(),
  data: z.any(),
  message: z.string().default("Success"),
  meta: z.object({
    requestId: z.string(),
  }),
});

const errorSchema = z.object<any>({});
const apiErrorSchema = z.object({
  type: z.string().min(1),
  title: z.string(),
  status: z.number().int().min(100).max(599),
  errors: z.array(errorSchema).optional(),
  detail: z.string().default("Something went wrong"),
  instance: z.string(),
  requestId: z.uuidv4().optional(),
});

export type ApiResponseObj = z.infer<typeof apiResponseSchema>;
export type ApiErrorObj = z.infer<typeof apiErrorSchema>;
export type EnvVarSchema = z.infer<typeof envVarSchema>;
// extract type for a member in zod object
export type MetaData = ApiResponseObj["meta"];

// backend only
const betterAuthSecretsSchema = z.array(
  z.object({
    version: z.number().positive(),
    value: z.string(),
  }),
);
export const envVarSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
BASE_URL: z.string().url(),
  PORT: z.coerce.number().int().positive(),
  APP_NAME: z.string().min(1),
  COOKIE_SECRET: z.string().min(1),
  CORS_ORIGIN_URLS: z.string().min(1),
  BETTER_AUTH_SECRETS: z.string().min(32),
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
  LOGTAIL_SOURCE_TOKEN: z.string().optional(),
  LOGTAIL_INGESTION_HOST: z.string().optional(),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  API_DOC_URI: z.string().url(),
});

export type BetterAuthSecrets = z.infer<typeof betterAuthSecretsSchema>;
