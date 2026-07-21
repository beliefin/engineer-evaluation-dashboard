"use client"

import { PrinterIcon } from "lucide-react"

import { ErrorState } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { SeasonExportPanel } from "@/features/reports/season-export-panel"
import { useEvaluation } from "@/providers"
import { selectDashboardViewModel } from "@/view-models/dashboard"

export function SeasonReportScreen() {
  const { snapshot, activeCycleId } = useEvaluation()
  if (snapshot === null) return null
  const cycle = snapshot.cycles.find((entry) => entry.id === activeCycleId)
  const model = selectDashboardViewModel(snapshot, activeCycleId)
  if (cycle === undefined || model === null) {
    return <ErrorState description="선택한 평가 시즌의 보고서 데이터를 찾을 수 없습니다." />
  }
  const completedRankingRows = model.rankingRows.filter(
    (row): row is typeof row & Readonly<{ rank: number; totalScore: number }> =>
      row.status === "confirmed" && row.rank !== null && row.totalScore !== null,
  )
  const generatedAt = new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date())

  return (
    <article className="season-report space-y-7 bg-white text-foreground print:space-y-5">
      <header className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">엔지니어 역량평가</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">{cycle.name} 운영 결과 보고서</h1>
          <p className="mt-2 text-sm text-muted-foreground">평가 기간 {cycle.startsAt} ~ {cycle.endsAt} · 출력 {generatedAt}</p>
        </div>
        <Button className="print:hidden" onClick={() => window.print()} type="button">
          <PrinterIcon aria-hidden="true" />문서 인쇄 / PDF 저장
        </Button>
      </header>

      <SeasonExportPanel cycleId={activeCycleId} snapshot={snapshot} />

      <section aria-labelledby="report-summary-title">
        <h2 className="text-lg font-semibold" id="report-summary-title">운영 요약</h2>
        <div className="mt-3 grid overflow-hidden rounded-md border sm:grid-cols-4">
          {model.metrics.map((metric) => (
            <div className="border-b p-4 last:border-b-0 sm:border-r sm:border-b-0 sm:last:border-r-0" key={metric.id}>
              <p className="text-xs font-medium text-muted-foreground">{metric.label}</p>
              <p className="numeric mt-1 text-2xl font-bold">{metric.value}{metric.unit}</p>
              <p className="mt-1 text-xs text-muted-foreground">{metric.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="report-task-title">
        <h2 className="text-lg font-semibold" id="report-task-title">과제별 확정 평균</h2>
        {model.categoryAverages.length === 0 ? (
          <p className="mt-3 rounded-md border border-dashed p-4 text-sm text-muted-foreground">확정된 과제 점수가 없습니다.</p>
        ) : (
          <table className="mt-3 w-full border-collapse text-sm">
            <thead><tr className="border-y bg-muted/40"><th className="px-3 py-2 text-left">과제</th><th className="px-3 py-2 text-right">가중 평균</th><th className="px-3 py-2 text-right">비가중 평균</th><th className="px-3 py-2 text-right">완료 표본</th></tr></thead>
            <tbody>{model.categoryAverages.map((task) => <tr className="border-b" key={task.id}><td className="px-3 py-2">{task.label}</td><td className="numeric px-3 py-2 text-right font-semibold">{task.weightedScore.toFixed(1)}</td><td className="numeric px-3 py-2 text-right">{task.unweightedScore.toFixed(1)}</td><td className="numeric px-3 py-2 text-right">{task.sampleSize}명</td></tr>)}</tbody>
          </table>
        )}
      </section>

      <section aria-labelledby="report-ranking-title">
        <div className="flex items-end justify-between gap-3"><div><h2 className="text-lg font-semibold" id="report-ranking-title">완료자 최종 순위</h2><p className="mt-1 text-xs text-muted-foreground">개인별 적용 과제 가중치 100%와 필수 입력이 모두 확정된 대상만 포함합니다.</p></div><p className="numeric shrink-0 whitespace-nowrap text-sm font-semibold">{completedRankingRows.length}명</p></div>
        {completedRankingRows.length === 0 ? (
          <p className="mt-3 rounded-md border border-dashed p-4 text-sm text-muted-foreground">공식 순위에 포함된 대상이 없습니다.</p>
        ) : (
          <table className="mt-3 w-full border-collapse text-sm">
            <thead><tr className="border-y bg-muted/40"><th className="px-3 py-2 text-left">순위</th><th className="px-3 py-2 text-left">이름</th><th className="px-3 py-2 text-left">팀</th><th className="px-3 py-2 text-right">최종 점수</th></tr></thead>
            <tbody>{completedRankingRows.map((row) => <tr className="border-b break-inside-avoid" key={row.id}><td className="numeric px-3 py-2 font-semibold">{row.rank}</td><td className="px-3 py-2">{row.name}</td><td className="px-3 py-2">{row.team}</td><td className="numeric px-3 py-2 text-right font-semibold">{row.totalScore.toFixed(2)}</td></tr>)}</tbody>
          </table>
        )}
      </section>
    </article>
  )
}
