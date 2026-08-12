"use client"

import { ErrorState } from "@/components/shared"
import { SeasonOverview } from "@/features/season-overview"
import { useEvaluation } from "@/providers"
import { selectSeasonOverview } from "@/view-models/season-overview"

export function SeasonOverviewScreen() {
  const { activeCycleId, backendMode, snapshot } = useEvaluation()
  if (snapshot === null) return null
  const model = selectSeasonOverview(snapshot, activeCycleId)
  if (model === null) {
    return <ErrorState description="선택한 평가 시즌의 안내 데이터를 찾을 수 없습니다." />
  }
  return <SeasonOverview backendMode={backendMode} model={model} />
}
