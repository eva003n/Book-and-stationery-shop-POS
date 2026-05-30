import type { IncomingHttpHeaders } from "http";
import { auth } from "../auth.config.js";
import { toWebHeaders } from "../auth.util.js";

export type CreateAuthOrganizationInput = {
  name: string;
  slug: string;
  userId?: string;
  logo?: string;
  metadata?: Record<string, unknown>;
  keepCurrentActiveOrganization?: boolean;
  email: string;
  kraPin: string;
  mpesaShortcode: number;
  consumerKey: string;
  consumerSecret: string;
  plan?: string;
};

export const createAuthOrganization = async (
  orgData: CreateAuthOrganizationInput,
  headers?: IncomingHttpHeaders,
) => {
  const body = {
    ...orgData,
    plan: orgData.plan ?? "Starter",
  };

  const data = await auth.api.createOrganization({
    body,
    ...(headers ? { headers: toWebHeaders(headers) } : {}),
  });

  return data;
};