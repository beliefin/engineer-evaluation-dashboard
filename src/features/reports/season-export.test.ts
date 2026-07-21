import { describe, expect, it } from "vitest"

import { createSeedSnapshot } from "@/data/seed"

import { buildSeasonExportWorkbook } from "./season-export"

describe("season Excel export", () => {
  it("separates summary, tasks, evaluator scores, language and certification data", () => {
    const snapshot = createSeedSnapshot()
    const cycle = snapshot.cycles[0]
    if (cycle === undefined) throw new RangeError("cycle fixture missing")

    const workbook = buildSeasonExportWorkbook(snapshot, cycle.id)
    const names = workbook.sheets.map((sheet) => sheet.name)

    expect(names).toContain("종합 결과")
    expect(names).toContain("과제별 결과")
    expect(names).toContain("평가자별 원점수")
    expect(names).toContain("어학 기록")
    expect(names).toContain("자격증 기록")
    expect(workbook.sheets.find((sheet) => sheet.name === "종합 결과")?.rows).toHaveLength(snapshot.engineers.length)
  })

  it("creates a task-only workbook without personal achievement sheets", () => {
    const snapshot = createSeedSnapshot()
    const cycle = snapshot.cycles[0]
    const task = snapshot.tasks.find((entry) => entry.cycleId === cycle?.id)
    if (cycle === undefined || task === undefined) throw new RangeError("task fixture missing")

    const workbook = buildSeasonExportWorkbook(snapshot, cycle.id, { taskId: task.id })
    const names = workbook.sheets.map((sheet) => sheet.name)

    expect(names.some((name) => name.includes(task.name.slice(0, 8)))).toBe(true)
    expect(names).not.toContain("종합 결과")
    expect(names).not.toContain("어학 기록")
  })
})
