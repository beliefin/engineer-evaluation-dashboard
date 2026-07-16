import type { ReactNode } from "react"

import { AUTH_SESSION_KEY, AUTH_STORAGE_KEY } from "@/auth"
import type { Role } from "@/domain"
import { AuthProvider } from "@/providers/auth-provider"

export function seedTestAuthSession(
  role: Role = "operator",
  evaluatorId: string | null = null,
  engineerId: string | null = null,
  roles: ReadonlyArray<Role> = [role],
): void {
  const accountId = `test-${role}`
  const now = new Date().toISOString()
  const linkedEvaluatorId = roles.includes("evaluator")
    ? (evaluatorId ?? "evaluator-01")
    : null
  const linkedEngineerId = roles.includes("engineer")
    ? (engineerId ?? "engineer-01")
    : null

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
    schemaVersion: 1,
    accounts: [{
      id: accountId,
      username: accountId,
      displayName: `테스트 ${role}`,
      role,
      roles,
      evaluatorId: linkedEvaluatorId,
      engineerId: linkedEngineerId,
      active: true,
      createdAt: now,
      updatedAt: now,
      passwordSalt: "test-salt",
      passwordHash: "test-hash",
    }],
  }))
  window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({
    schemaVersion: 1,
    accountId,
    expiresAt: Date.now() + 60_000,
  }))
}

export function TestAuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  return <AuthProvider>{children}</AuthProvider>
}
