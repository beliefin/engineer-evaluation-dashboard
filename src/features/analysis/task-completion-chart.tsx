"use client"

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts"

import { ChartContainer, type ChartConfig } from "@/components/ui/chart"
import { useIsMobile } from "@/hooks/use-mobile"

import { AnalysisPanel } from "./analysis-panel"
import { AnalysisTable, type AnalysisTableColumn } from "./analysis-table"
import { formatCount } from "./format"
import type { AnalysisChartProps, TaskCompletionDatum } from "./types"

const chartConfig = {
  completionRate: {
    label: "완료율",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig

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
  const isMobile = useIsMobile()
  const chartData = data.map((datum) => ({
    ...datum,
    displayRate: `${datum.completionRate.toFixed(1)}% · ${datum.completedCount}/${datum.eligibleCount}명`,
  }))
  const sortedData = chartData.toSorted((left, right) => left.completionRate - right.completionRate)
  const chartHeight = Math.max(288, data.length * 44 + 56)

  return (
    <AnalysisPanel
      title="과제별 완료율 병목"
      description="현재 필터 대상자 중 과제 점수가 확정된 비율입니다. 완료율이 낮은 과제부터 입력·제출 병목을 점검합니다."
      isLoading={isLoading}
      isEmpty={data.length === 0}
    >
      {isMobile ? (
        <div
          className="space-y-4"
          role="img"
          aria-label="과제별 완료율과 완료 인원 가로 막대 목록"
        >
          {sortedData.map((datum) => (
            <div key={datum.taskId}>
              <div className="flex items-baseline justify-between gap-3 text-xs">
                <span className="min-w-0 font-medium text-foreground">{datum.taskLabel}</span>
                <span className="numeric shrink-0 text-muted-foreground">{datum.displayRate}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-sm bg-muted">
                <div
                  className="h-full rounded-sm bg-[var(--chart-4)]"
                  style={{ width: `${datum.completionRate}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <ChartContainer
          config={chartConfig}
          className="w-full aspect-auto"
          style={{ height: chartHeight }}
          role="img"
          aria-label="과제별 완료율과 완료 인원 가로 막대 차트"
        >
          <BarChart
            accessibilityLayer
            data={sortedData}
            layout="vertical"
            margin={{ top: 8, right: 108, bottom: 8, left: 8 }}
          >
            <CartesianGrid horizontal={false} strokeDasharray="3 3" />
            <XAxis
              type="number"
              domain={[0, 100]}
              ticks={[0, 20, 40, 60, 80, 100]}
              tickLine={false}
              axisLine={false}
              unit="%"
            />
            <YAxis
              type="category"
              dataKey="taskLabel"
              width={112}
              tickLine={false}
              axisLine={false}
            />
            <Bar
              dataKey="completionRate"
              fill="var(--color-completionRate)"
              background={{ fill: "var(--muted)" }}
              isAnimationActive={false}
              radius={3}
            >
              <LabelList
                dataKey="displayRate"
                position="right"
                fill="var(--foreground)"
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      )}
      <AnalysisTable
        caption="과제별 완료율과 완료 및 대상 인원"
        rows={data}
        columns={columns}
        getRowKey={(row) => row.taskId}
      />
    </AnalysisPanel>
  )
}
