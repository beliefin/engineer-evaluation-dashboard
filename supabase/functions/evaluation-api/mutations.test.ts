import { describe, expect, it } from "vitest"

import { createSeedSnapshot } from "../../../src/data/seed"

import type { Profile, Snapshot } from "./model"
import {
  mergeOperatorSnapshot,
  mutateSchedule,
  mutateScoreAdjustment,
  mutateSheet,
  mutateUnlockRequest,
} from "./mutations"

const OPERATOR: Profile = {
  auth_user_id: "11111111-1111-4111-8111-111111111111",
  username: "operator",
  display_name: "운영자",
  role: "operator",
  evaluator_id: null,
  engineer_id: null,
  active: true,
}

function snapshotWithAdjustment(): Snapshot {
  const snapshot = createSeedSnapshot()
  return {
    ...snapshot,
    scoreAdjustments: [{
      id: "adjustment-1",
      cycleId: "cycle-2026-h1",
      engineerId: "engineer-01",
      amount: 2.5,
      reason: "특별 기여",
      createdAt: "2026-07-16T00:00:00.000Z",
      updatedAt: "2026-07-16T00:00:00.000Z",
    }],
  }
}

describe("score adjustment server mutations", () => {
  it("preserves canonical adjustments during a generic operator commit", () => {
    const current = snapshotWithAdjustment()
    const requested = { ...current, scoreAdjustments: [] }

    expect(mergeOperatorSnapshot(current, requested).scoreAdjustments).toEqual(current.scoreAdjustments)
  })

  it("saves an adjustment and records its reason in the audit log", () => {
    const updated = mutateScoreAdjustment(createSeedSnapshot(), OPERATOR, {
      operation: "save_score_adjustment",
      baseRevision: 4,
      adjustment: {
        adjustmentId: null,
        cycleId: "cycle-2026-h1",
        engineerId: "engineer-01",
        amount: -1.5,
        reason: "제출 기한 지연",
      },
    })

    expect(updated.scoreAdjustments).toHaveLength(1)
    expect(updated.scoreAdjustments[0]).toMatchObject({ amount: -1.5, reason: "제출 기한 지연" })
    expect(updated.auditEvents.at(-1)).toMatchObject({
      type: "score_adjustment_saved",
      reason: "제출 기한 지연",
    })
  })

  it("deletes an adjustment and keeps the original reason in the audit log", () => {
    const updated = mutateScoreAdjustment(snapshotWithAdjustment(), OPERATOR, {
      operation: "delete_score_adjustment",
      baseRevision: 5,
      adjustmentId: "adjustment-1",
    })

    expect(updated.scoreAdjustments).toEqual([])
    expect(updated.auditEvents.at(-1)).toMatchObject({
      type: "score_adjustment_deleted",
      reason: "특별 기여",
    })
  })
})

describe("sheet unlock request server mutation", () => {
  it("accepts only the assigned evaluator and records the pending request", () => {
    const snapshot = createSeedSnapshot()
    const sheet = snapshot.scoreSheets.find((entry) => entry.status === "submitted")
    const assignment = snapshot.assignments.find((entry) => entry.id === sheet?.assignmentId)
    if (sheet === undefined || assignment === undefined) throw new RangeError("submitted assignment missing")
    const evaluator: Profile = {
      ...OPERATOR,
      role: "evaluator",
      evaluator_id: assignment.evaluatorId,
    }

    const updated = mutateUnlockRequest(snapshot, evaluator, {
      operation: "request_sheet_unlock",
      baseRevision: 6,
      sheetId: sheet.id,
      reason: "평가 항목 3 점수 수정",
    })

    expect(updated.unlockRequests).toContainEqual(expect.objectContaining({
      sheetId: sheet.id,
      evaluatorId: assignment.evaluatorId,
      reason: "평가 항목 3 점수 수정",
      status: "pending",
    }))
    expect(updated.auditEvents.at(-1)).toMatchObject({
      type: "sheet_unlock_requested",
      targetId: sheet.id,
      reason: "평가 항목 3 점수 수정",
    })
  })
})

describe("operator sheet server mutation", () => {
  it("persists an operator score edit without replacing the whole snapshot", () => {
    const snapshot = createSeedSnapshot()
    const sheet = snapshot.scoreSheets[0]
    if (sheet === undefined) throw new RangeError("score sheet missing")
    const scores = sheet.scores.map((entry, index) => ({
      ...entry,
      score: index === 0 ? 9 : entry.score,
    }))

    const updated = mutateSheet(snapshot, OPERATOR, {
      operation: "save_draft",
      baseRevision: 10,
      sheetId: sheet.id,
      scores,
      passResult: sheet.passResult,
    })

    expect(updated.scoreSheets.find((entry) => entry.id === sheet.id)?.scores[0]?.score).toBe(9)
    expect(updated.engineers).toEqual(snapshot.engineers)
  })
})

describe("schedule server mutation", () => {
  it("creates one task-linked event per selected engineer", () => {
    const snapshot = createSeedSnapshot()
    const assignments = snapshot.assignments.filter((entry) => entry.taskId === "task-growth-plan")
    const engineerIds = [...new Set(assignments.map((entry) => entry.engineerId))].slice(0, 2)

    const updated = mutateSchedule(snapshot, OPERATOR, {
      operation: "create_schedule_events",
      baseRevision: 11,
      cycleId: "cycle-2026-h1",
      engineerIds,
      parallel: true,
      taskId: "task-growth-plan",
      title: "성장탐구 발표",
      date: "2026-07-16",
      startTime: "09:00",
      note: null,
    })

    const created = updated.scheduleEvents.slice(-engineerIds.length)
    expect(created.map((event) => event.engineerId)).toEqual(engineerIds)
    expect(created.every((event) => event.taskId === "task-growth-plan")).toBe(true)
    expect(created[0]?.presentationGroupId).not.toBeNull()
    expect(created[0]?.presentationGroupId).toBe(created[1]?.presentationGroupId)
  })
})
