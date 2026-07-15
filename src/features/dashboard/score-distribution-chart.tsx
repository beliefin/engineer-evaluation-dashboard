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
import type { ScoreDistributionChartProps } from "./dashboard-view-models"

const CHART_CONFIG: ChartConfig = {
  count: {
    label: "완료 인원",
    color: "var(--primary)",
  },
}

export function ScoreDistributionChart({
  title,
  description,
  data,
}: ScoreDistributionChartProps) {
  const titleId = useId()
  const hasData = data.some((item) => item.count > 0)

  return (
    <DashboardPanel title={title} description={description}>
      <figure aria-labelledby={titleId}>
        <figcaption id={titleId} className="sr-only">
          가중 총점 0점에서 100점까지의 구간별 완료 인원 분포
        </figcaption>
        {hasData ? (
          <ChartContainer
            config={CHART_CONFIG}
            className="h-64 w-full aspect-auto"
            aria-hidden="true"
          >
            <BarChart
              data={[...data]}
              accessibilityLayer={false}
              margin={{ top: 24, right: 12, bottom: 4, left: 0 }}
            >
              <CartesianGrid
                vertical={false}
                stroke="var(--border-subtle)"
              />
              <XAxis
                dataKey="range"
                axisLine={false}
                tickLine={false}
                tickMargin={8}
                interval={0}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                width={28}
              />
              <Bar
                dataKey="count"
                fill="var(--primary)"
                radius={[4, 4, 0, 0]}
                isAnimationActive={false}
              >
                <LabelList
                  dataKey="count"
                  position="top"
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
            순위에 포함된 완료자가 없습니다.
          </div>
        )}

        <details className="mt-4 border-t border-border-subtle pt-3">
          <summary className="w-fit text-xs font-medium text-primary underline-offset-4 hover:underline">
            분포 표 데이터 보기
          </summary>
          <Table className="mt-3">
            <TableHeader>
              <TableRow>
                <TableHead>가중 총점 구간</TableHead>
                <TableHead className="text-right">완료 인원</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <TableRow key={item.range}>
                  <TableCell>{item.range}점</TableCell>
                  <TableCell className="numeric text-right font-medium">
                    {item.count}명
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
