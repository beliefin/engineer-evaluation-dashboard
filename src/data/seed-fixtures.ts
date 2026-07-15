import {
  TEAMS,
  type EvaluationTask,
  type Evaluator,
  type TaskEvaluatorWeight,
} from "@/domain"

export { TEAMS } from "@/domain"

export const CYCLE_ID = "cycle-2026-h1"
export const FIXED_TIMESTAMP = "2026-01-02T00:00:00.000Z"

export const POSITIONS = ["엔지니어", "선임 엔지니어", "책임 엔지니어"] as const

export const EVALUATORS = [
  { id: "evaluator-01", employeeCode: "EVAL-001", displayName: "샘플 평가자 1", team: TEAMS[0] },
  { id: "evaluator-02", employeeCode: "EVAL-002", displayName: "샘플 평가자 2", team: TEAMS[1] },
  { id: "evaluator-03", employeeCode: "EVAL-003", displayName: "샘플 평가자 3", team: TEAMS[0] },
  { id: "evaluator-04", employeeCode: "EVAL-004", displayName: "샘플 평가자 4", team: TEAMS[1] },
  { id: "evaluator-05", employeeCode: "EVAL-005", displayName: "샘플 평가자 5", team: TEAMS[0] },
] as const satisfies ReadonlyArray<Evaluator>

const EVALUATOR_WEIGHTS = [30, 25, 20, 15, 10] as const

function evaluatorWeights(): ReadonlyArray<TaskEvaluatorWeight> {
  return EVALUATORS.map((evaluator, index) => ({
    evaluatorId: evaluator.id,
    weight: EVALUATOR_WEIGHTS[index] ?? 1,
  }))
}

function scoreTask(
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
    method: "evaluator_score",
    weight,
    order,
    items: Array.from({ length: 10 }, (_, index) => ({
      id: `${id}-item-${String(index + 1).padStart(2, "0")}`,
      label: `평가 항목 ${index + 1}`,
      order: index + 1,
    })),
    evaluatorWeights: evaluatorWeights(),
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
    evaluatorWeights: [],
  }
}

export const TASKS = [
  scoreTask(
    "task-growth-plan",
    "성장탐구계획서",
    "엔지니어의 성장 주제, 탐구 과정과 실행\u00a0계획을 평가합니다.",
    35,
    1,
  ),
  scoreTask(
    "task-ots-scenario",
    "OTS 시나리오 제작",
    "현장 시나리오의 완성도와 적용 가능성을 평가합니다.",
    17.5,
    2,
  ),
  scoreTask(
    "task-dx-tool",
    "DX 툴 활용",
    "DX 도구 활용 과정과 업무 개선 효과를 평가합니다.",
    17.5,
    3,
  ),
  operatorTask("task-language", "어학", "환산식 확정 전 운영자가 점수를 입력합니다.", 10, 4),
  operatorTask("task-certification", "자격증", "환산식 확정 전 운영자가 점수를 입력합니다.", 10, 5),
  operatorTask("task-proposal", "고등급제안", "제안 실적의 환산 점수를 입력합니다.", 10, 6),
] as const satisfies ReadonlyArray<EvaluationTask>
