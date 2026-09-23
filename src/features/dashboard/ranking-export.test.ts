import { describe, expect, it } from "vitest"

import type { CompletedRankingRow, TaskRankingSection } from "./dashboard-view-models"
import { buildOverallRankingWorkbook, buildTaskRankingWorkbook } from "./ranking-export"

const TASK_RANKINGS: readonly TaskRankingSection[] = [
  {
    taskId: "task-growth",
    label: "성장탐구계획서",
    completedCount: 1,
    targetCount: 2,
    rows: [
      {
        id: "engineer-1",
        href: "/engineers/detail?engineerId=engineer-1",
        rank: 1,
        name: "가상 엔지니어 1",
        team: "생산 1팀",
        score: 92.25,
        status: "complete",
        isTied: false,
      },
      {
        id: "engineer-2",
        href: "/engineers/detail?engineerId=engineer-2",
        rank: null,
        name: "가상 엔지니어 2",
        team: "생산 2팀",
        score: null,
        status: "not_started",
        isTied: false,
      },
    ],
  },
  {
    taskId: "task-dx",
    label: "DX 툴 활용",
    completedCount: 1,
    targetCount: 1,
    rows: [
      {
        id: "engineer-1",
        href: "/engineers/detail?engineerId=engineer-1",
        rank: 1,
        name: "가상 엔지니어 1",
        team: "생산 1팀",
        score: 88,
        status: "complete",
        isTied: true,
      },
    ],
  },
]

const OVERALL_ROWS: readonly CompletedRankingRow[] = [
  {
    id: "engineer-1",
    href: "/engineers/detail?engineerId=engineer-1",
    rank: 1,
    name: "가상 엔지니어 1",
    team: "생산 1팀",
    totalScore: 81.25,
    status: "in_progress",
    completedTaskCount: 4,
    taskCount: 5,
    isTied: false,
  },
]

describe("dashboard ranking Excel export", () => {
  it("includes a combined task ranking sheet and a sheet for every task", () => {
    const workbook = buildTaskRankingWorkbook("2026년 역량평가", "전체", TASK_RANKINGS)

    expect(workbook.title).toBe("2026년 역량평가 전체 과제별 순위")
    expect(workbook.sheets.map((sheet) => sheet.name)).toEqual([
      "전체 과제 순위",
      "1. 성장탐구계획서",
      "2. DX 툴 활용",
    ])
    expect(workbook.sheets[0]?.rows).toHaveLength(3)
    expect(workbook.sheets[0]?.rows[0]).toMatchObject({
      task: "성장탐구계획서",
      rank: 1,
      score: 92.25,
      status: "평가 완료",
    })
    expect(workbook.sheets[0]?.rows[1]).toMatchObject({ rank: null, status: "미진행" })
    expect(workbook.sheets[0]?.rows[2]).toMatchObject({ tied: "공동 순위" })
  })

  it("exports the selected overall ranking population with progress details", () => {
    const workbook = buildOverallRankingWorkbook("2026년 역량평가", "생산 1팀", OVERALL_ROWS)

    expect(workbook.title).toBe("2026년 역량평가 생산 1팀 종합 순위")
    expect(workbook.sheets).toHaveLength(1)
    expect(workbook.sheets[0]?.rows).toEqual([{
      rank: 1,
      name: "가상 엔지니어 1",
      team: "생산 1팀",
      totalScore: 81.25,
      status: "진행 중",
      taskProgress: "4/5",
      tied: "",
    }])
  })
})
