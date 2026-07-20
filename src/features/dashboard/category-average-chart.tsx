"use client"

import { useId } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from "recharts"

import { ChartContainer, type ChartConfig } from "@/components/ui/chart"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { DashboardPanel } from "./dashboard-panel"
import type { CategoryAverageChartProps } from "./dashboard-view-models"

const CHART_CONFIG: ChartConfig = {
  weightedScore: {
    label: "가중 평균",
    color: "var(--chart-1)",
  },
  unweightedScore: {
    label: "비가중 평균",
    color: "var(--chart-3)",
  },
}

export function CategoryAverageChart({
  title,
  description,
  data,
}: CategoryAverageChartProps) {
  const titleId = useId()
  const hasData = data.some((item) => item.sampleSize > 0)

  return (
    <DashboardPanel title={title} description={description}>
      <figure aria-labelledby={titleId}>
        <figcaption id={titleId} className="sr-only">
          과제별 평가자 가중 평균과 비가중 평균을 0점에서 100점 범위로 비교
        </figcaption>
        {hasData ? (
          <>
            <div className="mb-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <span className="size-2.5 rounded-sm bg-[var(--chart-1)]" aria-hidden />
                가중 평균
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="size-2.5 rounded-sm bg-[var(--chart-3)]" aria-hidden />
                비가중 평균
              </span>
            </div>
            <ChartContainer
              config={CHART_CONFIG}
              className="h-72 w-full aspect-auto"
              aria-hidden="true"
            >
              <BarChart
                layout="vertical"
                data={[...data]}
                accessibilityLayer={false}
                margin={{ top: 4, right: 44, bottom: 4, left: 4 }}
              >
                <CartesianGrid
                  horizontal={false}
                  stroke="var(--border-subtle)"
                />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  ticks={[0, 20, 40, 60, 80, 100]}
                  axisLine={false}
                  tickLine={false}
                  tickMargin={8}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  width={88}
                />
                <Bar
                  dataKey="weightedScore"
                  fill="var(--chart-1)"
                  radius={[0, 3, 3, 0]}
                  isAnimationActive={false}
                >
                  <LabelList
                    dataKey="weightedScore"
                    position="right"
                    fill="var(--foreground)"
                    fontSize={11}
                  />
                </Bar>
                <Bar
                  dataKey="unweightedScore"
                  fill="var(--chart-3)"
                  radius={[0, 3, 3, 0]}
                  isAnimationActive={false}
                >
                  <LabelList
                    dataKey="unweightedScore"
                    position="right"
                    fill="var(--foreground)"
                    fontSize={11}
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          </>
        ) : (
          <div
            role="status"
            className="flex h-64 items-center justify-center rounded-md bg-muted text-sm text-muted-foreground"
          >
            집계할 분야 점수가 없습니다.
          </div>
        )}

        <details className="mt-4 border-t border-border-subtle pt-3">
          <summary className="w-fit text-xs font-medium text-primary underline-offset-4 hover:underline">
            과제 평균 표 데이터 보기
          </summary>
          <Table className="mt-3">
            <TableHeader>
              <TableRow>
                <TableHead>과제</TableHead>
                <TableHead className="text-right">가중 평균</TableHead>
                <TableHead className="text-right">비가중 평균</TableHead>
                <TableHead className="text-right">완료 표본</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.label}</TableCell>
                  <TableCell className="numeric text-right font-medium">
                    {item.weightedScore.toFixed(1)}점
                  </TableCell>
                  <TableCell className="numeric text-right font-medium">
                    {item.unweightedScore.toFixed(1)}점
                  </TableCell>
                  <TableCell className="numeric text-right text-muted-foreground">
                    {item.sampleSize}명
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </details>
      </figure>
    </DashboardPanel>
  )
}
