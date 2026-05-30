import type { IncomingHttpHeaders } from "node:http";
import {
  createAuthOrganization,
  type CreateAuthOrganizationInput,
} from "../../auth/auth.module.js";

export type CreateOrganisationInput = CreateAuthOrganizationInput;

export const createOrganisation = async (
  orgData: CreateOrganisationInput,
  headers?: IncomingHttpHeaders,
) => {
  return createAuthOrganization(orgData, headers);
};
