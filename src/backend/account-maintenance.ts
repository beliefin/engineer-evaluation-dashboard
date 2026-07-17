import { z } from "zod"

import { invokeAuthenticated } from "./supabase-http"

const responseSchema = z.object({ resetCount: z.number().int().nonnegative() })

export async function resetRosterInitialPasswords(): Promise<number> {
  return (await invokeAuthenticated(
    "account-admin",
    { operation: "reset_roster_passwords" },
    responseSchema,
  )).resetCount
}
