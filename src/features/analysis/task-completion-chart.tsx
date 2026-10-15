"use client"

import { HorizontalScroll } from "@/components/ui/horizontal-scroll"

import { AnalysisPanel } from "./analysis-panel"
import { AnalysisTable, type AnalysisTableColumn } from "./analysis-table"
import { formatCount } from "./format"
import type { AnalysisChartProps, TaskCompletionDatum } from "./types"

import "./analysis-summary-signal.css"

const AXIS_TICKS = [0, 20, 40, 60, 80, 100] as const

const columns: readonly AnalysisTableColumn<TaskCompletionDatum>[] = [
  { key: "task", header: "과제", render: (row) => row.taskLabel },
  {
    key: "rate",
    header: "완료율",
    align: "end",
    render: (row) => `${row.completionRate.toFixed(1)}%`,
  },
  {
    key: "count",
    header: "완료/대상",
    align: "end",
    render: (row) => `${formatCount(row.completedCount, "명")} / ${formatCount(row.eligibleCount, "명")}`,
  },
]

export function TaskCompletionChart({
  data,
  isLoading = false,
}: AnalysisChartProps<TaskCompletionDatum>) {
  const chartData = data.map((datum) => ({
    ...datum,
    displayRate: `${datum.completionRate.toFixed(1)}% · ${datum.completedCount}/${datum.eligibleCount}명`,
  }))
  const sortedData = chartData.toSorted((left, right) => left.completionRate - right.completionRate)

  return (
    <div className="signal-analysis-panel signal-analysis-completion">
      <AnalysisPanel
        title="과제별 완료율 병목"
        description="현재 필터 대상자의 과제 점수 확정 비율과 저완료 과제의 입력·제출 병목 점검"
        isLoading={isLoading}
        isEmpty={data.length === 0}
      >
        <HorizontalScroll className="signal-analysis-scroll" role="region" aria-label="과제별 완료율 가로 스크롤 영역" tabIndex={0}>
          <div className="signal-analysis-completion-rows">
            <div className="signal-analysis-completion-axis-row" aria-hidden="true">
              <span>과제</span>
              <div className="signal-analysis-completion-axis numeric">
                {AXIS_TICKS.map((tick) => <span key={tick} style={{ left: `${tick}%` }}>{tick}%</span>)}
              </div>
              <span>완료율</span>
              <span>완료/대상</span>
            </div>
            {sortedData.map((datum) => (
              <div
                key={datum.taskId}
                className="signal-analysis-completion-row"
                data-completion-id={datum.taskId}
                role="img"
                aria-label={`${datum.taskLabel}: ${datum.displayRate}`}
              >
                <span className="signal-analysis-completion-name">{datum.taskLabel}</span>
                <div className="signal-analysis-completion-track" aria-hidden="true">
                  <span className="signal-analysis-completion-bar" style={{ width: `${datum.completionRate}%` }} />
                </div>
                <span className="numeric">{datum.completionRate.toFixed(1)}%</span>
                <span className="numeric">{datum.completedCount}/{datum.eligibleCount}명</span>
              </div>
            ))}
          </div>
        </HorizontalScroll>
        <AnalysisTable
          caption="과제별 완료율과 완료 및 대상 인원"
          rows={data}
          columns={columns}
          getRowKey={(row) => row.taskId}
        />
      </AnalysisPanel>
    </div>
  )
}
