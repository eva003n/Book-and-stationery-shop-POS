import { betterAuth, logger } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { dbClient } from "../../infra/db/index.js";
import {
  APP_NAME,
  BASE_URL,
  BETTER_AUTH_SECRETS,
  CORS_ORIGIN_URLS,
  NODE_ENV,
  PORT,
} from "../../config/env.js";
import type { BetterAuthSecrets } from "../../validator/validators.js";
import { redisStorage } from "@better-auth/redis-storage";
import  {redisClient}  from "../../infra/redis/index.js";
import { hash, compare } from "bcryptjs";
const origins = CORS_ORIGIN_URLS?.split(",");
const secrets = BETTER_AUTH_SECRETS?.split(",") || [];

const isProduction = NODE_ENV === "production";

export const auth = betterAuth({
  database: prismaAdapter(dbClient, {
    provider: "postgresql",
  }),
  baseURL: `${!isProduction ? BASE_URL + ":" + PORT : BASE_URL}`,
  basePath: "/api/v1/auth",
  appName: APP_NAME,
  trustedOrigins: origins,
  secrets: secrets.map((secret) => ({
    version: secret.split(":")[0],
    value: secret.split(":")[1],
  })) as unknown as BetterAuthSecrets,
  secondaryStorage: redisStorage({
    client: redisClient.auth,
    keyPrefix: `${APP_NAME}:auth:`,
  }),

  emailAndPassword: {
    enabled: true,
    disableSignUp: false,
    requireEmailVerification: true,
    minPasswordLength: 8,
    maxPasswordLength: 72,
    autoSignIn: true,
    sendResetPassword: async ({ user, url, token }) => {
      // Send reset password email
    },
    resetPasswordTokenExpiresIn: 900, // 15 min
    revokeSessionsOnPasswordReset: true,
    password: {
      hash: async (password) => await hash(password, 12),
      verify: async ({ hash, password }) => await compare(hash, password),
    },
  },
  socialProviders: {
    /* google: {

    },
    facebook: {

    } */
  },

  user: {
    modelName: "users",
    fields: {
      email: "emailAddress",
      name: "fullName",
    },
    additionalFields: {
      is_active: {
        type: "boolean",
        defaultValue: true,
      },
      metadata: {
        type: "json",
      },
    },
    changeEmail: {
      enabled: true,
      sendChangeEmailConfirmation: async ({ user, newEmail, url, token }) => {
        // Send change email confirmation to the old email
      },
      updateEmailWithoutVerification: false, // Update email without verification if user is not verified
    },
    deleteUser: {
      enabled: true,
      sendDeleteAccountVerification: async ({ user, url, token }) => {
        // Send delete account verification
      },
      beforeDelete: async (user) => {
        // Perform actions before user deletion
      },
      afterDelete: async (user) => {
        // Perform cleanup after user deletion
      },
    },
  },

  session: {
    modelName: "sessions",
    fields: {
      userId: "user_id",
    },
    expiresIn: 604800, // 7 days
    updateAge: 900, // 15 minutes
    cookieCache: {
      enabled: true,
      maxAge: 900,
    },
  },

  account: {
    modelName: "accounts",
    fields: {
      userId: "user_id",
    },
    encryptOAuthTokens: true,
    storeAccountCookie: true,
    accountLinking: {
      enabled: true,
      trustedProviders: async () => ["google", "facebook", "email-password"],
      allowDifferentEmails: false,
    },
  },

  verification: {
    modelName: "verifications",
    disableCleanup: false,
    storeIdentifier: "hashed",
  },


  logger: {
    level: "warn",
    log: logger.warn
  }
});
