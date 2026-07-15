"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"

import { ErrorState } from "@/components/shared"
import {
  OperationsConsole,
  type OperationsTab,
} from "@/features/operations"
import { useEvaluation } from "@/providers"
import { selectOperationsViewModel } from "@/view-models/operations"

export function OperationsScreen() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const {
    snapshot,
    activeCycleId,
    backendMode,
    createEvaluationCycle,
    saveEvaluationTask,
    deleteEvaluationTask,
    updateEngineerTaskWeights,
    updateDirectScore,
    saveLanguageScoreRecord,
    deleteLanguageScoreRecord,
    saveCertificationRecord,
    deleteCertificationRecord,
    verifySourceRecord,
    addEngineers,
    addEvaluators,
    resetDemoData,
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
      onAddEngineers={addEngineers}
      onAddEvaluators={addEvaluators}
      onDirectScoreChange={changeDirectScore}
      onSaveLanguageRecord={saveLanguageScoreRecord}
      onDeleteLanguageRecord={deleteLanguageScoreRecord}
      onSaveCertificationRecord={saveCertificationRecord}
      onDeleteCertificationRecord={deleteCertificationRecord}
      onVerifySourceRecord={verifySourceRecord}
      onResetDemoData={resetDemoData}
      onCreateCycle={createEvaluationCycle}
      onSaveTask={saveEvaluationTask}
      onDeleteTask={deleteEvaluationTask}
      onEngineerTaskWeightsChange={updateEngineerTaskWeights}
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
    value === "weights" ||
    value === "scores" ||
    value === "reset"
  ) {
    return value
  }
  if (value === "cycle") return "season"
  return "roster"
}
