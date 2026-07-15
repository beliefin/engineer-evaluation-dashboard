"use client"

import { useMemo } from "react"

import { AccessDenied, EmptyState } from "@/components/shared"
import {
  EvaluationScoreForm,
  type AutosaveStatus,
} from "@/features/evaluations"
import { useEvaluation } from "@/providers"
import { selectEvaluationScoreForm } from "@/view-models/evaluations"

function mapSaveState(state: string): AutosaveStatus {
  if (state === "saving" || state === "saved" || state === "error") return state
  return "idle"
}

export function EvaluationFormScreen({ assignmentId }: Readonly<{ assignmentId: string }>) {
  const {
    snapshot,
    activeEvaluatorId,
    role,
    saveState,
    saveDraft,
    submitSheet,
  } = useEvaluation()
  const sourceModel = useMemo(
    () =>
      snapshot === null
        ? null
        : selectEvaluationScoreForm(snapshot, assignmentId, {
            autosaveStatus: mapSaveState(saveState),
            proxyEntry: role === "operator",
          }),
    [assignmentId, role, saveState, snapshot],
  )
  if (snapshot === null) return null
  const assignment = snapshot.assignments.find((entry) => entry.id === assignmentId)
  if (assignment === undefined || sourceModel === null) {
    return (
      <EmptyState
        description="요청한 샘플 평가 배정을 찾을 수 없습니다."
        title="평가 배정이 없습니다"
      />
    )
  }
  if (role === "evaluator" && assignment.evaluatorId !== activeEvaluatorId) {
    return <AccessDenied allowedRoles={["operator"]} currentRole={role} />
  }
  const sheet = snapshot.scoreSheets.find((entry) => entry.assignmentId === assignmentId)
  if (sheet === undefined) {
    return <EmptyState description="평가표 저장 정보를 찾을 수 없습니다." title="평가표가 없습니다" />
  }
  const sheetId = sheet.id
  const viewModel = sourceModel

  function commit(
    nextScores: ReadonlyArray<{ itemId: string; score: number | null }>,
    passResult: boolean | null,
  ): boolean {
    return saveDraft(sheetId, nextScores, passResult)
  }

  function handleScoreChange(itemId: string, value: number | null) {
    const next = viewModel.items.map((item) => ({
      itemId: item.id,
      score: item.id === itemId ? value : item.value,
    }))
    commit(next, null)
  }

  function handlePassResultChange(passResult: boolean | null) {
    commit([], passResult)
  }

  function handleSubmit() {
    const current = viewModel.items.map((item) => ({ itemId: item.id, score: item.value }))
    if (commit(current, viewModel.passResult)) submitSheet(sheetId)
  }

  return (
    <EvaluationScoreForm
      onSave={() => commit(
        viewModel.items.map((item) => ({ itemId: item.id, score: item.value })),
        viewModel.passResult,
      )}
      onPassResultChange={handlePassResultChange}
      onScoreChange={handleScoreChange}
      onSubmit={handleSubmit}
      viewModel={viewModel}
    />
  )
}
