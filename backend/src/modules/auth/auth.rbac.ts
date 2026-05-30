import { createAccessControl } from "better-auth/plugins/access";

// statement object for defining permissions per resource
export const accessControl = createAccessControl({
  organization: ["read", "update", "delete", "create"],
  member: ["read", "update", "delete", "create"],
  team: ["read", "create", "update", "delete"],
  invitation: ["read", "create", "cancel"],
  inventory: ["read", "create", "update", "delete", "adjust"],
  sales: ["read", "create", "discount", "refund", "void"],
  customers: ["read", "create", "update", "delete"],
  suppliers: ["read", "create", "update", "delete"],
  payments: ["read", "create", "refund"],
  reports: ["read", "export"],
  settings: ["read", "update"],
  sync: ["read", "update"],
  etims: ["read", "submit", "retry"],
  cashDrawer: ["open", "close", "reconcile"],
} as const);

export const posRoles = {
  owner: accessControl.newRole({
    organization: ["read", "update", "delete", "create"],
    member: ["read", "create", "update", "delete"],
    team: ["read", "create", "update", "delete"], // branch
    invitation: ["read", "create", "cancel"],
    inventory: ["read", "create", "update", "delete", "adjust"],
    sales: ["read", "create", "discount", "refund", "void"],
    customers: ["read", "create", "update", "delete"],
    suppliers: ["read", "create", "update", "delete"],
    payments: ["read", "create", "refund"],
    reports: ["read", "export"],
    settings: ["read", "update"],
    sync: ["read", "update"],
    etims: ["read", "submit", "retry"],
    cashDrawer: ["open", "close", "reconcile"],
  }),
  admin: accessControl.newRole({
    organization: ["read"],
    member: ["read", "create", "update"],
    team: ["read", "create", "update", "delete"],
    invitation: ["read", "create", "cancel"],
    inventory: ["read", "create", "update", "adjust"],
    sales: ["read", "create", "discount", "refund", "void"],
    customers: ["read", "create", "update"],
    suppliers: ["read", "create", "update"],
    payments: ["read", "create", "refund"],
    reports: ["read", "export"],
    settings: ["read"],
    sync: ["read", "update"],
    etims: ["read", "submit", "retry"],
    cashDrawer: ["open", "close", "reconcile"],
  }),
  manager: accessControl.newRole({
    organization: ["read"],
    member: ["read", "create", "update"],
    team: ["read"],
    invitation: ["read", "create", "cancel"],
    inventory: ["read", "create", "update", "adjust"],
    sales: ["read", "create", "discount", "refund", "void"],
    customers: ["read", "create", "update"],
    suppliers: ["read", "create", "update"],
    payments: ["read", "create", "refund"],
    reports: ["read", "export"],
    settings: ["read"],
    sync: ["read", "update"],
    etims: ["read", "submit", "retry"],
    cashDrawer: ["open", "close", "reconcile"],
  }),
  cashier: accessControl.newRole({
    inventory: ["read"],
    sales: ["read", "create", "discount"],
    customers: ["read", "create", "update"],
    payments: ["read", "create"],
    etims: ["read", "submit"],
    cashDrawer: ["open", "close"],
  }),
  storeClerk: accessControl.newRole({
    inventory: ["read", "create", "update", "adjust"],
    suppliers: ["read", "create", "update"],
    reports: ["read"],
  }),
  accountant: accessControl.newRole({
    sales: ["read", "refund"],
    payments: ["read", "refund"],
    reports: ["read", "export"],
    etims: ["read", "submit", "retry"],
    cashDrawer: ["reconcile"],
  }),
  viewer: accessControl.newRole({
    organization: ["read"],
    inventory: ["read"],
    sales: ["read"],
    customers: ["read"],
    suppliers: ["read"],
    payments: ["read"],
    reports: ["read"],
    etims: ["read"],
  }),
} as const;

type PosRole = keyof typeof posRoles;

export const toPermissionList = (role: PosRole) =>
  Object.entries(posRoles[role].statements).flatMap(([resource, actions]) =>
    actions.map((action) => `${resource}:${action}`),
  );

export const normalizeRole = (role?: string | null): PosRole =>
  role && role in posRoles ? (role as PosRole) : "cashier";
