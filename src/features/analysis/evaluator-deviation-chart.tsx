"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from "recharts"

import { ChartContainer, type ChartConfig } from "@/components/ui/chart"

import { AnalysisPanel } from "./analysis-panel"
import { AnalysisTable, type AnalysisTableColumn } from "./analysis-table"
import { formatCount, formatScore } from "./format"
import type { AnalysisChartProps, EvaluatorDeviationDatum } from "./types"

const chartConfig = {
  deviation: {
    label: "평균 절대 편차",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig

const columns: readonly AnalysisTableColumn<EvaluatorDeviationDatum>[] = [
  { key: "evaluator", header: "평가자", render: (row) => row.evaluatorLabel },
  {
    key: "average",
    header: "평균 원점수",
    align: "end",
    render: (row) => formatScore(row.averageScore),
  },
  {
    key: "deviation",
    header: "평균 절대 편차",
    align: "end",
    render: (row) => formatScore(row.meanAbsoluteDeviation),
  },
  {
    key: "sheets",
    header: "제출 평가",
    align: "end",
    render: (row) => formatCount(row.sheetCount, "건"),
  },
]

type EvaluatorDeviationChartProps =
  AnalysisChartProps<EvaluatorDeviationDatum> &
    Readonly<{ domainMax?: number }>

function resolveDomainMax(
  data: readonly EvaluatorDeviationDatum[],
  requestedMax: number
): number {
  const highestDeviation = Math.max(
    0,
    ...data.map((datum) => datum.meanAbsoluteDeviation)
  )
  return Math.max(requestedMax, Math.ceil(highestDeviation / 5) * 5)
}

function taskGroups(data: readonly EvaluatorDeviationDatum[]) {
  const groups = new Map<string, { label: string; rows: EvaluatorDeviationDatum[] }>()
  for (const datum of data) {
    const group = groups.get(datum.taskId)
    if (group === undefined) {
      groups.set(datum.taskId, { label: datum.taskLabel, rows: [datum] })
    } else {
      group.rows.push(datum)
    }
  }
  return Array.from(groups, ([taskId, group]) => ({ taskId, ...group }))
}

function EvaluatorTaskDeviationChart({
  domainMax,
  rows,
  taskLabel,
}: Readonly<{
  domainMax: number
  rows: readonly EvaluatorDeviationDatum[]
  taskLabel: string
}>) {
  const resolvedDomainMax = resolveDomainMax(rows, domainMax)
  const chartData = rows.map((datum) => ({
    ...datum,
    displayDeviation: formatScore(datum.meanAbsoluteDeviation),
  }))
  const allZero = rows.every((datum) => datum.meanAbsoluteDeviation === 0)

  return (
    <section className="border-t border-border-subtle pt-4 first:border-t-0 first:pt-0">
      <h3 className="text-sm font-semibold text-foreground">{taskLabel}</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        축 범위 0~{resolvedDomainMax}점 · 동일 과제 전체 평균 기준
      </p>
      {allZero ? (
        <div className="mt-3 flex min-h-72 items-center justify-center rounded-md bg-muted px-5 text-center">
          <div>
            <p className="numeric text-lg font-semibold text-foreground">모든 평가자 편차 0.0점</p>
            <p className="mt-1 text-sm text-muted-foreground">
              이 과제에서 평가자 간 평균 절대 편차가 없습니다.
            </p>
          </div>
        </div>
      ) : (
        <ChartContainer
          config={chartConfig}
          className="mt-3 h-72 w-full aspect-auto"
          role="img"
          aria-label={`${taskLabel} 평가자별 평균 절대 점수 편차 막대 차트`}
        >
          <BarChart
            accessibilityLayer
            data={chartData}
            layout="vertical"
            margin={{ top: 8, right: 60, bottom: 8, left: 8 }}
          >
            <CartesianGrid horizontal={false} strokeDasharray="3 3" />
            <XAxis
              type="number"
              domain={[0, resolvedDomainMax]}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="evaluatorLabel"
              width={72}
              tickLine={false}
              axisLine={false}
            />
            <Bar
              dataKey="meanAbsoluteDeviation"
              name="deviation"
              fill="var(--color-deviation)"
              isAnimationActive={false}
              radius={3}
            >
              <LabelList
                dataKey="displayDeviation"
                position="right"
                fill="var(--foreground)"
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      )}
      <AnalysisTable
        caption={`${taskLabel} 평가자별 평균 원점수, 평균 절대 편차, 제출 평가 수`}
        rows={rows}
        columns={columns}
        getRowKey={(row) => `${row.taskId}:${row.evaluatorId}`}
      />
    </section>
  )
}

export function EvaluatorDeviationChart({
  data,
  domainMax = 20,
  isLoading = false,
}: EvaluatorDeviationChartProps) {
  const groups = taskGroups(data)

  return (
    <AnalysisPanel
      title="평가자 간 점수 편차"
      description="평가자 원점수와 동일 과제 전체 평균 간 절대 차이의 평균입니다."
      isLoading={isLoading}
      isEmpty={data.length === 0}
    >
      <div className="space-y-6">
        {groups.map((group) => (
          <EvaluatorTaskDeviationChart
            key={group.taskId}
            domainMax={domainMax}
            rows={group.rows}
            taskLabel={group.label}
          />
        ))}
      </div>
    </AnalysisPanel>
  )
}
