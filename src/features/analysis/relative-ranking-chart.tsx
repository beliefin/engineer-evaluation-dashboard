"use client"

import type { DotItemDotProps, TooltipContentProps } from "recharts"
import {
  CartesianGrid,
  Label,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { ChartContainer, type ChartConfig } from "@/components/ui/chart"
import type {
  RelativeRankingAnalysis,
  RelativeRankingPoint,
} from "@/view-models/relative-ranking"

const chartConfig = {
  score: { label: "현재 종합점수", color: "var(--chart-1)" },
} satisfies ChartConfig

type RelativeRankingChartProps = Readonly<{
  analysis: RelativeRankingAnalysis
  selectedEngineerId: string | null
  onSelectEngineer: (engineerId: string) => void
}>

function isRankingPoint(value: unknown): value is RelativeRankingPoint {
  if (typeof value !== "object" || value === null) return false
  return "engineerId" in value && "ascendingPosition" in value && "score" in value
}

function gradeLabel(grade: RelativeRankingPoint["grade"]): string {
  if (grade === "SA") return "S/A"
  if (grade === "unavailable") return "분석 불가"
  return grade
}

function scoreStatusLabel(status: RelativeRankingPoint["scoreStatus"]): string {
  if (status === "confirmed") return "확정 점수"
  if (status === "partial") return "미완료 부분점수"
  return "점수 없음"
}

function formatScore(value: number | null): string {
  return value === null ? "—" : `${value.toFixed(1)}점`
}

function RankingTooltip({ active, payload }: TooltipContentProps) {
  const rawPoint: unknown = payload?.[0]?.payload
  if (!active || !isRankingPoint(rawPoint)) return null
  return (
    <div className="min-w-56 rounded-md border bg-background p-3 text-xs shadow-lg">
      <div className="font-semibold text-foreground">{rawPoint.engineerName}</div>
      <div className="mt-0.5 text-muted-foreground">
        {rawPoint.employeeCode} · {rawPoint.team} · {rawPoint.department}
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
        <dt className="text-muted-foreground">종합점수</dt>
        <dd className="text-right font-semibold tabular-nums">{rawPoint.score.toFixed(1)}점</dd>
        <dt className="text-muted-foreground">선택 집단 순위</dt>
        <dd className="text-right tabular-nums">{rawPoint.standardRank}위</dd>
        <dt className="text-muted-foreground">상위 백분위</dt>
        <dd className="text-right tabular-nums">{rawPoint.topPercentile.toFixed(1)}%</dd>
        <dt className="text-muted-foreground">명목 구간</dt>
        <dd className="text-right">{gradeLabel(rawPoint.grade)}</dd>
        <dt className="text-muted-foreground">점수 상태</dt>
        <dd className="text-right">{scoreStatusLabel(rawPoint.scoreStatus)}</dd>
        <dt className="text-muted-foreground">바로 위와 차이</dt>
        <dd className="text-right tabular-nums">{rawPoint.gapToHigher === null ? "—" : `${rawPoint.gapToHigher.toFixed(1)}점`}</dd>
        <dt className="text-muted-foreground">바로 아래와 차이</dt>
        <dd className="text-right tabular-nums">{rawPoint.gapToLower === null ? "—" : `${rawPoint.gapToLower.toFixed(1)}점`}</dd>
      </dl>
      {rawPoint.isBoundaryTie ? (
        <p className="mt-3 border-t pt-2 font-medium text-warning">경계 동점 검토 필요</p>
      ) : null}
    </div>
  )
}

export function RelativeRankingChart({
  analysis,
  selectedEngineerId,
  onSelectEngineer,
}: RelativeRankingChartProps) {
  if (analysis.points.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
        분석에 포함할 엔지니어를 선택해 주세요.
      </div>
    )
  }

  const renderDot = (props: DotItemDotProps) => {
    const point = analysis.points[props.index]
    if (point === undefined || typeof props.cx !== "number" || typeof props.cy !== "number") return null
    const selected = point.engineerId === selectedEngineerId
    const fill = point.scoreStatus === "partial" ? "var(--warning)" : "var(--chart-1)"
    const stroke = point.isBoundaryTie
      ? "var(--destructive)"
      : point.isBoundaryDense
        ? "var(--warning)"
        : "var(--background)"
    return (
      <circle
        cx={props.cx}
        cy={props.cy}
        r={selected ? 7 : 4.5}
        fill={fill}
        stroke={stroke}
        strokeWidth={selected || point.isBoundaryTie ? 3 : 2}
        role="button"
        tabIndex={0}
        aria-label={`${point.engineerName} ${point.score.toFixed(1)}점 상세 보기`}
        onClick={() => onSelectEngineer(point.engineerId)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            onSelectEngineer(point.engineerId)
          }
        }}
        className="cursor-pointer outline-none focus-visible:stroke-primary focus-visible:stroke-[4px]"
      />
    )
  }
  const cEnd = analysis.gradeCounts.c + 0.5
  const bEnd = analysis.gradeCounts.c + analysis.gradeCounts.b + 0.5
  const saEnd = analysis.selectedCount + 0.5

  return (
    <div>
      <ChartContainer
        config={chartConfig}
        className="h-[25rem] w-full aspect-auto"
        role="img"
        aria-label="선택 집단의 하위에서 상위로 상승하는 상대 서열 점수 곡선"
      >
        <LineChart
          accessibilityLayer
          data={analysis.points}
          margin={{ top: 32, right: 24, bottom: 32, left: 0 }}
        >
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          {analysis.selectedCount > 1 ? (
            <>
              <ReferenceArea x1={0.5} x2={cEnd} fill="var(--danger-soft)" fillOpacity={0.75}>
                <Label value={`C · ${analysis.gradeCounts.c}명`} position="insideTop" fill="var(--foreground)" fontSize={12} />
              </ReferenceArea>
              <ReferenceArea x1={cEnd} x2={bEnd} fill="var(--accent)" fillOpacity={0.72}>
                <Label value={`B · ${analysis.gradeCounts.b}명`} position="insideTop" fill="var(--foreground)" fontSize={12} />
              </ReferenceArea>
              <ReferenceArea x1={bEnd} x2={saEnd} fill="var(--success-soft)" fillOpacity={0.78}>
                <Label value={`S/A · ${analysis.gradeCounts.sa}명`} position="insideTop" fill="var(--foreground)" fontSize={12} />
              </ReferenceArea>
              <ReferenceLine x={cEnd} stroke="var(--warning)" strokeDasharray="4 4">
                <Label
                  value={`B 진입 ${formatScore(analysis.bCutoff)}`}
                  position="top"
                  offset={8}
                  fill="var(--warning)"
                  fontSize={12}
                />
              </ReferenceLine>
              <ReferenceLine x={bEnd} stroke="var(--success)" strokeDasharray="4 4">
                <Label
                  value={`S/A 진입 ${formatScore(analysis.saCutoff)}`}
                  position="top"
                  offset={8}
                  fill="var(--success)"
                  fontSize={12}
                />
              </ReferenceLine>
            </>
          ) : null}
          <XAxis
            dataKey="ascendingPosition"
            type="number"
            domain={[0.5, analysis.selectedCount + 0.5]}
            ticks={[1, Math.max(1, Math.ceil(analysis.selectedCount / 2)), analysis.selectedCount]}
            tickFormatter={(value: number) => {
              if (value === 1) return "하위권"
              if (value === analysis.selectedCount) return "상위권"
              return "중간"
            }}
            tickLine={false}
            axisLine={false}
            label={{ value: "선택 집단 내 상대 서열", position: "insideBottom", offset: -18 }}
          />
          <YAxis
            type="number"
            domain={[0, 100]}
            ticks={[0, 20, 40, 60, 80, 100]}
            tickLine={false}
            axisLine={false}
            width={36}
          />
          <Tooltip
            content={(props) => <RankingTooltip {...props} />}
            cursor={{ stroke: "var(--border)", strokeDasharray: "3 3" }}
          />
          <Line
            type="linear"
            dataKey="score"
            stroke="var(--chart-1)"
            strokeWidth={2}
            dot={renderDot}
            activeDot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ChartContainer>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span><span className="mr-1 inline-block size-2 rounded-full bg-primary" />확정 점수</span>
        <span><span className="mr-1 inline-block size-2 rounded-full bg-warning" />미완료 부분점수</span>
        <span><span className="mr-1 inline-block size-2 rounded-full border-2 border-warning" />경계 ±{analysis.boundaryWindow.toFixed(1)}점</span>
        <span><span className="mr-1 inline-block size-2 rounded-full border-2 border-destructive" />경계 동점</span>
      </div>
    </div>
  )
}
