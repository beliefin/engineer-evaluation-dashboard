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
import type { AnalysisChartProps, RubricItemAverageDatum } from "./types"

const chartConfig = {
  score: {
    label: "문항 평균",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

const columns: readonly AnalysisTableColumn<RubricItemAverageDatum>[] = [
  { key: "item", header: "평가 항목", render: (row) => row.label },
  {
    key: "score",
    header: "100점 환산 평균",
    align: "end",
    render: (row) => formatScore(row.score),
  },
  {
    key: "responses",
    header: "응답 수",
    align: "end",
    render: (row) => formatCount(row.responseCount, "건"),
  },
]

export function RubricItemChart({
  data,
  isLoading = false,
}: AnalysisChartProps<RubricItemAverageDatum>) {
  const chartData = data.map((datum) => ({
    ...datum,
    shortLabel: `${datum.itemNumber}번`,
    displayScore: formatScore(datum.score),
  }))
  const chartWidth = Math.max(640, data.length * 52)

  return (
    <AnalysisPanel
      title="평가 항목별 평균"
      description="0~10점 문항 평균을 100점 기준으로 환산해 비교합니다."
      isLoading={isLoading}
      isEmpty={data.length === 0}
    >
      {data.length > 12 ? (
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          ↔ 좌우로 스크롤해 모든 평가 항목 보기
        </p>
      ) : null}
      <div
        className="scrollbar-thin overflow-x-auto pb-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        role="region"
        aria-label="평가 항목별 평균 가로 스크롤 영역"
        tabIndex={0}
      >
        <ChartContainer
          config={chartConfig}
          className="h-72 max-w-none aspect-auto"
          style={{ width: chartWidth }}
          role="img"
          aria-label="평가 항목별 환산 평균 점수 막대 차트"
        >
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{ top: 24, right: 8, bottom: 4, left: 0 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="shortLabel"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 20, 40, 60, 80, 100]}
              tickLine={false}
              axisLine={false}
              width={32}
            />
            <Bar
              dataKey="score"
              fill="var(--color-score)"
              isAnimationActive={false}
              radius={3}
            >
              <LabelList
                dataKey="displayScore"
                position="top"
                fill="var(--foreground)"
                fontSize={11}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </div>
      <AnalysisTable
        caption="평가 항목별 환산 평균 점수와 응답 수"
        rows={data}
        columns={columns}
        getRowKey={(row) => String(row.itemNumber)}
      />
    </AnalysisPanel>
  )
}
