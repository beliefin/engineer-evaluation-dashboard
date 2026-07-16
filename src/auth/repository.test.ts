import { describe, expect, it } from "vitest"

import {
  createLocalStorageAuthRepository,
  type AuthStorage,
  type PasswordHasher,
} from "./repository"

class MemoryAuthStorage implements AuthStorage {
  private readonly values = new Map<string, string>()

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value)
  }

  removeItem(key: string): void {
    this.values.delete(key)
  }

  serializedValues(): string {
    return [...this.values.values()].join("\n")
  }
}

const hashPassword: PasswordHasher = async (password, salt) =>
  `digest:${salt}:${password.length}:${password.charCodeAt(0)}`

function createRepository(storage = new MemoryAuthStorage()) {
  let nextId = 0
  return {
    repository: createLocalStorageAuthRepository({
      storage,
      hashPassword,
      now: () => "2026-07-15T00:00:00.000Z",
      idFactory: () => {
        nextId += 1
        return `account-test-${nextId}`
      },
      saltFactory: () => "test-salt",
    }),
    storage,
  }
}

describe("LocalStorageAuthRepository", () => {
  it("authenticates a seeded operator and restores the session without storing plaintext", async () => {
    // Given
    const { repository, storage } = createRepository()

    // When
    const account = await repository.login({ username: "operator", password: "Demo!2026" })

    // Then
    expect(account).toMatchObject({ username: "operator", role: "operator", active: true })
    await expect(repository.restoreSession()).resolves.toMatchObject({ username: "operator" })
    expect(storage.serializedValues()).not.toContain("Demo!2026")
  })

  it("rejects an invalid password without creating a session", async () => {
    // Given
    const { repository } = createRepository()

    // When
    const login = repository.login({ username: "operator", password: "wrong-password" })

    // Then
    await expect(login).rejects.toMatchObject({ code: "INVALID_CREDENTIALS" })
    await expect(repository.restoreSession()).resolves.toBeNull()
  })

  it("lets an operator create an account that can log in with its assigned role", async () => {
    // Given
    const { repository } = createRepository()
    await repository.login({ username: "operator", password: "Demo!2026" })

    // When
    const accounts = await repository.createAccount({
      username: "reviewer01",
      displayName: "검토 승인자",
      role: "approver",
      roles: ["approver"],
      evaluatorId: null,
      engineerId: null,
      password: "Review!2026",
      active: true,
    })

    // Then
    expect(accounts).toContainEqual(expect.objectContaining({
      username: "reviewer01",
      role: "approver",
      roles: ["approver"],
    }))
    repository.logout()
    await expect(
      repository.login({ username: "reviewer01", password: "Review!2026" }),
    ).resolves.toMatchObject({ role: "approver" })
  })

  it("persists evaluator and engineer capabilities on one login account", async () => {
    const { repository } = createRepository()
    await repository.login({ username: "operator", password: "Demo!2026" })

    await repository.createAccount({
      username: "dual01",
      displayName: "복합 역할 사용자",
      role: "evaluator",
      roles: ["evaluator", "engineer"],
      evaluatorId: "evaluator-dual",
      engineerId: "engineer-dual",
      password: "31019467",
      active: true,
    })
    repository.logout()

    await expect(repository.login({ username: "dual01", password: "31019467" }))
      .resolves.toMatchObject({
        role: "evaluator",
        roles: ["evaluator", "engineer"],
        evaluatorId: "evaluator-dual",
        engineerId: "engineer-dual",
      })
  })

  it("authenticates a seeded engineer with a fixed roster linkage", async () => {
    // Given
    const { repository } = createRepository()

    // When
    const account = await repository.login({ username: "engineer01", password: "Demo!2026" })

    // Then
    expect(account).toMatchObject({
      role: "engineer",
      evaluatorId: null,
      engineerId: "engineer-01",
    })
  })

  it("blocks account administration by a non-operator", async () => {
    // Given
    const { repository } = createRepository()
    await repository.login({ username: "approver", password: "Demo!2026" })

    // When
    const list = repository.listAccounts()

    // Then
    await expect(list).rejects.toMatchObject({ code: "FORBIDDEN" })
  })

  it("updates evaluator linkage and resets a managed account password", async () => {
    // Given
    const { repository } = createRepository()
    await repository.login({ username: "operator", password: "Demo!2026" })
    const created = await repository.createAccount({
      username: "reviewer02",
      displayName: "평가 담당자",
      role: "approver",
      roles: ["approver"],
      evaluatorId: null,
      engineerId: null,
      password: "Review!2026",
      active: true,
    })
    const account = created.find((entry) => entry.username === "reviewer02")
    expect(account).toBeDefined()

    // When
    await repository.updateAccount({
      accountId: account?.id ?? "",
      displayName: "평가 담당자",
      role: "evaluator",
      roles: ["evaluator"],
      evaluatorId: "evaluator-02",
      engineerId: null,
      active: true,
    })
    await repository.resetPassword({
      accountId: account?.id ?? "",
      password: "Changed!2026",
    })
    repository.logout()

    // Then
    await expect(
      repository.login({ username: "reviewer02", password: "Changed!2026" }),
    ).resolves.toMatchObject({ role: "evaluator", evaluatorId: "evaluator-02" })
  })

  it("prevents the current operator from disabling or deleting their own account", async () => {
    // Given
    const { repository } = createRepository()
    const operator = await repository.login({ username: "operator", password: "Demo!2026" })

    // When
    const disable = repository.updateAccount({
      accountId: operator.id,
      displayName: operator.displayName,
      role: "operator",
      roles: ["operator"],
      evaluatorId: null,
      engineerId: null,
      active: false,
    })

    // Then
    await expect(disable).rejects.toMatchObject({ code: "SELF_LOCKOUT" })
    await expect(repository.deleteAccount(operator.id)).rejects.toMatchObject({
      code: "SELF_LOCKOUT",
    })
  })
})
