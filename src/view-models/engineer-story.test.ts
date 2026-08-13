import { describe, expect, it } from "vitest"

import type { Engineer, EngineerResult, TaskResult } from "@/domain"
import type { CategoryScoreViewModel } from "@/features/engineers"

import { createEngineerEvaluationStory } from "./engineer-story"
import type { EngineerResultSummary } from "./results"

function engineer(id: string): Engineer {
  return {
    id,
    employeeCode: id,
    displayName: id,
    division: "1부문",
    team: "생산 1팀",
    department: "전자약품담당",
    organizationUnit: null,
    position: "프로",
    jobTitle: null,
  }
}

function taskResult(taskId: string, score: number | null): TaskResult {
  return {
    taskId,
    method: "operator_score",
    status: score === null ? "incomplete" : "complete",
    score,
    passCount: null,
    evaluatorCount: null,
    evaluators: [],
  }
}

function summary(
  engineerId: string,
  score: number | null,
  taskScores: Readonly<Record<string, number | null>>,
): EngineerResultSummary {
  const contributions = Object.fromEntries(
    Object.entries(taskScores).map(([taskId, taskScore]) => [
      taskId,
      taskScore === null ? null : taskScore / 2,
    ]),
  )
  const result: EngineerResult = {
    cycleId: "cycle",
    engineerId,
    status: score === null ? "incomplete" : "complete",
    taskResults: Object.entries(taskScores).map(([taskId, taskScore]) =>
      taskResult(taskId, taskScore)),
    contributions,
    baseScore: score,
    adjustmentTotal: 0,
    finalScore: score,
    roundedFinalScore: score,
  }
  return { engineer: engineer(engineerId), result, status: score === null ? "in_progress" : "complete" }
}

function category(
  key: string,
  label: string,
  rawScore: number | null,
): CategoryScoreViewModel {
  return rawScore === null
    ? {
        key,
        label,
        status: "in_progress",
        rawScore: null,
        contribution: null,
        reflectionRatioPercent: 50,
        maxContribution: 50,
      }
    : {
        key,
        label,
        status: "complete",
        rawScore,
        contribution: rawScore / 2,
        reflectionRatioPercent: 50,
        maxContribution: 50,
      }
}

describe("createEngineerEvaluationStory", () => {
  it("keeps a valid zero score while excluding missing scores from comparisons", () => {
    const summaries = [
      summary("target", 0, { taskA: 0, taskB: null }),
      summary("peer", 50, { taskA: 100, taskB: 50 }),
    ]
    const story = createEngineerEvaluationStory(summaries, "target", [
      category("taskA", "과제 A", 0),
      category("taskB", "과제 B", null),
    ])

    expect(story.profile).toEqual([
      { key: "taskA", label: "과제 A", score: 0, averageScore: 50 },
    ])
    expect(story.taskComparisons[0]).toMatchObject({
      ownScore: 0,
      averageScore: 50,
      sampleSize: 2,
    })
    expect(story.taskComparisons[1]).toMatchObject({
      ownScore: null,
      averageScore: 50,
      sampleSize: 1,
    })
  })

  it("uses competition ranking for ties and ranks a partial score by current contributions", () => {
    const partial = summary("partial", null, { taskA: 100 })
    const summaries: readonly EngineerResultSummary[] = [
      {
        ...partial,
        result: {
          ...partial.result,
          contributions: { taskA: 50 },
          baseScore: null,
          finalScore: null,
          roundedFinalScore: null,
        },
      },
      summary("leader", 80, { taskA: 80 }),
      summary("tied", 50, { taskA: 50 }),
    ]

    const story = createEngineerEvaluationStory(
      summaries,
      "partial",
      [category("taskA", "과제 A", 100)],
    )

    expect(story).toMatchObject({
      score: 50,
      scoreLabel: "현재 반영 점수",
      rank: 2,
      cohortCount: 3,
      topPercentile: 66.7,
    })
  })

  it("uses the rounded-up top quarter of the completed score sample", () => {
    const scores = [100, 90, 80, 70, 60]
    const summaries = scores.map((score, index) =>
      summary(`engineer-${index}`, score, { taskA: score }))

    const story = createEngineerEvaluationStory(
      summaries,
      "engineer-0",
      [category("taskA", "과제 A", 100)],
    )

    expect(story.taskComparisons[0]).toMatchObject({
      averageScore: 80,
      topQuartileAverage: 95,
      sampleSize: 5,
    })
  })
})
