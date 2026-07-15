import type {
  DirectScore,
  Engineer,
  EvaluationSnapshot,
  Evaluator,
  EvaluatorAssignment,
  ScoreSheet,
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
  const assignments: EvaluatorAssignment[] = []
  const scoreSheets: ScoreSheet[] = []
  const directScores: DirectScore[] = []

  for (const candidate of parsed.engineers) {
    const engineer: Engineer = { id: createEntityId(context, "engineer"), ...candidate }
    engineers.push(engineer)
    for (const task of tasks) {
      if (task.method === "evaluator_score" || task.method === "evaluator_pass_fail") {
        for (const evaluator of task.evaluatorWeights) {
          const assignment: EvaluatorAssignment = {
            id: createEntityId(context, "assignment"),
            cycleId: parsed.cycleId,
            engineerId: engineer.id,
            evaluatorId: evaluator.evaluatorId,
            taskId: task.id,
          }
          assignments.push(assignment)
          scoreSheets.push({
            id: createEntityId(context, "sheet"),
            assignmentId: assignment.id,
            status: "draft",
            scores: task.method === "evaluator_score"
              ? task.items.map((item) => ({ itemId: item.id, score: null }))
              : [],
            passResult: null,
            updatedAt: context.now,
            submittedAt: null,
          })
        }
      } else {
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
    engineers: [...context.snapshot.engineers, ...engineers],
    assignments: [...context.snapshot.assignments, ...assignments],
    scoreSheets: [...context.snapshot.scoreSheets, ...scoreSheets],
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
    const evaluator: Evaluator = { id: createEntityId(context, "evaluator"), ...candidate }
    evaluators.push(evaluator)
  }

  const withRoster: EvaluationSnapshot = {
    ...context.snapshot,
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
