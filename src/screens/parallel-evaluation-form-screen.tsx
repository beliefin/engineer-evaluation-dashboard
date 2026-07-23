"use client"

import { useMemo } from "react"

import { AccessDenied, EmptyState } from "@/components/shared"
import {
  ParallelEvaluationScoreForm,
  type AutosaveStatus,
  type EvaluationScoreFormProps,
  type EvaluationScoreFormViewModel,
} from "@/features/evaluations"
import { useEvaluation } from "@/providers"
import { selectEvaluationScoreForm } from "@/view-models/evaluations"

function mapSaveState(state: string): AutosaveStatus {
  if (state === "saving" || state === "saved" || state === "error") return state
  return "idle"
}

interface ParallelEvaluationFormScreenProps {
  readonly leftAssignmentId: string
  readonly rightAssignmentId: string
}

export function ParallelEvaluationFormScreen({
  leftAssignmentId,
  rightAssignmentId,
}: ParallelEvaluationFormScreenProps) {
  const {
    snapshot,
    activeEvaluatorId,
    role,
    saveState,
    saveDraft,
    submitSheet,
    requestSheetUnlock,
  } = useEvaluation()
  const models = useMemo(() => {
    if (snapshot === null) return null
    return {
      left: selectEvaluationScoreForm(snapshot, leftAssignmentId, {
        autosaveStatus: mapSaveState(saveState),
        proxyEntry: false,
      }),
      right: selectEvaluationScoreForm(snapshot, rightAssignmentId, {
        autosaveStatus: mapSaveState(saveState),
        proxyEntry: false,
      }),
    }
  }, [leftAssignmentId, rightAssignmentId, saveState, snapshot])

  if (snapshot === null || models === null) return null
  const leftAssignment = snapshot.assignments.find((entry) => entry.id === leftAssignmentId)
  const rightAssignment = snapshot.assignments.find((entry) => entry.id === rightAssignmentId)
  if (leftAssignment === undefined || rightAssignment === undefined || models.left === null || models.right === null) {
    return <EmptyState description="요청한 동시 평가 배정을 찾을 수 없습니다." title="평가 배정이 없습니다" />
  }
  const allowed = role === "evaluator" &&
    leftAssignment.evaluatorId === activeEvaluatorId &&
    rightAssignment.evaluatorId === activeEvaluatorId &&
    leftAssignment.taskId === rightAssignment.taskId
  if (!allowed) return <AccessDenied allowedRoles={["evaluator"]} currentRole={role} />

  const leftSheet = snapshot.scoreSheets.find((entry) => entry.assignmentId === leftAssignmentId)
  const rightSheet = snapshot.scoreSheets.find((entry) => entry.assignmentId === rightAssignmentId)
  if (leftSheet === undefined || rightSheet === undefined) {
    return <EmptyState description="동시 평가표 저장 정보를 찾을 수 없습니다." title="평가표가 없습니다" />
  }

  function createFormProps(
    viewModel: EvaluationScoreFormViewModel,
    sheetId: string,
  ): EvaluationScoreFormProps {
    function commit(
      nextScores: ReadonlyArray<{ itemId: string; score: number | null }>,
      passResult: boolean | null,
    ): boolean {
      return saveDraft(sheetId, nextScores, passResult)
    }

    function currentScores() {
      return viewModel.items.map((item) => ({ itemId: item.id, score: item.value }))
    }

    return {
      viewModel,
      onScoreChange: (itemId, value) => {
        const next = viewModel.items.map((item) => ({
          itemId: item.id,
          score: item.id === itemId ? value : item.value,
        }))
        commit(next, null)
      },
      onScoresChange: (values) => {
        const next = viewModel.items.map((item, index) => ({
          itemId: item.id,
          score: values[index] ?? null,
        }))
        commit(next, null)
      },
      onPassResultChange: (passResult) => commit([], passResult),
      onSave: () => commit(currentScores(), viewModel.passResult),
      onSubmit: () => {
        if (commit(currentScores(), viewModel.passResult) && !viewModel.submitted) submitSheet(sheetId)
      },
      onRequestUnlock: (reason) => requestSheetUnlock(sheetId, reason),
    }
  }

  return (
    <ParallelEvaluationScoreForm
      left={createFormProps(models.left, leftSheet.id)}
      right={createFormProps(models.right, rightSheet.id)}
    />
  )
}
