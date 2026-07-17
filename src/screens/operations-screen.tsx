"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"

import { ErrorState } from "@/components/shared"
import {
  OperationsConsole,
  type OperationsTab,
} from "@/features/operations"
import { useAuth, useEvaluation } from "@/providers"
import { selectOperationsViewModel } from "@/view-models/operations"
import { selectDirectScoreRuleImpact } from "@/view-models/direct-score-rule-impact"

export function OperationsScreen() {
  const { accounts } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const {
    snapshot,
    activeCycleId,
    backendMode,
    createEvaluationCycle,
    updateEvaluationCycle,
    setEvaluationCycleLock,
    deleteEvaluationCycle,
    saveEvaluationTask,
    deleteEvaluationTask,
    updateEvaluatorAssignments,
    updateEngineerTaskWeights,
    updateDirectScore,
    saveScoreAdjustment,
    deleteScoreAdjustment,
    saveLanguageScoreRecord,
    deleteLanguageScoreRecord,
    saveCertificationRecord,
    deleteCertificationRecord,
    verifySourceRecord,
    addEngineers,
    updateEngineer,
    deleteEngineer,
    addEvaluators,
    updateEvaluator,
    deleteEvaluator,
    reopenSheet,
    resetDemoData,
    saveDirectScoreRule,
    deleteDirectScoreRule,
    saveDerivedScoreRule,
    deleteDerivedScoreRule,
  } = useEvaluation()
  const requestedTab = parseOperationsTab(searchParams.get("tab"))
  const urlTab = backendMode === "supabase" && requestedTab === "reset" ? "roster" : requestedTab
  const [pendingTab, setPendingTab] = useState<Readonly<{
    from: OperationsTab
    to: OperationsTab
  }> | null>(null)
  const tab = pendingTab?.from === urlTab ? pendingTab.to : urlTab

  if (snapshot === null) return null

  const model = selectOperationsViewModel(snapshot, activeCycleId)
  if (model === null) {
    return <ErrorState description="선택한 평가 시즌의 운영 데이터를 찾을 수 없습니다." />
  }
  function changeTab(nextTab: OperationsTab) {
    setPendingTab({ from: urlTab, to: nextTab })
    const params = new URLSearchParams(searchParams.toString())
    if (nextTab === "roster") params.delete("tab")
    else params.set("tab", nextTab)
    if (nextTab !== "scores") params.delete("q")
    const query = params.toString()
    router.replace(query.length === 0 ? pathname : `${pathname}?${query}`, {
      scroll: false,
    })
  }

  function changeDirectScore(
    engineerId: string,
    taskId: string,
    score: number | null,
    passResult: boolean | null,
  ) {
    updateDirectScore(engineerId, taskId, score, passResult)
  }

  return (
    <OperationsConsole
      activeTab={tab}
      directScoreQuery={searchParams.get("q") ?? ""}
      linkedEngineerIds={accounts.flatMap((account) =>
        account.engineerId === null ? [] : [account.engineerId])}
      linkedEvaluatorIds={accounts.flatMap((account) =>
        account.evaluatorId === null ? [] : [account.evaluatorId])}
      onAddEngineers={addEngineers}
      onAddEvaluators={addEvaluators}
      onDeleteEvaluator={deleteEvaluator}
      onDeleteEngineer={deleteEngineer}
      onReopenSheet={reopenSheet}
      onUpdateEngineer={updateEngineer}
      onUpdateEvaluator={updateEvaluator}
      onDirectScoreChange={changeDirectScore}
      onSaveScoreAdjustment={saveScoreAdjustment}
      onDeleteScoreAdjustment={deleteScoreAdjustment}
      onSaveLanguageRecord={saveLanguageScoreRecord}
      onDeleteLanguageRecord={deleteLanguageScoreRecord}
      onSaveCertificationRecord={saveCertificationRecord}
      onDeleteCertificationRecord={deleteCertificationRecord}
      onVerifySourceRecord={verifySourceRecord}
      onResetDemoData={resetDemoData}
      onCreateCycle={createEvaluationCycle}
      onUpdateCycle={updateEvaluationCycle}
      onSetCycleLock={setEvaluationCycleLock}
      onDeleteCycle={deleteEvaluationCycle}
      onSaveTask={saveEvaluationTask}
      onDeleteTask={deleteEvaluationTask}
      onUpdateEvaluatorAssignments={updateEvaluatorAssignments}
      onEngineerTaskWeightsChange={updateEngineerTaskWeights}
      onSaveDirectScoreRule={saveDirectScoreRule}
      onDeleteDirectScoreRule={deleteDirectScoreRule}
      onPreviewDirectScoreRule={(rule) => selectDirectScoreRuleImpact(snapshot, activeCycleId, rule)}
      onSaveDerivedScoreRule={saveDerivedScoreRule}
      onDeleteDerivedScoreRule={deleteDerivedScoreRule}
      onTabChange={changeTab}
      showReset={backendMode === "local"}
      viewModel={model}
    />
  )
}

function parseOperationsTab(value: string | null): OperationsTab {
  if (
    value === "season" ||
    value === "tasks" ||
    value === "assignments" ||
    value === "weights" ||
    value === "derived" ||
    value === "scores" ||
    value === "scoreTables" ||
    value === "adjustments" ||
    value === "unlocks" ||
    value === "reset"
  ) {
    return value
  }
  if (value === "cycle") return "season"
  return "roster"
}
