import mainPrismaClient from "./client.js";
import { clients, getTenantClient } from "./tenant.js";

export const dbClient = {
  main: mainPrismaClient,
  getTenantClient,
};

const destroyClients = async () => {
  await dbClient.main.$disconnect();
  const clientsMap = clients.values();
  await Promise.all(clientsMap.map((client) => client.$disconnect()));
  process.exit(0)
};

process.on("SIGINT", destroyClients)
process.on("SIGTERM", destroyClients)
