import {
  resolveEngineerTaskWeight,
  type EvaluationSnapshot,
} from "@/domain"
import type {
  OperationsViewModel,
  SubmittedSheetViewModel,
} from "@/features/operations"

import { formatTimestamp } from "./labels"
import { selectSourceRecordReview } from "./source-record-review"

function selectSubmittedSheets(
  snapshot: EvaluationSnapshot,
  cycleId: string,
): ReadonlyArray<SubmittedSheetViewModel> {
  const cycle = snapshot.cycles.find((entry) => entry.id === cycleId)
  if (cycle === undefined) return []

  return snapshot.scoreSheets
    .filter((sheet) => sheet.status === "submitted")
    .toSorted((left, right) =>
      (right.submittedAt ?? "").localeCompare(left.submittedAt ?? ""),
    )
    .flatMap((sheet) => {
      const assignment = snapshot.assignments.find(
        (entry) => entry.id === sheet.assignmentId && entry.cycleId === cycleId,
      )
      if (assignment === undefined) return []
      const engineer = snapshot.engineers.find(
        (entry) => entry.id === assignment.engineerId,
      )
      const evaluator = snapshot.evaluators.find(
        (entry) => entry.id === assignment.evaluatorId,
      )
      if (engineer === undefined || evaluator === undefined) return []
      return [{
        sheetId: sheet.id,
        engineerName: engineer.displayName,
        evaluatorName: evaluator.displayName,
        taskLabel: snapshot.tasks.find((task) => task.id === assignment.taskId)?.name ?? "삭제된 과제",
        submittedAtLabel: formatTimestamp(sheet.submittedAt) ?? "제출 시각 없음",
      }]
    })
}

export function selectOperationsViewModel(
  snapshot: EvaluationSnapshot,
  cycleId: string,
): OperationsViewModel | null {
  const cycle = snapshot.cycles.find((entry) => entry.id === cycleId)
  if (cycle === undefined) return null
  const tasks = snapshot.tasks
    .filter((task) => task.cycleId === cycleId)
    .toSorted((left, right) => left.order - right.order)
  const operatorTasks = tasks.filter(
    (task) => task.method === "operator_score" || task.method === "operator_pass_fail",
  )

  return {
    cycleLabel: cycle.name,
    cycleCount: snapshot.cycles.length,
    cycleStatus: cycle.status,
    cycleStartsAt: cycle.startsAt,
    cycleEndsAt: cycle.endsAt,
    tasks: tasks.map((task) => {
      const assignmentIds = new Set(
        snapshot.assignments.filter((assignment) => assignment.taskId === task.id).map((assignment) => assignment.id),
      )
      const submittedCount = snapshot.scoreSheets.filter(
        (sheet) => assignmentIds.has(sheet.assignmentId) && sheet.status === "submitted",
      ).length
      return {
        taskId: task.id,
        name: task.name,
        description: task.description,
        method: task.method,
        weight: task.weight,
        order: task.order,
        items: task.items.map((item) => ({ id: item.id, label: item.label })),
        evaluatorWeights: task.evaluatorWeights,
        submittedCount,
        locked: submittedCount > 0,
      }
    }),
    evaluatorOptions: snapshot.evaluators.map((evaluator) => ({
      id: evaluator.id,
      name: evaluator.displayName,
      employeeCode: evaluator.employeeCode,
    })),
    weightTotal: tasks.reduce((total, task) => total + task.weight, 0),
    engineerTaskWeights: snapshot.engineers.map((engineer) => ({
      engineerId: engineer.id,
      engineerName: engineer.displayName,
      employeeLabel: engineer.employeeCode,
      teamName: engineer.team,
      customized: snapshot.engineerTaskWeights.some(
        (entry) => entry.cycleId === cycleId && entry.engineerId === engineer.id,
      ),
      tasks: tasks.map((task) => ({
        taskId: task.id,
        taskName: task.name,
        method: task.method,
        defaultWeight: task.weight,
        weight: resolveEngineerTaskWeight(
          task,
          engineer.id,
          snapshot.engineerTaskWeights,
        ),
      })),
    })),
    directScores: snapshot.engineers.map((engineer) => ({
      engineerId: engineer.id,
      engineerName: engineer.displayName,
      employeeLabel: engineer.employeeCode,
      teamName: engineer.team,
      directTasks: operatorTasks.flatMap((task) => {
        const effectiveWeight = resolveEngineerTaskWeight(
          task,
          engineer.id,
          snapshot.engineerTaskWeights,
        )
        if (effectiveWeight <= 0) return []
        const stored = snapshot.directScores.find(
          (entry) => entry.cycleId === cycleId && entry.engineerId === engineer.id && entry.taskId === task.id,
        )
        return [{
          taskId: task.id,
          taskName: task.name,
          method: task.method === "operator_score" ? "operator_score" : "operator_pass_fail",
          weight: effectiveWeight,
          score: stored?.score ?? null,
          passResult: stored?.passResult ?? null,
        }]
      }),
      languageRecords: snapshot.languageScoreRecords
        .filter(
          (record) =>
            record.cycleId === cycleId && record.engineerId === engineer.id,
        )
        .map((record) => ({
          id: record.id,
          examName: record.examName,
          result: record.result,
          acquiredOn: record.acquiredOn,
          note: record.note,
          ...selectSourceRecordReview(snapshot, record.id, record.updatedAt),
        })),
      certificationRecords: snapshot.certificationRecords
        .filter(
          (record) =>
            record.cycleId === cycleId && record.engineerId === engineer.id,
        )
        .map((record) => ({
          id: record.id,
          certificateName: record.certificateName,
          grade: record.grade,
          acquiredOn: record.acquiredOn,
          issuer: record.issuer,
          ...selectSourceRecordReview(snapshot, record.id, record.updatedAt),
        })),
    })),
    rosterEngineers: snapshot.engineers,
    rosterEvaluators: snapshot.evaluators,
    submittedSheets: selectSubmittedSheets(snapshot, cycleId),
  }
}
