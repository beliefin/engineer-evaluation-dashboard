import { describe, expect, it } from "vitest"

import { createSeedSnapshot } from "@/data/seed"

import { createLocalStorageEvaluationRepository } from "./local-storage"
import { LOCAL_STORAGE_KEY } from "./storage-keys"

class MemoryStorage {
  private readonly values = new Map<string, string>()
  getItem(key: string): string | null { return this.values.get(key) ?? null }
  setItem(key: string, value: string): void { this.values.set(key, value) }
}

describe("evaluation season deletion", () => {
  it("deletes an unsubmitted setup season and its task configuration", () => {
    const storage = new MemoryStorage()
    storage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(createSeedSnapshot()))
    const repository = createLocalStorageEvaluationRepository({ storage })
    const created = repository.createEvaluationCycle({
      sourceCycleId: "cycle-2026-h1",
      name: "삭제 테스트 시즌",
      status: "setup",
      startsAt: "2026-07-01",
      endsAt: "2026-12-31",
      copyConfiguration: false,
      actor: { id: "operator", role: "operator" },
    })
    const cycleId = created.cycles.at(-1)?.id
    expect(cycleId).toBeDefined()
    const deleted = repository.deleteEvaluationCycle({
      cycleId: cycleId ?? "missing",
      actor: { id: "operator", role: "operator" },
    })
    expect(deleted.cycles.some((cycle) => cycle.id === cycleId)).toBe(false)
  })
})
