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
  score: {
    label: "분야 평균",
    color: "var(--chart-2)",
  },
}

export function CategoryAverageChart({
  title,
  description,
  data,
}: CategoryAverageChartProps) {
  const titleId = useId()
  const hasData = data.some((item) => item.score > 0)

  return (
    <DashboardPanel title={title} description={description}>
      <figure aria-labelledby={titleId}>
        <figcaption id={titleId} className="sr-only">
          평가 분야별 평균 점수를 0점에서 100점 범위로 비교
        </figcaption>
        {hasData ? (
          <ChartContainer
            config={CHART_CONFIG}
            className="h-64 w-full aspect-auto"
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
                dataKey="score"
                fill="var(--chart-2)"
                radius={[0, 4, 4, 0]}
                isAnimationActive={false}
              >
                <LabelList
                  dataKey="score"
                  position="right"
                  fill="var(--foreground)"
                  fontSize={12}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
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
            분야 평균 표 데이터 보기
          </summary>
          <Table className="mt-3">
            <TableHeader>
              <TableRow>
                <TableHead>평가 분야</TableHead>
                <TableHead className="text-right">평균 점수</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.label}</TableCell>
                  <TableCell className="numeric text-right font-medium">
                    {item.score.toFixed(1)}점
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
