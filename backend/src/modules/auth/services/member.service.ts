import type { IncomingHttpHeaders } from "http";
import  { auth } from "../auth.config.js";
import type { AuthMember } from "../auth.types.js";

export const createOrganizationMember = async (member: AuthMember) => {
  const data = await auth.api.addMember({
    body: {
      ...member,
    },
  });
  return data;
};

export const listOrganizationMembers = async (
  queryOptions: any,
  headers: IncomingHttpHeaders,
) => {
  const data = await auth.api.listMembers({
    query: {
      organizationId: "organization-id",
      limit: 100,
      offset: 0,
      sortBy: "createdAt",
      sortDirection: "desc",
      filterField: "createdAt",
      filterOperator: "eq",
      filterValue: "value",
    },
    // This endpoint requires session cookies.
    headers: headers,
  });
};

export const removeOrganizationMember = async (
  headers: IncomingHttpHeaders,
) => {
  const data = await auth.api.removeMember({
    body: {
      memberIdOrEmail: "user@example.com", // required
      organizationId: "org-id",
    },
    // This endpoint requires session cookies.
    headers: headers,
  });
};

export const modifyOrganizationMember = async (
  headers: IncomingHttpHeaders,
) => {
  await auth.api.updateMemberRole({
    body: {
      role: ["admin", "sale"], // required
      memberId: "member-id", // required
      organizationId: "organization-id",
    },
    // This endpoint requires session cookies.
    headers: headers,
  });
};

export const leaveOrganization = async (headers: IncomingHttpHeaders) => {
  await auth.api.leaveOrganization({
    body: {
      organizationId: "organization-id", // required
    },
    // This endpoint requires session cookies.
    headers: headers,
  });
};
