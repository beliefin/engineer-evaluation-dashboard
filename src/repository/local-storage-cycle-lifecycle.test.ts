import { describe, expect, it } from "vitest"

import { createLocalStorageEvaluationRepository } from "./local-storage"
import { createTestIdFactory, FIXED_NOW, MemoryStorage } from "./test-utils"

const OPERATOR = { id: "operator-01", role: "operator" } as const

function createRepository() {
  return createLocalStorageEvaluationRepository({
    storage: new MemoryStorage(),
    now: () => FIXED_NOW,
    idFactory: createTestIdFactory(),
  })
}

describe("evaluation season lifecycle", () => {
  it("updates settings, locks mutations, and unlocks the season for editing", () => {
    const repository = createRepository()
    const created = repository.createEvaluationCycle({
      sourceCycleId: "cycle-2026-h1",
      name: "Lifecycle season",
      status: "setup",
      startsAt: "2026-07-01",
      endsAt: "2026-12-31",
      copyConfiguration: true,
      actor: OPERATOR,
    })
    const season = created.cycles.at(-1)
    if (season === undefined) throw new RangeError("season missing")
    const operatorTask = created.tasks.find((task) =>
      task.cycleId === season.id && task.method === "operator_score",
    )
    const engineer = created.engineers[0]
    if (operatorTask === undefined || engineer === undefined) throw new RangeError("fixture incomplete")

    const updated = repository.updateEvaluationCycle({
      cycleId: season.id,
      name: "Lifecycle season revised",
      status: "closed",
      startsAt: "2026-07-02",
      endsAt: "2026-12-30",
      actor: OPERATOR,
    })
    expect(updated.cycles.find((entry) => entry.id === season.id)).toMatchObject({
      name: "Lifecycle season revised",
      status: "closed",
      startsAt: "2026-07-02",
      endsAt: "2026-12-30",
    })

    const locked = repository.setEvaluationCycleLock({
      cycleId: season.id,
      locked: true,
      actor: OPERATOR,
    })
    expect(locked.cycles.find((entry) => entry.id === season.id)?.locked).toBe(true)
    expect(() => repository.updateEvaluationCycle({
      cycleId: season.id,
      name: "Should be blocked",
      status: "closed",
      startsAt: "2026-07-02",
      endsAt: "2026-12-30",
      actor: OPERATOR,
    })).toThrowError(expect.objectContaining({ code: "TASK_LOCKED" }))
    expect(() => repository.updateDirectScore({
      cycleId: season.id,
      engineerId: engineer.id,
      taskId: operatorTask.id,
      score: 80,
      passResult: null,
      actor: OPERATOR,
    })).toThrowError(expect.objectContaining({ code: "TASK_LOCKED" }))
    expect(() => repository.deleteEvaluationCycle({
      cycleId: season.id,
      actor: OPERATOR,
    })).toThrowError(expect.objectContaining({ code: "TASK_LOCKED" }))

    const unlocked = repository.setEvaluationCycleLock({
      cycleId: season.id,
      locked: false,
      actor: OPERATOR,
    })
    expect(unlocked.cycles.find((entry) => entry.id === season.id)?.locked).toBe(false)
    const afterUnlock = repository.updateEvaluationCycle({
      cycleId: season.id,
      name: "Editable again",
      status: "setup",
      startsAt: "2026-07-02",
      endsAt: "2026-12-30",
      actor: OPERATOR,
    })
    expect(afterUnlock.cycles.find((entry) => entry.id === season.id)?.name).toBe("Editable again")
  })
})
