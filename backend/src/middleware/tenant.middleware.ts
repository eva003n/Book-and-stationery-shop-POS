// src/middleware/tenant.middleware.ts
import jwt from "jsonwebtoken";
import { dbClient } from "../infra/db/index.js"
import type { Request, Response, NextFunction } from "express";

export interface TenantRequest extends Request {
  tenant?: { schemaName: string; id: string };
  user?: { id: string; permissions: string[] };
  db?: ReturnType<typeof dbClient.getTenantClient>;
}

export async function tenantMiddleware(
  req: TenantRequest,
  res: Response,
  next: NextFunction,
) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });

  const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
    sub: string;
    schema_name: string;
    permissions: string[];
  };

  // Always validate against global registry — never trust raw JWT value
  const tenant = await prisma.tenant.findUnique({
    where: { schemaName: payload.schema_name },
  });
  if (!tenant) return res.status(403).json({ error: "Unknown tenant" });

  // Attach tenant-scoped Prisma client to the request
  req.tenant = { schemaName: tenant.schemaName, id: tenant.id };
  req.user = { id: payload.sub, permissions: payload.permissions };
  req.db = getTenantClient(tenant.schemaName);

  next();
}
