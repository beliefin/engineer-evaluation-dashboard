import { describe, expect, it } from "vitest"

import type { EngineerEvaluationProgressRow } from "./dashboard-view-models"
import { filterAndSortProgressRows } from "./evaluation-progress-filtering"

const ROWS: readonly EngineerEvaluationProgressRow[] = [
  {
    id: "low", href: "/engineers/low", name: "가엔지니어", employeeCode: "0001",
    team: "생산 1팀", status: "in_progress", completedTaskCount: 1, taskCount: 2,
    tasks: [{
      taskId: "growth", label: "성장탐구계획서", weight: 35, status: "complete",
      score: 72, completedEvaluatorCount: 2, evaluatorCount: 2,
    }],
  },
  {
    id: "high", href: "/engineers/high", name: "나엔지니어", employeeCode: "0002",
    team: "생산 2팀", status: "complete", completedTaskCount: 2, taskCount: 2,
    tasks: [{
      taskId: "growth", label: "성장탐구계획서", weight: 35, status: "complete",
      score: 91, completedEvaluatorCount: 2, evaluatorCount: 2,
    }],
  },
  {
    id: "pending", href: "/engineers/pending", name: "다엔지니어", employeeCode: "0003",
    team: "생산 2팀", status: "not_started", completedTaskCount: 0, taskCount: 2,
    tasks: [{
      taskId: "growth", label: "성장탐구계획서", weight: 35, status: "not_started",
      score: null, completedEvaluatorCount: 0, evaluatorCount: 2,
    }],
  },
]

describe("evaluation progress filtering", () => {
  it("filters by task completion and orders completed engineers by task score", () => {
    const result = filterAndSortProgressRows(ROWS, {
      query: "",
      overallStatus: "all",
      taskFilters: { growth: "complete" },
    }, "task:growth:score_desc")

    expect(result.map((row) => row.id)).toEqual(["high", "low"])
  })

  it("keeps engineers without an applied task distinct from unstarted tasks", () => {
    const result = filterAndSortProgressRows(ROWS, {
      query: "",
      overallStatus: "all",
      taskFilters: { language: "not_applicable" },
    }, "default")

    expect(result).toHaveLength(3)
  })
})
