import { z } from "zod"

export const roleSchema = z.enum(["operator", "evaluator", "approver", "engineer"])
export const rolesSchema = z.array(roleSchema).min(1).max(2)
const username = z.string().trim().toLowerCase().regex(/^[가-힣a-z0-9._-]{2,40}$/)
const displayName = z.string().trim().min(1).max(50)
const password = z.string().min(4).max(64)
const accountFields = {
  displayName,
  role: roleSchema,
  roles: rolesSchema.optional(),
  evaluatorId: z.string().trim().min(1).nullable(),
  engineerId: z.string().trim().min(1).nullable(),
  active: z.boolean(),
}

export const requestSchema = z.discriminatedUnion("operation", [
  z.object({ operation: z.literal("list") }),
  z.object({ operation: z.literal("reset_roster_passwords") }),
  z.object({ operation: z.literal("create"), username, password, ...accountFields }),
  z.object({ operation: z.literal("update"), accountId: z.uuid(), ...accountFields }),
  z.object({ operation: z.literal("reset_password"), accountId: z.uuid(), password }),
  z.object({ operation: z.literal("change_own_password"), password }),
  z.object({ operation: z.literal("delete"), accountId: z.uuid() }),
])
export type AccountRequest = z.infer<typeof requestSchema>

export const profileSchema = z.object({
  auth_user_id: z.uuid(), username: z.string(), display_name: z.string(), role: roleSchema,
  roles: rolesSchema,
  evaluator_id: z.string().nullable(), engineer_id: z.string().nullable(), active: z.boolean(),
  must_change_password: z.boolean(),
  created_at: z.string(), updated_at: z.string(),
})
export type Profile = z.infer<typeof profileSchema>

export function validateRoleLink(input: {
  role: z.infer<typeof roleSchema>
  roles?: ReadonlyArray<z.infer<typeof roleSchema>>
  evaluatorId: string | null
  engineerId: string | null
}): void {
  const roles = input.roles ?? [input.role]
  const validRoleSet = roles.length === 1
    ? roles[0] === input.role
    : roles[0] === "evaluator" && roles[1] === "engineer" && input.role === "evaluator"
  const evaluatorRole = roles.includes("evaluator")
  const engineerRole = roles.includes("engineer")
  const valid = validRoleSet &&
    evaluatorRole === (input.evaluatorId !== null) &&
    engineerRole === (input.engineerId !== null)
  if (!valid) throw new Error("ROLE_LINK_INVALID")
}
