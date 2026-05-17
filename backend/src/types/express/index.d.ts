import { Request, Response } from "express";
import { dbClient } from "../../infra/db/index.js";

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      tenant?: { schemaName: string; id: string };
      user?: { id: string; permissions: string[] };
      db?: ReturnType<typeof dbClient.getTenantClient>;
      // [key: string]: string
    }
    interface Response {
      jsonApi<T>(status: number, data: T): this;
    }
  }
}
