import { betterAuth, logger } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { organization } from "better-auth/plugins/organization";
import { createAccessControl } from "better-auth/plugins/access";
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
import { hash, compare } from "bcryptjs";
import  mailService  from "../mail/mail.module.js";

const origins = CORS_ORIGIN_URLS?.split(",");
const secrets = BETTER_AUTH_SECRETS?.split(",") || [];

const isProduction = NODE_ENV === "production";
const baseURL = `${!isProduction ? BASE_URL + ":" + PORT : BASE_URL}`;

// statement object for defining permissions per resource
const posAccessControl = createAccessControl({
  organization: ["read", "update", "delete"],
  member: ["read", "create", "update", "delete"],
  invitation: ["read", "create", "cancel"],
  inventory: ["read", "create", "update", "delete", "adjust"],
  sales: ["read", "create", "discount", "refund", "void"],
  customers: ["read", "create", "update", "delete"],
  suppliers: ["read", "create", "update", "delete"],
  payments: ["read", "create", "refund"],
  reports: ["read", "export"],
  settings: ["read", "update"],
  sync: ["read", "update"],
  etims: ["read", "submit", "retry"],
  cashDrawer: ["open", "close", "reconcile"],
} as const);

const posRoles = {
  owner: posAccessControl.newRole({
    organization: ["read", "update", "delete"],
    member: ["read", "create", "update", "delete"],
    invitation: ["read", "create", "cancel"],
    inventory: ["read", "create", "update", "delete", "adjust"],
    sales: ["read", "create", "discount", "refund", "void"],
    customers: ["read", "create", "update", "delete"],
    suppliers: ["read", "create", "update", "delete"],
    payments: ["read", "create", "refund"],
    reports: ["read", "export"],
    settings: ["read", "update"],
    sync: ["read", "update"],
    etims: ["read", "submit", "retry"],
    cashDrawer: ["open", "close", "reconcile"],
  }),
  manager: posAccessControl.newRole({
    organization: ["read", "update"],
    member: ["read", "create", "update"],
    invitation: ["read", "create", "cancel"],
    inventory: ["read", "create", "update", "adjust"],
    sales: ["read", "create", "discount", "refund", "void"],
    customers: ["read", "create", "update"],
    suppliers: ["read", "create", "update"],
    payments: ["read", "create", "refund"],
    reports: ["read", "export"],
    settings: ["read"],
    sync: ["read", "update"],
    etims: ["read", "submit", "retry"],
    cashDrawer: ["open", "close", "reconcile"],
  }),
  cashier: posAccessControl.newRole({
    inventory: ["read"],
    sales: ["read", "create", "discount"],
    customers: ["read", "create", "update"],
    payments: ["read", "create"],
    etims: ["read", "submit"],
    cashDrawer: ["open", "close"],
  }),
  inventoryClerk: posAccessControl.newRole({
    inventory: ["read", "create", "update", "adjust"],
    suppliers: ["read", "create", "update"],
    reports: ["read"],
  }),
  accountant: posAccessControl.newRole({
    sales: ["read", "refund"],
    payments: ["read", "refund"],
    reports: ["read", "export"],
    etims: ["read", "submit", "retry"],
    cashDrawer: ["reconcile"],
  }),
  viewer: posAccessControl.newRole({
    organization: ["read"],
    inventory: ["read"],
    sales: ["read"],
    customers: ["read"],
    suppliers: ["read"],
    payments: ["read"],
    reports: ["read"],
    etims: ["read"],
  }),
} as const;

type PosRole = keyof typeof posRoles;

const toPermissionList = (role: PosRole) =>
  Object.entries(posRoles[role].statements).flatMap(([resource, actions]) =>
    actions.map((action) => `${resource}:${action}`),
  );

const normalizeRole = (role?: string | null): PosRole =>
  role && role in posRoles ? (role as PosRole) : "cashier";

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
    sendVerificationEmail: async ({ user, url }: {user: any, url: any}) => {
      mailService.sendTransactionalEmail({
        to: user.email,
        subject: "Verify your email address",
        text: `Click the link to verify your email: ${url}`,
      });
    }},
    minPasswordLength: 8,
    maxPasswordLength: 72,
    autoSignIn: false,
    sendResetPassword: async ({ user, url, token }) => {
      await mailService.sendTransactionalEmail({
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
      ac: posAccessControl,
      roles: posRoles,
      creatorRole: "owner", // default
      membershipLimit: 50, // users
      invitationLimit: 25,
      requireEmailVerificationOnInvitation: true,
      allowUserToCreateOrganization: async (user) => {
        const role = normalizeRole(user.role ?? user.roleId);

        return role === "owner";
      },
      schema: {
        organization: {
          modelName: "Tenant",
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
              defaultValue: "starter",
            },
          },
        },
        session: {
          fields: {
            activeOrganizationId: "tenantId",
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
            tenant_id: user.tenantId ?? null,
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
        await mailService.sendTransactionalEmail({
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
        await mailService.sendTransactionalEmail({
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
