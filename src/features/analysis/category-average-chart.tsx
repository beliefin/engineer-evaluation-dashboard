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
import type { AnalysisChartProps, CategoryAverageDatum } from "./types"

const chartConfig = {
  score: {
    label: "평균 점수",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

const columns: readonly AnalysisTableColumn<CategoryAverageDatum>[] = [
  { key: "category", header: "평가 분야", render: (row) => row.label },
  {
    key: "score",
    header: "평균 점수",
    align: "end",
    render: (row) => formatScore(row.score),
  },
  {
    key: "count",
    header: "확정 인원",
    align: "end",
    render: (row) => formatCount(row.completedCount, "명"),
  },
]

export function CategoryAverageChart({
  data,
  isLoading = false,
}: AnalysisChartProps<CategoryAverageDatum>) {
  const chartData = data.map((datum) => ({
    ...datum,
    displayScore: formatScore(datum.score),
  }))

  return (
    <AnalysisPanel
      title="분야별 평균"
      description="확정 점수의 분야별 평균입니다. 모든 축은 0~100점입니다."
      isLoading={isLoading}
      isEmpty={data.length === 0}
    >
      <ChartContainer
        config={chartConfig}
        className="h-72 w-full aspect-auto"
        role="img"
        aria-label="평가 분야별 평균 점수 막대 차트"
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
            domain={[0, 100]}
            ticks={[0, 20, 40, 60, 80, 100]}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={104}
            tickLine={false}
            axisLine={false}
          />
          <Bar
            dataKey="score"
            fill="var(--color-score)"
            isAnimationActive={false}
            radius={3}
          >
            <LabelList
              dataKey="displayScore"
              position="right"
              fill="var(--foreground)"
              fontSize={12}
            />
          </Bar>
        </BarChart>
      </ChartContainer>
      <AnalysisTable
        caption="평가 분야별 평균 점수와 확정 인원"
        rows={data}
        columns={columns}
        getRowKey={(row) => row.key}
      />
    </AnalysisPanel>
  )
}
