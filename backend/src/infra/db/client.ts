import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client.js";
import { DATABASE_URL, NODE_ENV } from "../../config/env.js";

const connectionString = DATABASE_URL;

const adapter = new PrismaPg({ connectionString });

const isProduction = NODE_ENV === "production";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter, log: ["error", "warn"] });

if (!isProduction) {
  // singleton patter for prisma client to prevent multiple prisma clients during development(hot reload)
  globalForPrisma.prisma = prisma;
}

export default prisma