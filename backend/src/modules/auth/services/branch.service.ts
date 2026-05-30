import type { IncomingHttpHeaders } from "node:http";
import { auth } from "../auth.config.js";

const toWebHeaders = (headers: IncomingHttpHeaders) => {
  const webHeaders = new Headers();

  for (const [key, value] of Object.entries(headers || {})) {
    if (!value) continue;

    webHeaders.set(
      key,
      Array.isArray(value) ? value.join(", ") : String(value),
    );
  }

  return webHeaders;
};

export const createBranch = async (opts: {
  name: string;
  organizationId: string;
}) => {
  const data = await auth.api.createTeam({
    body: {
      name: opts.name,
      organizationId: opts.organizationId,
    },
  });

  return data;
};

export const listBranches = async (
  headers: IncomingHttpHeaders,
  organizationId?: string,
) => {
  const data = await auth.api.listOrganizationTeams({
    query: {
      organizationId: organizationId ?? "organization-id",
    },
    // This endpoint requires session cookies.
    headers: toWebHeaders(headers),
  });

  return data;
};

export const getBranchById = async (
  id: string,
  headers: IncomingHttpHeaders,
  organizationId?: string,
) => {
  const list = await listBranches(headers, organizationId);

  if (!list || (!Array.isArray((list as any).items) && !Array.isArray(list))) {
    // attempt to handle different shapes
    const items = (list as any).items ?? list;
    return (items as any[]).find((t) => t.id === id) ?? null;
  }

  const items = (list as any).items ?? list;
  return (items as any[]).find((t) => t.id === id) ?? null;
};

export const findBranchByName = async (
  name: string,
  headers: IncomingHttpHeaders,
  organizationId?: string,
) => {
  const list = await listBranches(headers, organizationId);
  const items = (list as any).items ?? list;
  return (items as any[]).find((t) => t.name === name) ?? null;
};

export const updateBranch = async (
  teamId: string,
  data: Partial<{ name: string; organizationId: string }>,
  headers?: IncomingHttpHeaders,
) => {
  const res = await auth.api.updateTeam({
    teamId,
    data: {
      ...data,
    },
    ...(headers ? { headers: toWebHeaders(headers) } : {}),
  });

  return res;
};

export const removeBranch = async (
  teamId: string,
  headers?: IncomingHttpHeaders,
  organizationId?: string,
) => {
  const res = await auth.api.removeTeam({
    body: {
      teamId,
      organizationId: organizationId ?? undefined,
    },
    ...(headers ? { headers: toWebHeaders(headers) } : {}),
  });

  return res;
};

export const setActiveBranch = async (
  teamId: string | null,
  headers: IncomingHttpHeaders,
) => {
  const res = await auth.api.setActiveTeam({
    body: {
      teamId,
    },
    headers: toWebHeaders(headers),
  });

  return res;
};

export const listBranchMembers = async (
  teamId: string,
  headers: IncomingHttpHeaders,
) => {
  const res = await auth.api.listTeamMembers({
    query: {
      teamId,
    },
    headers: toWebHeaders(headers),
  });

  return res;
};

export const addBranchMember = async (
  teamId: string,
  userId: string,
  headers?: IncomingHttpHeaders,
) => {
  const res = await auth.api.addTeamMember({
    body: {
      teamId,
      userId,
    },
    ...(headers ? { headers: toWebHeaders(headers) } : {}),
  });

  return res;
};

export const removeBranchMember = async (
  teamId: string,
  userId: string,
  headers?: IncomingHttpHeaders,
) => {
  const res = await auth.api.removeTeamMember({
    body: {
      teamId,
      userId,
    },
    ...(headers ? { headers: toWebHeaders(headers) } : {}),
  });

  return res;
};
