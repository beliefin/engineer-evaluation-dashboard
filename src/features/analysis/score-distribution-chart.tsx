import { AnalysisPanel } from "./analysis-panel"
import { AnalysisTable, type AnalysisTableColumn } from "./analysis-table"
import { formatCount, formatDecimal, formatScore } from "./format"
import type { AnalysisChartProps, ScoreDistributionDatum } from "./types"

const AXIS_TICKS = [0, 25, 50, 75, 100] as const

const columns: readonly AnalysisTableColumn<ScoreDistributionDatum>[] = [
  { key: "task", header: "과제", render: (row) => row.taskLabel },
  { key: "minimum", header: "최소", align: "end", render: (row) => formatScore(row.minimum) },
  { key: "q1", header: "1사분위", align: "end", render: (row) => formatScore(row.firstQuartile) },
  { key: "median", header: "중앙값", align: "end", render: (row) => formatScore(row.median) },
  { key: "q3", header: "3사분위", align: "end", render: (row) => formatScore(row.thirdQuartile) },
  { key: "maximum", header: "최대", align: "end", render: (row) => formatScore(row.maximum) },
  {
    key: "count",
    header: "확정 인원",
    align: "end",
    render: (row) => formatCount(row.completedCount, "명"),
  },
]

function DistributionMark({ datum }: Readonly<{ datum: ScoreDistributionDatum }>) {
  const summary = `${datum.taskLabel}: 최소 ${formatScore(datum.minimum)}, 1사분위 ${formatScore(datum.firstQuartile)}, 중앙값 ${formatScore(datum.median)}, 3사분위 ${formatScore(datum.thirdQuartile)}, 최대 ${formatScore(datum.maximum)}`

  return (
    <div className="grid min-w-0 gap-2 border-b border-border-subtle py-4 last:border-b-0 sm:grid-cols-[minmax(9rem,0.7fr)_minmax(15rem,1.3fr)] sm:gap-5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{datum.taskLabel}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          중앙값 {formatScore(datum.median)} · {formatCount(datum.completedCount, "명")}
        </p>
      </div>
      <div role="img" aria-label={summary} className="min-w-0">
        <svg
          aria-hidden="true"
          className="h-7 w-full overflow-visible"
          preserveAspectRatio="none"
          viewBox="0 0 100 28"
        >
          {AXIS_TICKS.map((tick) => (
            <line
              key={tick}
              x1={tick}
              x2={tick}
              y1="2"
              y2="26"
              stroke="var(--border-subtle)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          <line
            x1={datum.minimum}
            x2={datum.maximum}
            y1="14"
            y2="14"
            stroke="var(--chart-3)"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
          <line
            x1={datum.firstQuartile}
            x2={datum.thirdQuartile}
            y1="14"
            y2="14"
            stroke="var(--chart-2)"
            strokeLinecap="round"
            strokeWidth="8"
            vectorEffect="non-scaling-stroke"
          />
          {[datum.minimum, datum.maximum].map((value, index) => (
            <line
              key={`${datum.taskId}-end-${index}`}
              x1={value}
              x2={value}
              y1="9"
              y2="19"
              stroke="var(--chart-3)"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          <line
            x1={datum.median}
            x2={datum.median}
            y1="7"
            y2="21"
            stroke="var(--foreground)"
            strokeWidth="2.5"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <div aria-hidden="true" className="numeric flex justify-between text-xs text-muted-foreground">
          {AXIS_TICKS.map((tick) => <span key={tick}>{tick}</span>)}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          전체 {formatDecimal(datum.minimum)}–{formatDecimal(datum.maximum)}점 · 중앙 50% {formatDecimal(datum.firstQuartile)}–{formatDecimal(datum.thirdQuartile)}점
        </p>
      </div>
    </div>
  )
}

export function ScoreDistributionChart({
  data,
  isLoading = false,
}: AnalysisChartProps<ScoreDistributionDatum>) {
  return (
    <AnalysisPanel
      title="과제별 점수 분포와 변별 폭"
      description="평균에 가려지는 분산을 최소·사분위·중앙값·최대로 확인합니다. 사분위는 선형 보간값입니다."
      isLoading={isLoading}
      isEmpty={data.length === 0}
    >
      <div>{data.map((datum) => <DistributionMark key={datum.taskId} datum={datum} />)}</div>
      <AnalysisTable
        caption="과제별 최소, 사분위, 중앙값, 최대 점수와 확정 인원"
        rows={data}
        columns={columns}
        getRowKey={(row) => row.taskId}
      />
    </AnalysisPanel>
  )
}
