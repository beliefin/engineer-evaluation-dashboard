import type {
  DirectScore,
  Engineer,
  EvaluationSnapshot,
  Evaluator,
} from "@/domain"

import {
  addEngineersInputSchema,
  addEvaluatorsInputSchema,
  parseRepositoryInput,
} from "./input-schemas"
import {
  appendAuditEvent,
  createEntityId,
  type MutationContext,
} from "./mutation-context"
import { requireCycleUnlocked, requireOperator } from "./repository-helpers"
import { mergeDepartmentCatalog } from "./department-catalog"
import {
  RepositoryError,
  type AddEngineersInput,
  type AddEvaluatorsInput,
} from "./types"

function normalizedCode(value: string): string {
  return value.toLocaleUpperCase("en-US")
}

function requireUniqueCodes(existing: ReadonlyArray<string>, incoming: ReadonlyArray<string>): void {
  const seen = new Set(existing.map(normalizedCode))
  for (const code of incoming) {
    const normalized = normalizedCode(code)
    if (seen.has(normalized)) {
      throw new RepositoryError(
        "DUPLICATE_EMPLOYEE_CODE",
        `employee code ${code} is already registered`,
      )
    }
    seen.add(normalized)
  }
}

export function addEngineersAction(
  context: MutationContext,
  input: AddEngineersInput,
): EvaluationSnapshot {
  const parsed = parseRepositoryInput(addEngineersInputSchema, input)
  requireOperator(parsed.actor)
  requireCycleUnlocked(context.snapshot, parsed.cycleId)
  requireUniqueCodes(
    context.snapshot.engineers.map((engineer) => engineer.employeeCode),
    parsed.engineers.map((engineer) => engineer.employeeCode),
  )
  const tasks = context.snapshot.tasks.filter((task) => task.cycleId === parsed.cycleId)
  const engineers: Engineer[] = []
  const directScores: DirectScore[] = []

  for (const candidate of parsed.engineers) {
    const engineer: Engineer = {
      id: createEntityId(context, "engineer"),
      ...candidate,
      organizationUnit: null,
      jobTitle: null,
    }
    engineers.push(engineer)
    for (const task of tasks) {
      if (task.method === "operator_score" || task.method === "operator_pass_fail") {
        directScores.push({
          id: createEntityId(context, "direct"),
          cycleId: parsed.cycleId,
          engineerId: engineer.id,
          taskId: task.id,
          score: null,
          passResult: null,
          updatedAt: context.now,
        })
      }
    }
  }

  const withRoster: EvaluationSnapshot = {
    ...context.snapshot,
    departmentCatalog: mergeDepartmentCatalog(
      context.snapshot,
      engineers.map((engineer) => ({ team: engineer.team, name: engineer.department })),
    ),
    engineers: [...context.snapshot.engineers, ...engineers],
    directScores: [...context.snapshot.directScores, ...directScores],
  }
  return engineers.reduce(
    (snapshot, engineer) =>
      appendAuditEvent(context, snapshot, {
        cycleId: parsed.cycleId,
        type: "engineer_added",
        actor: parsed.actor,
        targetId: engineer.id,
      }),
    withRoster,
  )
}

export function addEvaluatorsAction(
  context: MutationContext,
  input: AddEvaluatorsInput,
): EvaluationSnapshot {
  const parsed = parseRepositoryInput(addEvaluatorsInputSchema, input)
  requireOperator(parsed.actor)
  requireCycleUnlocked(context.snapshot, parsed.cycleId)
  requireUniqueCodes(
    context.snapshot.evaluators.map((evaluator) => evaluator.employeeCode),
    parsed.evaluators.map((evaluator) => evaluator.employeeCode),
  )
  const evaluators: Evaluator[] = []
  for (const candidate of parsed.evaluators) {
    const evaluator: Evaluator = {
      id: createEntityId(context, "evaluator"),
      ...candidate,
      organizationUnit: null,
      rank: null,
      jobTitle: null,
    }
    evaluators.push(evaluator)
  }

  const withRoster: EvaluationSnapshot = {
    ...context.snapshot,
    departmentCatalog: mergeDepartmentCatalog(
      context.snapshot,
      evaluators.map((evaluator) => ({ team: evaluator.team, name: evaluator.department })),
    ),
    evaluators: [...context.snapshot.evaluators, ...evaluators],
  }
  return evaluators.reduce(
    (snapshot, evaluator) =>
      appendAuditEvent(context, snapshot, {
        cycleId: parsed.cycleId,
        type: "evaluator_added",
        actor: parsed.actor,
        targetId: evaluator.id,
      }),
    withRoster,
  )
}
