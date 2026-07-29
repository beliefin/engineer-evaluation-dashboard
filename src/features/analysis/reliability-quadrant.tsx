"use client"

import {
  CartesianGrid,
  Cell,
  ReferenceLine,
  Scatter,
  ScatterChart,
  XAxis,
  YAxis,
} from "recharts"

import { ChartContainer, type ChartConfig } from "@/components/ui/chart"

import { AnalysisPanel } from "./analysis-panel"
import { AnalysisTable, type AnalysisTableColumn } from "./analysis-table"
import { formatCount, formatScore } from "./format"
import type { EvaluationReliabilityDatum } from "./types"

const chartConfig = {
  stable: { label: "평가자 의견 유사", color: "var(--chart-1)" },
  review: { label: "이견 검토", color: "var(--chart-5)" },
} satisfies ChartConfig

const columns: readonly AnalysisTableColumn<EvaluationReliabilityDatum>[] = [
  { key: "engineer", header: "엔지니어", render: (row) => row.engineerLabel },
  { key: "consensus", header: "합의 평균", align: "end", render: (row) => formatScore(row.consensusScore) },
  { key: "deviation", header: "표준편차", align: "end", render: (row) => formatScore(row.standardDeviation) },
  { key: "range", header: "최고·최저 차", align: "end", render: (row) => formatScore(row.scoreRange) },
  { key: "evaluators", header: "평가자", align: "end", render: (row) => formatCount(row.evaluatorCount, "명") },
  {
    key: "status",
    header: "검토",
    render: (row) => row.isHighDisagreement ? "이견 확인" : "의견 유사",
  },
]

function domainMaximum(data: readonly EvaluationReliabilityDatum[]): number {
  const maximum = Math.max(0, ...data.map((entry) => entry.standardDeviation))
  return Math.max(10, Math.ceil(maximum / 5) * 5)
}

type ReliabilityQuadrantProps = Readonly<{
  data: readonly EvaluationReliabilityDatum[]
  taskLabel: string
  standardDeviationThreshold: number
  isLoading?: boolean
}>

export function ReliabilityQuadrant({
  data,
  taskLabel,
  standardDeviationThreshold,
  isLoading = false,
}: ReliabilityQuadrantProps) {
  const domainMax = domainMaximum(data)
  const chartData = data.map((entry) => ({
    ...entry,
    kind: entry.isHighDisagreement ? "review" : "stable",
  }))

  return (
    <AnalysisPanel
      title="평가 신뢰도 사분면"
      description={`${taskLabel}의 합의 평균과 평가자 간 점수 이견을 함께 봅니다. 오른쪽 위일수록 점수는 높지만 추가 확인이 필요한 대상입니다.`}
      isEmpty={data.length === 0}
      isLoading={isLoading}
    >
      <ChartContainer
        config={chartConfig}
        className="h-80 w-full aspect-auto"
        role="img"
        aria-label={`${taskLabel} 합의 평균과 평가자 점수 표준편차 산점도`}
      >
        <ScatterChart margin={{ top: 16, right: 20, bottom: 20, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="consensusScore"
            domain={[0, 100]}
            name="합의 평균"
            tickLine={false}
            axisLine={false}
            ticks={[0, 20, 40, 60, 80, 100]}
            type="number"
            label={{ value: "합의 평균 점수", position: "insideBottom", offset: -10 }}
          />
          <YAxis
            dataKey="standardDeviation"
            domain={[0, domainMax]}
            name="평가자 표준편차"
            tickLine={false}
            axisLine={false}
            type="number"
            width={40}
            label={{ value: "이견", angle: -90, position: "insideLeft", offset: 8 }}
          />
          <ReferenceLine
            y={standardDeviationThreshold}
            stroke="var(--warning)"
            strokeDasharray="4 4"
            label={{ value: "이견 검토선", position: "insideTopRight", fill: "var(--warning)", fontSize: 12 }}
          />
          <Scatter data={chartData} name="평가 대상">
            {chartData.map((entry) => (
              <Cell
                key={entry.engineerId}
                fill={entry.isHighDisagreement ? "var(--warning)" : "var(--chart-1)"}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ChartContainer>
      <div aria-label="사분면 점 범례" className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2 rounded-full bg-primary" />
          의견 유사
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2 rounded-full bg-warning" />
          이견 확인
        </span>
      </div>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">
        이견 확인은 최고·최저 차, 표준편차, 다른 평가자 평균 대비 큰 편차를 함께 반영한 검토 신호입니다. 확정 판정이 아닙니다.
      </p>
      <AnalysisTable
        caption={`${taskLabel} 엔지니어별 합의 평균, 평가자 간 표준편차, 점수 범위와 검토 상태`}
        columns={columns}
        getRowKey={(row) => row.engineerId}
        rows={data}
      />
    </AnalysisPanel>
  )
}
