import { betterAuth, logger } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { organization } from "better-auth/plugins/organization";
import { jwt } from "better-auth/plugins/jwt";
import { dbClient } from "../../infra/db/index.js";
import {
  APP_NAME,
  BASE_URL,
  BETTER_AUTH_SECRETS,
  BETTER_AUTH_URL,
  CORS_ORIGIN_URLS,
  FACEBOOK_CLIENT_ID,
  FACEBOOK_CLIENT_SECRET,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  JWT_TOKEN_VERSION,
} from "../../config/env.js";
import type { BetterAuthSecrets } from "../../shared/validator/validators.js";
import { redisStorage } from "@better-auth/redis-storage";
import { redisClient } from "../../infra/redis/index.js";
import { sendTransactionalEmail } from "../mail/mail.service.js";
import { accessControl, normalizeRole, posRoles, toPermissionList } from "./auth.rbac.js";

const origins = CORS_ORIGIN_URLS?.split(",");
const secrets = BETTER_AUTH_SECRETS?.split(",") || [];

const baseUrl = BETTER_AUTH_URL;

const SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours
const SESSION_CACHE_MAX_AGE = 60 * 15; // 15 minutes

const getTenantClaims = async ({
  organizationId,
  branchId,
  userId,
}: {
  organizationId?: string | null;
  branchId?: string | null;
  userId: string;
}) => {
  if (!organizationId) {
    return {
      organizationId: null,
      schemaName: null,
      branchId: branchId ?? null,
      role: normalizeRole(),
    };
  }

  const [organizations, members] = await Promise.all([
    dbClient.main.$queryRaw<Array<{ id: string; schemaName: string }>>`
      SELECT id, schema_name AS "schemaName"
      FROM public.organizations
      WHERE id = ${organizationId}
      LIMIT 1
    `,
    dbClient.main.$queryRaw<Array<{ role: string | null }>>`
      SELECT role
      FROM public.members
      WHERE "organizationId" = ${organizationId}
        AND "userId" = ${userId}
      LIMIT 1
    `,
  ]);

  const organization = organizations[0];
  const member = members[0];

  return {
    organizationId: organization?.id ?? null,
    schemaName: organization?.schemaName ?? null,
    branchId: branchId ?? null,
    role: normalizeRole(member?.role),
  };
};

;

export const auth = betterAuth({
  database: prismaAdapter(dbClient.main, {
    provider: "postgresql",
  }),
  // baseURL: "http://localhost:8000",
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
    google: {
      clientId: GOOGLE_CLIENT_ID as string,
      clientSecret: GOOGLE_CLIENT_SECRET as string,
    },
    facebook: {
      clientId: FACEBOOK_CLIENT_ID as string,
      clientSecret: FACEBOOK_CLIENT_SECRET as string,
    },
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
      // teams: {
      //   enabled: true,
      //   maximumTeams: async ({ organizationId, session }, ctx) => {
      //     // Dynamic limit based on organization plan
      //     return 5;
      //   },

      //   allowRemovingAllTeams: false,
      // },
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
          modelName: "Member",
          // fields: {
          //   role: "roleId" //one role per membership per organization
          // }
        },
        // team: {
        //   modelName: "Branch",
        // },
        // teamMember: {
        //   modelName: "BranchMember",
        //   fields: {
        //     teamId: "branchId",
        //     userId: "memberId"
        //   },
        // },
        invitation: {
          modelName: "Invitation",
        },
      },
    }),

    jwt({
      jwt: {
        issuer: baseUrl,
        audience: APP_NAME,
        expirationTime: `${SESSION_MAX_AGE}s`, // 8h
        definePayload: async ({ user, session }) => {
          const tenant = await getTenantClaims({
            organizationId: session.activeOrganizationId ?? null,
            branchId: session.activeTeamId ?? null,
            userId: user.id,
          });

          return {
            sub: user.id,
            // email: user.email,
            // email_verified: user.emailVerified,
            // name: user.name,
            org_id: tenant.organizationId,
            tenant_id: tenant.organizationId,
            schema_name: tenant.schemaName,
            branch_id: tenant.branchId,
            role: tenant.role,
            permissions: toPermissionList(tenant.role),
            // session_id: session.id,
            // token_type: "access",
          };
        },
        getSubject: async ({ user }) => user.id,
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
    },
    additionalFields: {
      tenantId: {
        type: "string",
        required: false,
        input: false,
      },
      schemaName: {
        type: "string",
        required: false,
        input: false,
      },
    },
    expiresIn: SESSION_MAX_AGE, //8h
    updateAge: SESSION_CACHE_MAX_AGE - 1, // 15min - 1
    // disableSessionRefresh: true,
    cookieCache: {
      enabled: true,
      strategy: "jwe",
      maxAge: SESSION_CACHE_MAX_AGE,
      version: JWT_TOKEN_VERSION as string,
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
    modelName: "Verificat'ion",
    disableCleanup: false,
    storeIdentifier: "hashed",
  },

  logger: {
    level: "warn",
    log: logger.warn,
  },
});
