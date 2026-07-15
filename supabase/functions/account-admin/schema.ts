import { z } from "zod"

export const roleSchema = z.enum(["operator", "evaluator", "approver", "engineer"])
const username = z.string().trim().toLowerCase().regex(/^[a-z0-9._-]{4,40}$/)
const displayName = z.string().trim().min(1).max(50)
const password = z.string().min(10).max(100)
const accountFields = {
  displayName,
  role: roleSchema,
  evaluatorId: z.string().trim().min(1).nullable(),
  engineerId: z.string().trim().min(1).nullable(),
  active: z.boolean(),
}

export const requestSchema = z.discriminatedUnion("operation", [
  z.object({ operation: z.literal("list") }),
  z.object({ operation: z.literal("create"), username, password, ...accountFields }),
  z.object({ operation: z.literal("update"), accountId: z.uuid(), ...accountFields }),
  z.object({ operation: z.literal("reset_password"), accountId: z.uuid(), password }),
  z.object({ operation: z.literal("delete"), accountId: z.uuid() }),
])
export type AccountRequest = z.infer<typeof requestSchema>

export const profileSchema = z.object({
  auth_user_id: z.uuid(), username: z.string(), display_name: z.string(), role: roleSchema,
  evaluator_id: z.string().nullable(), engineer_id: z.string().nullable(), active: z.boolean(),
  created_at: z.string(), updated_at: z.string(),
})
export type Profile = z.infer<typeof profileSchema>

export function validateRoleLink(input: {
  role: z.infer<typeof roleSchema>
  evaluatorId: string | null
  engineerId: string | null
}): void {
  const valid = input.role === "evaluator"
    ? input.evaluatorId !== null && input.engineerId === null
    : input.role === "engineer"
      ? input.evaluatorId === null && input.engineerId !== null
      : input.evaluatorId === null && input.engineerId === null
  if (!valid) throw new Error("ROLE_LINK_INVALID")
}
