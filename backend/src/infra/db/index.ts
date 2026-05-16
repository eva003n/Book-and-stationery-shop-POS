import mainPrismaClient from "./client.js"
import { getTenantClient } from "./tenant.js";

export const dbClient ={
    main: mainPrismaClient,
    getTenantClient
};
