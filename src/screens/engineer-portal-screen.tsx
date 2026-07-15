"use client"

import { EmptyState } from "@/components/shared"
import { EngineerPortal } from "@/features/engineer-portal"
import { useAuth, useEvaluation } from "@/providers"
import { selectEngineerPortal } from "@/view-models/engineer-portal"

export function EngineerPortalScreen() {
  const { session } = useAuth()
  const {
    snapshot,
    activeCycleId,
    saveState,
    saveLanguageScoreRecord,
    deleteLanguageScoreRecord,
    saveCertificationRecord,
    deleteCertificationRecord,
  } = useEvaluation()

  if (session === null || snapshot === null) return null
  if (session.engineerId === null) {
    return (
      <EmptyState
        description="운영자에게 등록된 엔지니어 명단과 계정 연결을 요청해 주세요."
        title="연결된 엔지니어 정보가 없습니다"
      />
    )
  }

  const model = selectEngineerPortal(snapshot, activeCycleId, session.engineerId)
  if (model === null) {
    return (
      <EmptyState
        description="현재 평가 시즌에서 본인 평가 정보를 찾을 수 없습니다."
        title="내 평가 정보가 없습니다"
      />
    )
  }

  return (
    <EngineerPortal
      disabled={saveState === "saving"}
      model={model}
      onDeleteCertificationRecord={deleteCertificationRecord}
      onDeleteLanguageRecord={deleteLanguageScoreRecord}
      onSaveCertificationRecord={saveCertificationRecord}
      onSaveLanguageRecord={saveLanguageScoreRecord}
    />
  )
}
