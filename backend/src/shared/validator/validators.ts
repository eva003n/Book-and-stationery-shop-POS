import { z } from "zod";

// common(Frontend + Backend)

export const apiResponseSchema = z.object({
  success: z.boolean().optional(),
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
export type ApiErrors = ApiErrorObj["errors"];

const authSchema = z.object({
  email: z.email(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(72, "Password cannot exceed 72 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/\d/, "Password must contain at least one number")
    .regex(
      /[!@#$%^&*(),.?":{}|<>]/,
      "Password must contain at least one special character",
    ),
});
export const signUpSchema = authSchema
  .extend({
    name: z.string().min(5).max(100),
    // confirmPassword: z.string(),
  })
  // .refine((data) => data.password !== data.confirmPassword, {
  //   message: "Passwords do not match",
  //   path: ["confirmPassword"], // Highlights the error directly on the confirm inpu
  // });

export const signInSchema = authSchema.extend({
  rememberMe: z.boolean().optional(),
  callbackURL: z.string().optional(),
});

export type SignUpAuth = z.infer<typeof signUpSchema>;
export type SignInAuth = z.infer<typeof signInSchema>;

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
  BETTER_AUTH_URL: z.string(),
  JWT_TOKEN_VERSION: z.string(),
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
  LOGTAIL_SOURCE_TOKEN: z.string().optional(),
  LOGTAIL_INGESTION_HOST: z.string().optional(),
  DATABASE_URL: z.url(),
  REDIS_URL: z.string().url(),
  API_DOC_URI: z.string().url(),
  RESEND_API_KEY: z.string().min(1),
  MAIL_FROM: z.string().min(1),
  MAIL_REPLY_TO: z.email().optional(),
  FACEBOOK_CLIENT_ID: z.string().optional(),
  FACEBOOK_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
});

export const mailAddressSchema = z.union([
  z.email(),
  z.array(z.email()),
]);

export const sendMailSchema = z.object({
  to: mailAddressSchema,
  subject: z.string().min(1),
  html: z.string().optional(),
  text: z.string().optional(),
  from: z.email().optional(),
  replyTo: z.email().optional(),
  cc: mailAddressSchema.optional(),
  bcc: mailAddressSchema.optional(),
  tags: z
    .array(
      z.object({
        name: z.string(),
        value: z.string(),
      })
    )
    .optional(),
});

export type MailAddress = z.infer<typeof mailAddressSchema>;
export type SendMailInput = z.infer<typeof sendMailSchema>;
export type BetterAuthSecrets = z.infer<typeof betterAuthSecretsSchema>;
