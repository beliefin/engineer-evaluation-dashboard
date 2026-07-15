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

export function EvaluatorDeviationChart({
  data,
  domainMax = 20,
  isLoading = false,
}: EvaluatorDeviationChartProps) {
  const resolvedDomainMax = resolveDomainMax(data, domainMax)
  const chartData = data.map((datum) => ({
    ...datum,
    displayDeviation: formatScore(datum.meanAbsoluteDeviation),
  }))
  const allZero = data.length > 0 && data.every((datum) => datum.meanAbsoluteDeviation === 0)

  return (
    <AnalysisPanel
      title="평가자 간 점수 편차"
      description={`평가자 원점수와 동일 분야 전체 평균 간 절대 차이의 평균입니다. 축 범위는 0~${resolvedDomainMax}점입니다.`}
      isLoading={isLoading}
      isEmpty={data.length === 0}
    >
      {allZero ? (
        <div className="flex min-h-72 items-center justify-center rounded-md bg-muted px-5 text-center">
          <div>
            <p className="numeric text-lg font-semibold text-foreground">모든 평가자 편차 0.0점</p>
            <p className="mt-1 text-sm text-muted-foreground">
              현재 필터에서 평가자 간 평균 절대 편차가 없습니다.
            </p>
          </div>
        </div>
      ) : (
        <ChartContainer
          config={chartConfig}
          className="h-72 w-full aspect-auto"
          role="img"
          aria-label="평가자별 평균 절대 점수 편차 막대 차트"
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
        caption="평가자별 평균 원점수, 평균 절대 편차, 제출 평가 수"
        rows={data}
        columns={columns}
        getRowKey={(row) => row.evaluatorId}
      />
    </AnalysisPanel>
  )
}
