import type { AuthAccountRecord, AuthSnapshot, PasswordHasher } from "./types"

export const DEMO_PASSWORD = "Demo!2026"

export const DEMO_LOGIN_ACCOUNTS = [
  { username: "operator", displayName: "샘플 운영자", roleLabel: "운영자" },
  { username: "evaluator01", displayName: "샘플 평가자 01", roleLabel: "평가자" },
  { username: "approver", displayName: "샘플 승인자", roleLabel: "승인자" },
  { username: "engineer01", displayName: "샘플 엔지니어 01", roleLabel: "엔지니어" },
] as const

const SEED_ACCOUNT_DEFINITIONS = [
  {
    id: "auth-operator",
    username: "operator",
    displayName: "샘플 운영자",
    role: "operator",
    evaluatorId: null,
    engineerId: null,
    passwordSalt: "seed-operator-salt",
  },
  {
    id: "auth-evaluator-01",
    username: "evaluator01",
    displayName: "샘플 평가자 01",
    role: "evaluator",
    evaluatorId: "evaluator-01",
    engineerId: null,
    passwordSalt: "seed-evaluator-01-salt",
  },
  {
    id: "auth-approver",
    username: "approver",
    displayName: "샘플 승인자",
    role: "approver",
    evaluatorId: null,
    engineerId: null,
    passwordSalt: "seed-approver-salt",
  },
  {
    id: "auth-engineer-01",
    username: "engineer01",
    displayName: "샘플 엔지니어 01",
    role: "engineer",
    evaluatorId: null,
    engineerId: "engineer-01",
    passwordSalt: "seed-engineer-01-salt",
  },
] as const

export async function createSeedAuthSnapshot(
  hashPassword: PasswordHasher,
  timestamp: string,
): Promise<AuthSnapshot> {
  const accounts = await Promise.all(SEED_ACCOUNT_DEFINITIONS.map(async (definition) => ({
    ...definition,
    active: true,
    createdAt: timestamp,
    updatedAt: timestamp,
    passwordHash: await hashPassword(DEMO_PASSWORD, definition.passwordSalt),
  } satisfies AuthAccountRecord)))
  return { schemaVersion: 1, accounts }
}
