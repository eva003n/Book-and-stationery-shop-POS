// src/middleware/tenant.middleware.ts
import jwt from "jsonwebtoken";
import { dbClient } from "../infra/db/index.js"
import type { Request, Response, NextFunction } from "express";
import ApiError from "../shared/utils/ApiError.js";



export async function tenantMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const token = req.signedCookies.get("better-auth.session_data").value;
  if (!token) return next(ApiError.unauthorized(req.originalUrl, "No token", req.requestId));

  const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
    sub: string;
    schema_name: string;
    permissions: string[];
  };

  // Always validate against global registry — never trust raw JWT value
  const tenant = await dbClient.tenant.findUnique({
    where: { schemaName: payload.schema_name },
  });
  if (!tenant) return next(ApiError.forbidden(req.originalUrl, "Unknown tenant", req.requestId)));

  // Attach tenant-scoped Prisma client to the request
  req.tenant = { schemaName: tenant.schemaName, id: tenant.id };
  req.user = { id: payload.sub, permissions: payload.permissions };
  req.db = dbClient.getTenantClient(tenant.schemaName);

  next();
}
