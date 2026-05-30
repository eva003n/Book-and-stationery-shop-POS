import { betterAuth, logger } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { organization } from "better-auth/plugins/organization";
import { jwt } from "better-auth/plugins/jwt";
import { dbClient } from "../../infra/db/index.js";
import {
  APP_NAME,
  BASE_URL,
  BETTER_AUTH_SECRETS,
  CORS_ORIGIN_URLS,
  NODE_ENV,
  PORT,
} from "../../config/env.js";
import type { BetterAuthSecrets } from "../../shared/validator/validators.js";
import { redisStorage } from "@better-auth/redis-storage";
import { redisClient } from "../../infra/redis/index.js";
import { sendTransactionalEmail } from "../mail/mail.service.js";
import { accessControl, normalizeRole, posRoles, toPermissionList } from "./auth.rbac.js";

const origins = CORS_ORIGIN_URLS?.split(",");
const secrets = BETTER_AUTH_SECRETS?.split(",") || [];

const isProduction = NODE_ENV === "production";
const baseURL = BASE_URL;




export const auth = betterAuth({
  database: prismaAdapter(dbClient.main, {
    provider: "postgresql",
  }),
  baseURL,
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
    emailVerification: {
      sendVerificationEmail: async ({ user, url }: { user: any; url: any }) => {
        sendTransactionalEmail({
          to: user.email,
          subject: "Verify your email address",
          text: `Click the link to verify your email: ${url}`,
        });
      },
    },
    minPasswordLength: 8,
    maxPasswordLength: 72,
    autoSignIn: false,
    sendResetPassword: async ({ user, url, token }) => {
      sendTransactionalEmail({
        to: user.email,
        subject: "Reset your Bookstore POS password",
        html: `<p>Hello ${user.name},</p><p>Use this link to reset your password:</p><p><a href="${url}">Reset password</a></p><p>This link expires in 15 minutes.</p>`,
        text: `Hello ${user.name},\n\nUse this link to reset your password: ${url}\n\nThis link expires in 15 minutes.`,
        tags: [{ name: "type", value: "password-reset" }],
      });
    },
    resetPasswordTokenExpiresIn: 900, // 15 min
    revokeSessionsOnPasswordReset: true,
  },
  socialProviders: {
    /* google: {

    },
    facebook: {

    } */
  },

  plugins: [
    organization({
      ac: accessControl,
      roles: posRoles,
      membershipLimit: 50, // users
      invitationLimit: 25,
      requireEmailVerificationOnInvitation: true,
      allowUserToCreateOrganization: async (user) => {
        const role = normalizeRole(user.role ?? user.roleId);

        return role === "owner";
      },
      // this will represent branches for multi-branch stores
      teams: {
        enabled: true,
        maximumTeams: async ({ organizationId, session }, ctx) => {
          // Dynamic limit based on organization plan
          return 5;
        },

        allowRemovingAllTeams: false,
      },
      schema: {
        organization: {
          modelName: "Organization",
          fields: {
            slug: "schemaName", // map slug field to schemaName field
          },
          additionalFields: {
            email: {
              type: "string",
              required: true,
            },
            kraPin: {
              type: "string",
              required: true,
            },
            mpesaShortcode: {
              type: "number",
              required: true,
            },
            consumerKey: {
              type: "string",
              required: true,
              input: false,
              returned: false,
            },
            consumerSecret: {
              type: "string",
              required: true,
              input: false,
              returned: false,
            },
            plan: {
              type: "string",
              defaultValue: "Starter",
            },

          },
        },
        member: {
          modelName: "members"
        },
        team: {
          modelName: "branches",
        },
        teamMember: {
          modelName: "branchMembers",
          fields: {
            teamId: "branchId"
          }

        },
        invitation: {
          modelName: "invitations",
          fields: {
            teamId: "branchId",
          },
        },
     
      },
    }),

 
    jwt({
      jwt: {
        issuer: baseURL,
        audience: APP_NAME,
        expirationTime: "8h",
        // customize whats added to the jwt payload
        definePayload: async ({ user, session }) => {
          const tenantId =
            session.activeOrganizationId ?? session.tenantId ?? user.tenantId;

          const role = normalizeRole(session?.role ?? user.role ?? user.roleId);

          return {
            sub: user.id,
            org_id: user.tenantId ?? null,
            schema_name: session?.schemaName ?? null,
            role,
            permissions: toPermissionList(role),
            email: user.email,
            name: user.name,
          };
        },
      },
    }),
  ],
  user: {
    modelName: "User",
    additionalFields: {
      metadata: {
        type: "json",
        required: false,
      },
    },
    changeEmail: {
      enabled: true,
      sendChangeEmailConfirmation: async ({ user, newEmail, url, token }) => {
        sendTransactionalEmail({
          to: user.email,
          subject: "Confirm your Bookstore POS email change",
          html: `<p>Hello ${user.name},</p><p>Confirm changing your email address to ${newEmail}:</p><p><a href="${url}">Confirm email change</a></p>`,
          text: `Hello ${user.name},\n\nConfirm changing your email address to ${newEmail}: ${url}`,
          tags: [{ name: "type", value: "email-change" }],
        });
      },
      updateEmailWithoutVerification: false, // Update email without verification if user is not verified
    },
    deleteUser: {
      enabled: true,
      sendDeleteAccountVerification: async ({ user, url, token }) => {
        await sendTransactionalEmail({
          to: user.email,
          subject: "Confirm Bookstore POS account deletion",
          html: `<p>Hello ${user.name},</p><p>Confirm account deletion using this link:</p><p><a href="${url}">Delete account</a></p>`,
          text: `Hello ${user.name},\n\nConfirm account deletion using this link: ${url}`,
          tags: [{ name: "type", value: "account-delete" }],
        });
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
    modelName: "Session",
    fields: {
      userId: "userId",
      tenantId: "tenantId",
    },
    additionalFields: {
      tenantId: {
        type: "string",
        required: false,
        input: false,
        // returned: false,
      },
      role: {
        type: "string",
        required: false,
      },
      schemaName: {
        type: "string",
        required: false,
      },
    },
    expiresIn: 60 * 60 * 8, // 8 hours operation/day
    updateAge: 60 * 60, // 1 hour
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 mins
    },
  },

  account: {
    storeStateStrategy: "cookie",
    storeAccountCookie: true,
    modelName: "Account",
    fields: {
      userId: "userId",
    },
    encryptOAuthTokens: true,
    accountLinking: {
      enabled: true,
      trustedProviders: async () => ["google", "facebook", "email-password"],
      allowDifferentEmails: false,
    },
  },

  verification: {
    modelName: "Verification",
    disableCleanup: false,
    storeIdentifier: "hashed",
  },

  logger: {
    level: "warn",
    log: logger.warn,
  },
});
