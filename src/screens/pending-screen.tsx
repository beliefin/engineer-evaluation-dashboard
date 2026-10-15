"use client"

import { PageHeader } from "@/components/shared"
import { PendingEvaluationPanel } from "@/features/pending"
import { useEvaluation } from "@/providers"
import { selectPendingEvaluations } from "@/view-models/pending"

import "@/features/pending/pending-signal.css"

export function PendingScreen() {
  const { snapshot, activeCycleId, backendMode, role } = useEvaluation()
  if (snapshot === null) return null

  const selection = selectPendingEvaluations(snapshot, activeCycleId)
  const { metrics } = selection
  const unevaluatedCount =
    metrics.byStatus.unassigned +
    metrics.byStatus.not_started +
    metrics.byStatus.in_progress

  return (
    <div className="signal-pending-screen">
      <PageHeader
        className="signal-pending-page-heading"
        context={`평가 운영 · ${backendMode === "supabase" ? "운영 데이터" : "샘플 데이터"}`}
        description={"평가자 미배정·미제출·직접점수 누락 구분과 후속\u00A0작업 안내"}
        title="미평가 현황"
      />
      <section
        aria-label="미평가 요약"
        className="signal-pending-metrics"
      >
        <PendingMetric label="전체 대상" unit="명" value={metrics.totalEngineers} />
        <PendingMetric label="평가 미완료" tone="danger" unit="명" value={unevaluatedCount} />
        <PendingMetric
          label="직접점수 대기"
          tone="warning"
          unit="명"
          value={metrics.byStatus.direct_scores_pending}
        />
        <PendingMetric label="최종 완료" tone="success" unit="명" value={metrics.completedEngineers} />
      </section>
      <PendingEvaluationPanel role={role} rows={selection.rows} />
    </div>
  )
}

function PendingMetric({
  label,
  value,
  unit,
  tone = "neutral",
}: Readonly<{
  label: string
  value: number
  unit: string
  tone?: "neutral" | "success" | "warning" | "danger"
}>) {
  const toneClass = {
    neutral: "text-foreground",
    success: "text-success",
    warning: "text-warning",
    danger: "text-destructive",
  }[tone]

  return (
    <div className="signal-pending-metric" data-tone={tone}>
      <p className="signal-pending-metric-label">{label}</p>
      <p className={`signal-pending-metric-value numeric ${toneClass}`}>
        {value}
        <span>{unit}</span>
      </p>
    </div>
  )
}
