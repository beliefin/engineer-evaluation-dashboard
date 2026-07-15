"use client"

import { PageHeader } from "@/components/shared"
import { PendingEvaluationPanel } from "@/features/pending"
import { useEvaluation } from "@/providers"
import { selectPendingEvaluations } from "@/view-models/pending"

export function PendingScreen() {
  const { snapshot, activeCycleId, role } = useEvaluation()
  if (snapshot === null) return null

  const selection = selectPendingEvaluations(snapshot, activeCycleId)
  const { metrics } = selection
  const unevaluatedCount =
    metrics.byStatus.unassigned +
    metrics.byStatus.not_started +
    metrics.byStatus.in_progress

  return (
    <div className="space-y-6">
      <PageHeader
        context="평가 운영 · 샘플 데이터"
        description={"평가자 미배정, 미제출, 직접점수 누락을 구분해 후속\u00A0작업을 찾습니다."}
        title="미평가 현황"
      />
      <section
        aria-label="미평가 요약"
        className="grid grid-cols-2 overflow-hidden rounded-lg border border-border bg-card xl:grid-cols-4"
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
    <div className="border-b border-border-subtle px-5 py-4 odd:border-r [&:nth-child(n+3)]:border-b-0 xl:border-r xl:border-b-0 xl:last:border-r-0">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={`numeric mt-1 text-2xl font-bold ${toneClass}`}>
        {value}
        <span className="ml-1 text-sm font-medium text-muted-foreground">{unit}</span>
      </p>
    </div>
  )
}
