"use client"

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts"

import { ChartContainer, type ChartConfig } from "@/components/ui/chart"
import type { EvaluatorTaskTendency } from "@/view-models/evaluator-detail"

import { AnalysisPanel } from "./analysis-panel"
import { AnalysisTable, type AnalysisTableColumn } from "./analysis-table"
import { formatCount, formatScore } from "./format"

const chartConfig = {
  evaluator: { label: "평가자 평균", color: "var(--chart-1)" },
  peer: { label: "동료 평균", color: "var(--chart-3)" },
} satisfies ChartConfig

function signed(value: number | null): string {
  if (value === null) return "-"
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}`
}

const columns: readonly AnalysisTableColumn<EvaluatorTaskTendency>[] = [
  { key: "task", header: "과제", render: (row) => row.taskLabel },
  { key: "count", header: "평가 수", align: "end", render: (row) => formatCount(row.evaluationCount, "건") },
  { key: "average", header: "평균", align: "end", render: (row) => formatScore(row.averageScore) },
  { key: "peer", header: "동료 평균", align: "end", render: (row) => row.peerAverage === null ? "-" : formatScore(row.peerAverage) },
  { key: "delta", header: "동료 대비", align: "end", render: (row) => signed(row.meanResidual) },
  { key: "outlier", header: "10점 이상 이탈", align: "end", render: (row) => formatCount(row.outlierCount, "건") },
]

export function EvaluatorTaskProfile({
  data,
}: Readonly<{ data: readonly EvaluatorTaskTendency[] }>) {
  const chartData = data.map((row) => ({
    ...row,
    evaluatorLabel: row.averageScore.toFixed(1),
    peerLabel: row.peerAverage?.toFixed(1) ?? "",
  }))
  return (
    <AnalysisPanel
      title="과제별 평가 성향"
      description="과제별 평균 원점수와 같은 대상을 평가한 동료 평균을 비교합니다."
      isEmpty={data.length === 0}
    >
      <ChartContainer
        aria-label="과제별 평가자 평균과 동료 평균 비교 막대 차트"
        className="h-72 w-full aspect-auto"
        config={chartConfig}
        role="img"
      >
        <BarChart accessibilityLayer data={chartData} layout="vertical" margin={{ top: 8, right: 52, bottom: 8, left: 8 }}>
          <CartesianGrid horizontal={false} strokeDasharray="3 3" />
          <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="taskLabel" width={104} tickLine={false} axisLine={false} />
          <Bar dataKey="averageScore" name="evaluator" fill="var(--color-evaluator)" isAnimationActive={false} radius={3}>
            <LabelList dataKey="evaluatorLabel" position="right" fill="var(--foreground)" fontSize={12} />
          </Bar>
          <Bar dataKey="peerAverage" name="peer" fill="var(--color-peer)" isAnimationActive={false} radius={3}>
            <LabelList dataKey="peerLabel" position="right" fill="var(--muted-foreground)" fontSize={12} />
          </Bar>
        </BarChart>
      </ChartContainer>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
        <span><span aria-hidden className="mr-2 inline-block h-2 w-4 bg-chart-1" />평가자 평균</span>
        <span><span aria-hidden className="mr-2 inline-block h-2 w-4 bg-chart-3" />동료 평균</span>
      </div>
      <AnalysisTable
        caption="과제별 평가 횟수, 평균 점수, 동료 평균, 평균 차이와 이탈 건수"
        columns={columns}
        getRowKey={(row) => row.taskId}
        rows={data}
      />
    </AnalysisPanel>
  )
}
