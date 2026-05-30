import {z} from "zod"

export const rolesSchema = z.enum(["owner", "member", "manager", "cashier", "storeclerk", "accountant", "viewer"])
export type Roles = z.infer<typeof rolesSchema>

const authMember = z.object({
  userId: z.string(),
  role: rolesSchema, 
  organizationId: z.string(),
  teamId: z.string(),
});

export type AuthMember = z.infer<typeof authMember>