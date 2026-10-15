"use client"

import { PrinterIcon } from "lucide-react"

import { ErrorState } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { SeasonExportPanel } from "@/features/reports/season-export-panel"
import "@/features/reports/report-signal.css"
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
    <article className="season-report signal-report">
      <header className="signal-report-header">
        <div>
          <h1>{cycle.name} 운영 결과 보고서</h1>
          <p className="signal-report-period"><strong>평가 기간</strong> {cycle.startsAt} ~ {cycle.endsAt}</p>
          <p className="signal-report-generated">출력 {generatedAt}</p>
        </div>
        <Button className="signal-report-print print:hidden" onClick={() => window.print()} type="button" variant="outline">
          <PrinterIcon aria-hidden="true" />문서 인쇄 / PDF 저장
        </Button>
      </header>

      <SeasonExportPanel cycleId={activeCycleId} snapshot={snapshot} />

      <section aria-labelledby="report-summary-title" className="signal-report-section">
        <h2 className="signal-report-bar" id="report-summary-title">운영 요약</h2>
        <dl className="signal-report-metrics">
          {model.metrics.map((metric) => (
            <div key={metric.id}>
              <dt>{metric.label}</dt>
              <dd className="numeric signal-report-metric-value">{metric.value}{metric.unit}</dd>
              <dd className="signal-report-metric-description">{metric.description}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="report-task-title" className="signal-report-section">
        <h2 className="signal-report-bar" id="report-task-title">과제별 확정 평균</h2>
        {model.categoryAverages.length === 0 ? (
          <p className="signal-report-empty">확정된 과제 점수가 없습니다.</p>
        ) : (
          <table className="signal-report-table signal-report-averages">
            <caption className="sr-only">과제별 가중 평균, 비가중 평균과 완료 표본</caption>
            <thead>
              <tr><th scope="col">과제</th><th scope="col">가중 평균</th><th scope="col">비가중 평균</th><th scope="col">완료 표본</th></tr>
            </thead>
            <tbody>
              {model.categoryAverages.map((task) => (
                <tr key={task.id}>
                  <th scope="row">{task.label}</th>
                  <td className="numeric">{task.weightedScore.toFixed(1)}</td>
                  <td className="numeric">{task.unweightedScore.toFixed(1)}</td>
                  <td className="numeric">{task.sampleSize}명</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section aria-labelledby="report-ranking-title" className="signal-report-section signal-report-ranking">
        <div className="signal-report-bar signal-report-ranking-bar">
          <h2 id="report-ranking-title">완료자 최종 순위</h2>
          <p className="numeric">{completedRankingRows.length}명</p>
        </div>
        <p className="signal-report-ranking-note">개인별 적용 과제 가중치 100%와 필수 입력이 모두 확정된 대상만 포함합니다.</p>
        {completedRankingRows.length === 0 ? (
          <p className="signal-report-empty">공식 순위에 포함된 대상이 없습니다.</p>
        ) : (
          <table className="signal-report-table signal-report-ranking-table">
            <caption className="sr-only">완료자 {completedRankingRows.length}명의 최종 순위</caption>
            <thead>
              <tr><th scope="col">순위</th><th scope="col">이름</th><th scope="col">팀</th><th scope="col">최종 점수</th></tr>
            </thead>
            <tbody>
              {completedRankingRows.map((row) => (
                <tr key={row.id}>
                  <td className="numeric">{row.rank}</td>
                  <th scope="row">{row.name}</th>
                  <td>{row.team}</td>
                  <td className="numeric">{row.totalScore.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </article>
  )
}
