"use client"

import { BarChart3, Medal, Target, TrendingUp, Trophy } from "lucide-react"
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart } from "recharts"

import { ChartContainer, type ChartConfig } from "@/components/ui/chart"
import { cn } from "@/lib/utils"

import type {
  EngineerEvaluationStoryViewModel,
  EngineerStoryHighlightViewModel,
} from "./engineer-detail.types"

const profileChartConfig = {
  score: { label: "내 점수", color: "var(--chart-1)" },
  averageScore: { label: "전체 평균", color: "var(--chart-3)" },
} satisfies ChartConfig

function formatScore(value: number | null, digits = 1): string {
  return value === null ? "—" : `${value.toFixed(digits)}점`
}

function differenceLabel(highlight: EngineerStoryHighlightViewModel | null): string {
  if (highlight === null) return "평가 점수 없음"
  const difference = highlight.differenceFromAverage
  if (difference === 0) return "전체 평균과 같음"
  return `전체 평균보다 ${Math.abs(difference).toFixed(1)}점 ${difference > 0 ? "높음" : "낮음"}`
}

function barWidth(value: number | null): string {
  return `${Math.min(100, Math.max(0, value ?? 0))}%`
}

interface ComparisonBarProps {
  readonly label: string
  readonly value: number | null
  readonly tone: "primary" | "average" | "top"
}

function ComparisonBar({ label, value, tone }: ComparisonBarProps) {
  const toneClass = {
    primary: "bg-primary",
    average: "bg-chart-3",
    top: "bg-success",
  }[tone]

  return (
    <div className="grid grid-cols-[5.25rem_minmax(0,1fr)_3.25rem] items-center gap-2 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <div className="h-2 overflow-hidden rounded-sm bg-muted" aria-hidden="true">
        <div className={cn("h-full rounded-sm", toneClass)} style={{ width: barWidth(value) }} />
      </div>
      <span className="numeric text-right font-semibold">{formatScore(value)}</span>
    </div>
  )
}

function HighlightMetric({
  label,
  highlight,
  tone,
  className,
}: Readonly<{
  label: string
  highlight: EngineerStoryHighlightViewModel | null
  tone: "success" | "warning"
  className?: string
}>) {
  const Icon = tone === "success" ? Trophy : BarChart3
  return (
    <div className={cn("min-w-0 p-4 sm:p-5", tone === "success" ? "bg-success-soft/55" : "bg-warning-soft/55", className)}>
      <dt className={cn("flex items-center gap-2 text-xs font-medium", tone === "success" ? "text-success" : "text-warning")}>
        <Icon className="size-4" aria-hidden="true" />
        {label}
      </dt>
      <dd className="mt-3 truncate text-base font-bold" title={highlight?.label ?? "분석 대기"}>
        {highlight?.label ?? "분석 대기"}
      </dd>
      <p className="mt-1 text-xs text-muted-foreground">{differenceLabel(highlight)}</p>
    </div>
  )
}

export function EngineerEvaluationStory({
  story,
}: Readonly<{ story: EngineerEvaluationStoryViewModel }>) {
  const profile = story.profile.map((point) => ({
    ...point,
    shortLabel: point.label.length > 7 ? `${point.label.slice(0, 7)}…` : point.label,
  }))

  return (
    <section aria-labelledby="engineer-story-title" className="overflow-hidden rounded-lg border bg-card">
      <div className="border-b px-5 py-4 sm:px-6">
        <p className="text-xs font-semibold tracking-[0.12em] text-primary">INDIVIDUAL STORY</p>
        <h2 id="engineer-story-title" className="mt-1 text-xl font-semibold tracking-tight">한 명의 평가 스토리</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          현재 점수의 구성과 시즌 내 위치, 과제별 강점과 보완 지점을 함께 보여줍니다.
        </p>
      </div>

      <dl className="grid divide-y border-b sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-5">
        <div className="min-w-0 p-4 sm:p-5">
          <dt className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Target className="size-4 text-primary" aria-hidden="true" />{story.scoreLabel}
          </dt>
          <dd className="numeric mt-3 text-2xl font-bold tracking-tight">{formatScore(story.score, 2)}</dd>
          <p className="mt-1 text-xs text-muted-foreground">
            {story.scoreLabel === "최종 점수" ? "모든 적용 과제 반영 완료" : "완료된 과제만 우선 반영"}
          </p>
        </div>
        <div className="min-w-0 p-4 sm:p-5">
          <dt className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Medal className="size-4 text-primary" aria-hidden="true" />현재 순위
          </dt>
          <dd className="numeric mt-3 text-2xl font-bold tracking-tight">{story.rank === null ? "—" : `${story.rank}위`}</dd>
          <p className="mt-1 text-xs text-muted-foreground">점수 반영 {story.cohortCount}명 기준</p>
        </div>
        <div className="min-w-0 p-4 sm:p-5">
          <dt className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <TrendingUp className="size-4 text-primary" aria-hidden="true" />상위 백분위
          </dt>
          <dd className="numeric mt-3 text-2xl font-bold tracking-tight">
            {story.topPercentile === null ? "—" : `상위 ${story.topPercentile.toFixed(1)}%`}
          </dd>
          <p className="mt-1 text-xs text-muted-foreground">현재 시즌 내 상대 위치</p>
        </div>
        <HighlightMetric label="강점 상위 항목" highlight={story.strongestCategory} tone="success" />
        <HighlightMetric
          label="보완 필요 항목"
          highlight={story.improvementCategory}
          tone="warning"
          className="sm:col-span-2 xl:col-span-1"
        />
      </dl>

      <div className="grid xl:grid-cols-[minmax(20rem,0.8fr)_minmax(0,1.2fr)]">
        <section aria-labelledby="competency-profile-title" className="border-b p-5 sm:p-6 xl:border-r xl:border-b-0">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 id="competency-profile-title" className="text-base font-semibold">개인 역량 프로필</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">과제별 점수를 전체 평균과 비교합니다.</p>
            </div>
            <fieldset className="flex flex-wrap gap-3 text-xs">
              <legend className="sr-only">역량 프로필 범례</legend>
              <span className="flex items-center gap-1.5"><span className="size-2.5 bg-primary" />내 점수</span>
              <span className="flex items-center gap-1.5"><span className="size-2.5 bg-chart-3" />전체 평균</span>
            </fieldset>
          </div>

          {profile.length >= 3 ? (
            <ChartContainer
              config={profileChartConfig}
              className="mt-4 h-80 w-full aspect-auto"
              role="img"
              aria-label="과제별 내 점수와 전체 평균을 비교한 레이더 차트"
            >
              <RadarChart data={profile} margin={{ top: 20, right: 34, bottom: 20, left: 34 }}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="shortLabel" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tickCount={6} tick={{ fontSize: 10 }} />
                <Radar dataKey="averageScore" fill="var(--color-averageScore)" fillOpacity={0.1} stroke="var(--color-averageScore)" strokeWidth={1.5} isAnimationActive={false} />
                <Radar dataKey="score" fill="var(--color-score)" fillOpacity={0.18} stroke="var(--color-score)" strokeWidth={2} isAnimationActive={false} />
              </RadarChart>
            </ChartContainer>
          ) : (
            <p className="mt-5 border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
              점수가 확정된 과제가 3개 이상이면 역량 프로필을 표시합니다.
            </p>
          )}

          <fieldset className="mt-4 overflow-hidden border">
            <legend className="sr-only">개인 역량 프로필 수치</legend>
            {profile.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">비교할 확정 점수가 없습니다.</p>
            ) : profile.map((point) => (
              <div className="grid grid-cols-[minmax(0,1fr)_4rem_4rem] gap-3 border-b px-3 py-2.5 text-xs last:border-b-0" key={point.key}>
                <span className="truncate font-medium" title={point.label}>{point.label}</span>
                <span className="numeric text-right font-semibold">{point.score.toFixed(1)}</span>
                <span className="numeric text-right text-muted-foreground">{point.averageScore.toFixed(1)}</span>
              </div>
            ))}
          </fieldset>
          <p className="mt-2 text-xs text-muted-foreground">왼쪽부터 과제명, 내 점수, 전체 평균입니다.</p>
        </section>

        <section aria-labelledby="task-comparison-title" className="p-5 sm:p-6">
          <h3 id="task-comparison-title" className="text-base font-semibold">과제별 상세 비교</h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">내 점수를 전체 평균과 상위 25% 평균에 나란히 비교합니다.</p>
          <div className="mt-5 space-y-5">
            {story.taskComparisons.map((comparison) => (
              <article
                key={comparison.key}
                className="border-b pb-5 last:border-b-0 last:pb-0"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <h4 className="text-sm font-semibold">{comparison.label}</h4>
                  <span className="numeric shrink-0 text-xs text-muted-foreground">확정 {comparison.sampleSize}명</span>
                </div>
                <div className="space-y-2.5">
                  <ComparisonBar label="내 점수" value={comparison.ownScore} tone="primary" />
                  <ComparisonBar label="전체 평균" value={comparison.sampleSize === 0 ? null : comparison.averageScore} tone="average" />
                  <ComparisonBar label="상위 25%" value={comparison.sampleSize === 0 ? null : comparison.topQuartileAverage} tone="top" />
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  )
}
