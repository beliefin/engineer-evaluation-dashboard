import {
  TEAMS,
  DEPARTMENTS_BY_TEAM,
  type EvaluationTask,
  type Evaluator,
} from "@/domain"

import { GROWTH_PLAN_RUBRIC } from "./growth-plan-rubric"
import { OTS_SCENARIO_RUBRIC } from "./ots-scenario-rubric"
import { DX_TOOL_RUBRIC } from "./dx-tool-rubric"

export { TEAMS } from "@/domain"

export const CYCLE_ID = "cycle-2026-h1"
export const FIXED_TIMESTAMP = "2026-01-02T00:00:00.000Z"

export const POSITIONS = ["엔지니어", "선임 엔지니어", "책임 엔지니어"] as const

export const EVALUATORS = [
  { id: "evaluator-01", employeeCode: "9001", displayName: "샘플 평가자 1", division: "1부문", team: TEAMS[0], department: DEPARTMENTS_BY_TEAM["생산 1팀"][0], organizationUnit: null, rank: null, jobTitle: null },
  { id: "evaluator-02", employeeCode: "9002", displayName: "샘플 평가자 2", division: "1부문", team: TEAMS[1], department: DEPARTMENTS_BY_TEAM["생산 2팀"][0], organizationUnit: null, rank: null, jobTitle: null },
  { id: "evaluator-03", employeeCode: "9003", displayName: "샘플 평가자 3", division: "1부문", team: TEAMS[0], department: DEPARTMENTS_BY_TEAM["생산 1팀"][1], organizationUnit: null, rank: null, jobTitle: null },
  { id: "evaluator-04", employeeCode: "9004", displayName: "샘플 평가자 4", division: "1부문", team: TEAMS[1], department: DEPARTMENTS_BY_TEAM["생산 2팀"][1], organizationUnit: null, rank: null, jobTitle: null },
  { id: "evaluator-05", employeeCode: "9005", displayName: "샘플 평가자 5", division: "1부문", team: TEAMS[0], department: DEPARTMENTS_BY_TEAM["생산 1팀"][2], organizationUnit: null, rank: null, jobTitle: null },
] as const satisfies ReadonlyArray<Evaluator>

function scoreTask(
  id: string,
  name: string,
  description: string,
  weight: number,
  order: number,
  rubric: ReadonlyArray<Readonly<{
    section: string | null
    label: string
    criteria: ReadonlyArray<Readonly<{ score: number; description: string }>>
  }>> = [],
): EvaluationTask {
  const items = rubric.length > 0
    ? rubric
    : Array.from({ length: 10 }, (_, index) => ({
      section: null,
      label: `평가 항목 ${index + 1}`,
      criteria: [],
    }))
  return {
    id,
    cycleId: CYCLE_ID,
    name,
    description,
    method: "evaluator_score",
    weight,
    order,
    items: items.map((item, index) => ({
      id: `${id}-item-${String(index + 1).padStart(2, "0")}`,
      label: item.label,
      order: index + 1,
      section: item.section,
      criteria: item.criteria,
    })),
  }
}

function operatorTask(
  id: string,
  name: string,
  description: string,
  weight: number,
  order: number,
): EvaluationTask {
  return {
    id,
    cycleId: CYCLE_ID,
    name,
    description,
    method: "operator_score",
    weight,
    order,
    items: [],
  }
}

export const TASKS = [
  scoreTask(
    "task-growth-plan",
    "성장탐구계획서",
    "엔지니어의 성장 주제, 탐구 과정과 실행\u00a0계획을 평가합니다.",
    35,
    1,
    GROWTH_PLAN_RUBRIC,
  ),
  scoreTask(
    "task-ots-scenario",
    "OTS 시나리오 제작",
    "현장 시나리오의 완성도와 적용 가능성을 평가합니다.",
    35,
    2,
    OTS_SCENARIO_RUBRIC,
  ),
  scoreTask(
    "task-dx-tool",
    "DX 툴 활용",
    "DX 도구 활용 과정과 업무 개선 효과를 평가합니다.",
    35,
    3,
    DX_TOOL_RUBRIC,
  ),
  operatorTask("task-language", "어학", "환산식 확정 전 운영자가 점수를 입력합니다.", 10, 4),
  operatorTask("task-certification", "자격증", "환산식 확정 전 운영자가 점수를 입력합니다.", 10, 5),
  operatorTask("task-proposal", "고등급제안", "제안 실적의 환산 점수를 입력합니다.", 10, 6),
] as const satisfies ReadonlyArray<EvaluationTask>
