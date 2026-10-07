import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, expect, it, vi } from "vitest"
import { createSeedSnapshot } from "@/data/seed"
import { createLocalStorageEvaluationRepository } from "@/repository/local-storage"
import { MemoryStorage } from "@/repository/test-utils"
import { DirectScoreInput } from "@/features/operations/direct-score-input"
import { evaluationSnapshotSchema } from "./schema"
import { calculateEngineerResult } from "./scoring"

afterEach(cleanup)

it("saves and reloads proposal 120 while rejecting 121, nonfinite and other tasks over 100", () => {
  const storage = new MemoryStorage()
  const repo = createLocalStorageEvaluationRepository({ storage })
  const before = repo.loadSnapshot()
  const input = { cycleId: "cycle-2026-h1", engineerId: before.engineers[0]!.id, taskId: "task-proposal", score: 120, passResult: null, actor: { id: "operator-01", role: "operator" as const } }
  repo.updateDirectScore(input)
  const after = repo.loadSnapshot()
  expect(after.directScores.find((entry) => entry.engineerId === input.engineerId && entry.taskId === input.taskId)?.score).toBe(120)
  expect(after.directScores.filter((entry) => entry.taskId !== input.taskId)).toEqual(before.directScores.filter((entry) => entry.taskId !== input.taskId))
  expect(evaluationSnapshotSchema.safeParse(after).success).toBe(true)
  for (const score of [121, -1, NaN, Infinity]) expect(() => repo.updateDirectScore({ ...input, score })).toThrow()
  expect(() => repo.updateDirectScore({ ...input, taskId: "task-language", score: 101 })).toThrow()
  const invalid = { ...after, directScores: after.directScores.map((entry) => entry.taskId === "task-language" ? { ...entry, score: 101 } : entry) }
  expect(evaluationSnapshotSchema.safeParse(invalid).success).toBe(false)
})

it("allows 120 in the UI and blocks 121 and decimals beyond one place", async () => {
  const user = userEvent.setup()
  const onChange = vi.fn()
  render(<DirectScoreInput engineerName="대상" fieldLabel="고등급 제안" value={null} disabled={false} maxScore={120} onChange={onChange} />)
  const input = screen.getByRole("spinbutton")
  await user.type(input, "120")
  expect(onChange).toHaveBeenLastCalledWith(120)
  await user.clear(input)
  await user.type(input, "121")
  expect(input).toHaveAttribute("aria-invalid", "true")
  expect(onChange).not.toHaveBeenCalledWith(121)
})

it("keeps the proposal raw score and its weighted contribution above 100", () => {
  const seed = createSeedSnapshot()
  const proposal = seed.tasks.find((task) => task.id === "task-proposal")!
  const result = calculateEngineerResult({ cycleId: proposal.cycleId, engineerId: seed.engineers[0]!.id, tasks: [{ ...proposal, weight: 100 }], assignments: [], sheets: [], directScores: [{ id: "score", cycleId: proposal.cycleId, taskId: proposal.id, engineerId: seed.engineers[0]!.id, score: 120, passResult: null, updatedAt: "2026-10-07T00:00:00Z" }], directScoreRules: [], languageRecords: [], certificationRecords: [], cycleStartsAt: "2026-01-01" })
  expect(result.contributions[proposal.id]).toBe(120)
  expect(result.roundedFinalScore).toBe(120)
})
