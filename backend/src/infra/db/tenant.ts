import { DATABASE_URL } from "../../config/env.js";
import { PrismaClient } from "../../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";


const connectionString = DATABASE_URL;

const adapter = new PrismaPg({ connectionString });

export const clients = new Map<string, PrismaClient>()

export const getTenantClient = (schemaName: string ) => {
    // reuse client if it exists
    if(clients.has(schemaName)) {
        return clients.get(schemaName)

    }

    const client = new PrismaClient({adapter}).$extends({
        // intercept queries to enable multi-schema tenancy
      query: {
        $allOperations: async ({ args, query }) => {
          await client.$executeRawUnsafe(
            `SET search_path TO "${schemaName}", public`,
          );
          return query(args);
        },
      },
    }) as unknown as PrismaClient;

    // cache it for reuse(avoid creating a new one on every request)
    clients.set(schemaName, client)

    // return created client
    return client
}

