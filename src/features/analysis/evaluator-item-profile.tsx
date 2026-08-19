"use client"

import { useState } from "react"
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts"

import { ChartContainer, type ChartConfig } from "@/components/ui/chart"
import type { EvaluatorItemProfile as EvaluatorItemProfileDatum } from "@/view-models/evaluator-detail"

import { AnalysisPanel } from "./analysis-panel"
import { AnalysisTable, type AnalysisTableColumn } from "./analysis-table"

const chartConfig = {
  evaluator: { label: "평가자 평균", color: "var(--chart-1)" },
  peer: { label: "다른 평가자 평균", color: "var(--chart-3)" },
} satisfies ChartConfig

function signed(value: number | null): string {
  if (value === null) return "-"
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}`
}

const columns: readonly AnalysisTableColumn<EvaluatorItemProfileDatum>[] = [
  { key: "item", header: "평가 항목", render: (row) => `${row.itemNumber}. ${row.itemLabel}` },
  { key: "count", header: "응답 수", align: "end", render: (row) => `${row.responseCount}건` },
  { key: "average", header: "평가자 평균", align: "end", render: (row) => `${row.evaluatorAverage.toFixed(1)}점` },
  { key: "peer", header: "다른 평가자 평균", align: "end", render: (row) => row.peerAverage === null ? "-" : `${row.peerAverage.toFixed(1)}점` },
  { key: "delta", header: "차이", align: "end", render: (row) => signed(row.delta) },
]

export function EvaluatorItemProfile({
  data,
}: Readonly<{ data: readonly EvaluatorItemProfileDatum[] }>) {
  const taskOptions = Array.from(new Map(data.map((row) => [row.taskId, row.taskLabel])))
  const [requestedTaskId, setRequestedTaskId] = useState(taskOptions[0]?.[0] ?? "")
  const selectedTaskId = taskOptions.some(([taskId]) => taskId === requestedTaskId)
    ? requestedTaskId
    : (taskOptions[0]?.[0] ?? "")
  const selectedRows = data.filter((row) => row.taskId === selectedTaskId)
  const chartData = selectedRows.map((row) => ({
    ...row,
    itemAxisLabel: `${row.itemNumber}번`,
    evaluatorLabel: row.evaluatorAverage.toFixed(1),
    peerLabel: row.peerAverage?.toFixed(1) ?? "",
  }))

  return (
    <AnalysisPanel
      title="평가 항목별 경향"
      description="어떤 평가 항목에서 점수를 높거나 낮게 주는지 다른 평가자의 평균과 비교합니다."
      isEmpty={data.length === 0}
    >
      <div className="mb-5 max-w-sm">
        <label className="text-xs font-medium text-muted-foreground" htmlFor="evaluator-item-task">
          평가 과제
        </label>
        <select
          className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          id="evaluator-item-task"
          onChange={(event) => setRequestedTaskId(event.target.value)}
          value={selectedTaskId}
        >
          {taskOptions.map(([taskId, taskLabel]) => (
            <option key={taskId} value={taskId}>{taskLabel}</option>
          ))}
        </select>
      </div>
      <ChartContainer
        aria-label="평가 항목별 평가자 평균과 다른 평가자 평균 비교 막대 차트"
        className="h-80 w-full aspect-auto"
        config={chartConfig}
        role="img"
      >
        <BarChart accessibilityLayer data={chartData} layout="vertical" margin={{ top: 8, right: 52, bottom: 8, left: 8 }}>
          <CartesianGrid horizontal={false} strokeDasharray="3 3" />
          <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="itemAxisLabel" width={42} tickLine={false} axisLine={false} />
          <Bar dataKey="evaluatorAverage" name="evaluator" fill="var(--color-evaluator)" isAnimationActive={false} radius={3}>
            <LabelList dataKey="evaluatorLabel" position="right" fill="var(--foreground)" fontSize={12} />
          </Bar>
          <Bar dataKey="peerAverage" name="peer" fill="var(--color-peer)" isAnimationActive={false} radius={3}>
            <LabelList dataKey="peerLabel" position="right" fill="var(--muted-foreground)" fontSize={12} />
          </Bar>
        </BarChart>
      </ChartContainer>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
        <span><span aria-hidden className="mr-2 inline-block h-2 w-4 bg-chart-1" />평가자 평균</span>
        <span><span aria-hidden className="mr-2 inline-block h-2 w-4 bg-chart-3" />다른 평가자 평균</span>
      </div>
      <AnalysisTable
        caption="평가 항목별 응답 수, 평가자 평균, 다른 평가자 평균과 차이"
        columns={columns}
        getRowKey={(row) => row.itemId}
        rows={selectedRows}
      />
    </AnalysisPanel>
  )
}
