import {
  calculateCertificationScore,
  calculateLanguageScore,
  convertDirectScoreRecord,
  highestConvertedDirectScore,
  resolveEngineerTaskWeight,
  type EvaluationSnapshot,
} from "@/domain"
import type {
  OperationsViewModel,
  SubmittedSheetViewModel,
} from "@/features/operations"

import { formatTimestamp } from "./labels"
import { selectSourceRecordReview } from "./source-record-review"
import { selectEngineerResultSummaries } from "./results"

function selectSubmittedSheets(
  snapshot: EvaluationSnapshot,
  cycleId: string,
): ReadonlyArray<SubmittedSheetViewModel> {
  const cycle = snapshot.cycles.find((entry) => entry.id === cycleId)
  if (cycle === undefined) return []

  return snapshot.unlockRequests
    .filter((request) => request.cycleId === cycleId && request.status === "pending")
    .toSorted((left, right) => right.createdAt.localeCompare(left.createdAt))
    .flatMap((request) => {
      const sheet = snapshot.scoreSheets.find(
        (entry) => entry.id === request.sheetId && entry.status === "submitted",
      )
      if (sheet === undefined) return []
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
        requestReason: request.reason,
        requestedAtLabel: formatTimestamp(request.createdAt) ?? "요청 시각 없음",
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
  const cycleRules = snapshot.directScoreRules.filter((rule) => rule.cycleId === cycleId)
  const certificationRules = cycleRules.filter((rule) => rule.kind === "certification")
  const languageRules = cycleRules.filter((rule) => rule.kind === "language")
  const resultByEngineer = new Map(
    selectEngineerResultSummaries(snapshot, cycleId).map((summary) => [
      summary.engineer.id,
      summary.result,
    ]),
  )
  const languageOptionMap = new Map<string, {
    languageGroup: "english" | "second_language"
    examName: string
    numericResult: boolean
    resultOptions: string[]
  }>()
  languageRules
    .filter((rule) => rule.enabled && rule.ruleType === "base" && rule.languageGroup != null && rule.examName != null)
    .toSorted((left, right) => left.order - right.order)
    .forEach((rule) => {
      const key = `${rule.languageGroup}:${rule.examName}`
      const current = languageOptionMap.get(key) ?? {
        languageGroup: rule.languageGroup!,
        examName: rule.examName!,
        numericResult: false,
        resultOptions: [],
      }
      current.numericResult ||= rule.operator === "gte"
      if (rule.operator === "equals" && !current.resultOptions.includes(rule.value)) current.resultOptions.push(rule.value)
      languageOptionMap.set(key, current)
    })
  const certificationOptions = certificationRules
    .filter((rule) =>
      rule.field === "certificateName" &&
      rule.operator === "equals" &&
      rule.ruleType === "base"
    )
    .toSorted((left, right) => left.order - right.order)
    .map((rule) => ({
      name: rule.value,
      category: rule.category ?? null,
      difficulty: rule.difficulty ?? null,
      workRelevance: rule.workRelevance ?? null,
      baseScore: rule.score,
      newAcquisitionBonus: rule.bonus,
      enabled: rule.enabled,
    }))

  return {
    cycleId: cycle.id,
    cycleLabel: cycle.name,
    cycleCount: snapshot.cycles.length,
    cycleStatus: cycle.status,
    cycleLocked: cycle.locked,
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
        items: task.items.map((item) => ({
          id: item.id,
          label: item.label,
          section: item.section,
          criteria: item.criteria,
        })),
        submittedCount,
        locked: submittedCount > 0,
      }
    }),
    evaluatorOptions: snapshot.evaluators.map((evaluator) => ({
      id: evaluator.id,
      name: evaluator.displayName,
      employeeCode: evaluator.employeeCode,
    })),
    evaluatorAssignments: snapshot.engineers.flatMap((engineer) =>
      tasks
        .filter((task) =>
          (task.method === "evaluator_score" || task.method === "evaluator_pass_fail") &&
          resolveEngineerTaskWeight(task, engineer.id, snapshot.engineerTaskWeights) > 0)
        .map((task) => {
          const assignments = snapshot.assignments.filter((assignment) =>
            assignment.cycleId === cycleId &&
            assignment.engineerId === engineer.id &&
            assignment.taskId === task.id)
          const totalWeight = assignments.reduce((total, assignment) => total + assignment.weight, 0)
          return {
            engineerId: engineer.id,
            engineerName: engineer.displayName,
            employeeLabel: engineer.employeeCode,
            teamName: engineer.team,
            taskId: task.id,
            taskName: task.name,
            assignments: assignments.map((assignment) => {
              const sheet = snapshot.scoreSheets.find((entry) => entry.assignmentId === assignment.id)
              const status = sheet?.status === "submitted"
                ? "submitted" as const
                : sheet !== undefined && (
                    sheet.passResult !== null || sheet.scores.some((entry) => entry.score !== null)
                  )
                  ? "in_progress" as const
                  : "pending" as const
              return {
                assignmentId: assignment.id,
                evaluatorId: assignment.evaluatorId,
                evaluatorName: snapshot.evaluators.find(
                  (evaluator) => evaluator.id === assignment.evaluatorId,
                )?.displayName ?? "삭제된 평가자",
                weight: assignment.weight,
                normalizedRatio: totalWeight > 0 ? assignment.weight / totalWeight : 0,
                status,
              }
            }),
          }
        }),
    ),
    weightTotal: tasks.reduce((total, task) => total + task.weight, 0),
    engineerTaskWeights: snapshot.engineers.map((engineer) => ({
      engineerId: engineer.id,
      engineerName: engineer.displayName,
      employeeLabel: engineer.employeeCode,
      teamName: engineer.team,
      customized: snapshot.engineerTaskWeights.some(
        (entry) => entry.cycleId === cycleId && entry.engineerId === engineer.id,
      ),
      seasonDefaultsEnabled: !snapshot.engineerTaskWeights.some(
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
    directScores: snapshot.engineers.map((engineer) => {
      const languageRecords = snapshot.languageScoreRecords.filter(
        (record) => record.cycleId === cycleId && record.engineerId === engineer.id,
      )
      const certificationRecords = snapshot.certificationRecords.filter(
        (record) => record.cycleId === cycleId && record.engineerId === engineer.id,
      )
      const certificationScore = calculateCertificationScore(
        certificationRecords,
        certificationRules,
        cycle.startsAt,
      )
      const certificationEntries = new Map(
        certificationScore.entries.map((entry) => [entry.recordId, entry]),
      )
      const languageScore = calculateLanguageScore(languageRecords, languageRules, cycle.startsAt)
      const languageEntries = new Map(languageScore.entries.map((entry) => [entry.recordId, entry]))
      return {
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
        const taskRules = snapshot.directScoreRules.filter(
          (rule) => rule.cycleId === cycleId && rule.taskId === task.id,
        )
        const calculatedScore = taskRules.length === 0
          ? null
          : highestConvertedDirectScore(
            taskRules[0]?.kind === "language" ? languageRecords : certificationRecords,
            taskRules,
            cycle.startsAt,
          )
        return [{
          taskId: task.id,
          taskName: task.name,
          method: task.method === "operator_score" ? "operator_score" : "operator_pass_fail",
          weight: effectiveWeight,
          score: taskRules.length > 0 ? calculatedScore : stored?.score ?? null,
          passResult: stored?.passResult ?? null,
          formulaDriven: taskRules.length > 0,
        }]
      }),
      languageRecords: languageRecords.map((record) => ({
          ...languageEntries.get(record.id),
          id: record.id,
          examName: record.examName,
          languageName: record.languageName ?? null,
          languageGroup: record.languageGroup ?? "english",
          result: record.result,
          previousResult: record.previousResult ?? null,
          newlyAcquired: record.newlyAcquired ?? false,
          acquiredOn: record.acquiredOn,
          note: record.note,
          convertedScore: languageEntries.get(record.id)?.baseScore ?? convertDirectScoreRecord(record, languageRules),
          ...selectSourceRecordReview(snapshot, record.id, record.updatedAt),
        })),
      certificationRecords: certificationRecords.map((record) => {
        const scoreEntry = certificationEntries.get(record.id)
        return {
          id: record.id,
          certificateName: record.certificateName,
          grade: record.grade,
          acquiredOn: record.acquiredOn,
          issuer: record.issuer,
          baseScore: scoreEntry?.baseScore ?? null,
          newAcquisitionBonus: scoreEntry?.newAcquisitionBonus ?? 0,
          includedInTopThree: scoreEntry?.includedInTopThree ?? false,
          bonusApplied: scoreEntry?.bonusApplied ?? false,
          partialScoreApplied: scoreEntry?.partialScoreApplied ?? false,
          ...selectSourceRecordReview(snapshot, record.id, record.updatedAt),
        }
      }),
      certificationScore: {
        score: certificationScore.score,
        baseScore: certificationScore.baseScore,
        bonusScore: certificationScore.bonusScore,
        partialScore: certificationScore.partialScore,
      },
      languageScore: {
        score: languageScore.score,
        baseScore: languageScore.baseScore,
        gradeUpgradeBonus: languageScore.gradeUpgradeBonus,
        secondLanguageNewBonus: languageScore.secondLanguageNewBonus,
      },
    }
    }),
    scoreAdjustments: snapshot.engineers.map((engineer) => {
      const result = resultByEngineer.get(engineer.id)
      const adjustments = snapshot.scoreAdjustments
        .filter((entry) => entry.cycleId === cycleId && entry.engineerId === engineer.id)
        .toSorted((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      return {
        engineerId: engineer.id,
        engineerName: engineer.displayName,
        employeeLabel: engineer.employeeCode,
        teamName: engineer.team,
        baseScore: result?.baseScore ?? null,
        adjustmentTotal: result?.adjustmentTotal ?? 0,
        finalScore: result?.finalScore ?? null,
        adjustments: adjustments.map((entry) => ({
          id: entry.id,
          amount: entry.amount,
          reason: entry.reason,
          updatedAtLabel: formatTimestamp(entry.updatedAt) ?? "시각 없음",
        })),
      }
    }),
    rosterEngineers: snapshot.engineers,
    rosterEvaluators: snapshot.evaluators,
    departmentCatalog: snapshot.departmentCatalog ?? [],
    directScoreRules: cycleRules,
    derivedScoreRules: snapshot.derivedScoreRules
      .filter((rule) => rule.cycleId === cycleId)
      .map((rule) => ({
        ruleId: rule.id,
        taskId: rule.taskId,
        targetEngineerId: rule.targetEngineerId,
        sourceTaskId: rule.sourceTaskId,
        sourceEngineerIds: rule.sourceEngineerIds,
      })),
    derivedTasks: tasks
      .filter((task) => task.method === "derived_score")
      .map((task) => ({ taskId: task.id, taskName: task.name })),
    derivedSourceTasks: tasks
      .filter((task) => task.method === "evaluator_score" || task.method === "evaluator_pass_fail")
      .map((task) => ({ taskId: task.id, taskName: task.name })),
    derivedEngineerOptions: snapshot.engineers.map((engineer) => ({
      engineerId: engineer.id,
      engineerName: engineer.displayName,
      teamName: engineer.team,
    })),
    operatorTasks: operatorTasks.map((task) => ({ taskId: task.id, taskName: task.name })),
    certificationOptions,
    languageOptions: [...languageOptionMap.values()],
    submittedSheets: selectSubmittedSheets(snapshot, cycleId),
  }
}
