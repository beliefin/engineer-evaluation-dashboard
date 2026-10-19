"use client"

import { HorizontalScroll } from "@/components/ui/horizontal-scroll"

import { useId, useState } from "react"

import { scoreAxisMaximum, scoreAxisTicks } from "./chart-score-domain"

import type {
  RelativeRankingAnalysis,
  RelativeRankingPoint,
} from "@/view-models/relative-ranking"

type RelativeRankingChartProps = Readonly<{
  analysis: RelativeRankingAnalysis
  selectedEngineerId: string | null
  onSelectEngineer: (engineerId: string) => void
}>

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

function RankingTooltip({ point: rawPoint }: Readonly<{ point: RelativeRankingPoint }>) {
  return (
    <div className="signal-relative-tooltip min-w-56 rounded-md border bg-background p-3 text-xs shadow-lg" role="status">
      <div className="font-semibold text-foreground">{rawPoint.engineerName}</div>
      <div className="mt-0.5 text-muted-foreground">
        {rawPoint.team} · {rawPoint.department}
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
  const patternId = useId()
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const hoveredPoint = analysis.points.find((point) => point.engineerId === hoveredId) ?? null
  if (analysis.points.length === 0) {
    return (
      <div className="signal-relative-chart-empty flex h-80 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
        분석에 포함할 엔지니어를 선택해 주세요.
      </div>
    )
  }

  const maximum = scoreAxisMaximum(analysis.points.map((point) => point.score))
  const plot = { left: 68, top: 58, width: 884, height: 320 }
  const x = (position: number) => plot.left + ((position - 0.5) / analysis.selectedCount) * plot.width
  const y = (score: number) => plot.top + (1 - score / maximum) * plot.height
  const cEnd = analysis.gradeCounts.c + 0.5
  const bEnd = analysis.gradeCounts.c + analysis.gradeCounts.b + 0.5
  const saEnd = analysis.selectedCount + 0.5
  const bands = [
    { key: "C", start: 0.5, end: cEnd, count: analysis.gradeCounts.c },
    { key: "B", start: cEnd, end: bEnd, count: analysis.gradeCounts.b },
    { key: "S/A", start: bEnd, end: saEnd, count: analysis.gradeCounts.sa },
  ]
  const ticks = analysis.selectedCount <= 30
    ? analysis.points.map((point) => point.ascendingPosition)
    : Array.from(new Set([1, Math.ceil(analysis.selectedCount / 4), Math.ceil(analysis.selectedCount / 2), Math.ceil(analysis.selectedCount * 3 / 4), analysis.selectedCount]))

  return (
    <div className="signal-relative-chart">
      <HorizontalScroll className="signal-relative-chart-scroll" role="region" aria-label="상대 서열 점수 곡선 가로 스크롤 영역" tabIndex={0}>
        <svg className="signal-relative-svg" viewBox="0 0 1000 470" data-domain-max={maximum} role="group" aria-label={`선택 집단의 하위에서 상위로 상승하는 상대 서열 점수 곡선, 점수 축 0~${maximum}점`}>
          <defs>
            <pattern id={patternId} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" x2="0" y1="0" y2="8" stroke="#d3d3cf" strokeWidth="1" />
            </pattern>
          </defs>
          {analysis.selectedCount > 1 ? bands.filter((band) => band.count > 0).map((band) => (
            <g key={band.key} data-grade={band.key} data-start={band.start} data-end={band.end}>
              <rect x={x(band.start)} y={plot.top} width={x(band.end) - x(band.start)} height={plot.height} fill={band.key === "C" ? "#ededeb" : band.key === "B" ? "#f5f5f3" : `url(#${patternId})`} />
              <rect x={x(band.start)} y={20} width={x(band.end) - x(band.start)} height={38} fill="#e4e4e1" />
              <text x={(x(band.start) + x(band.end)) / 2} y={46} textAnchor="middle" fontWeight="800">{band.key} · {band.count}명</text>
            </g>
          )) : null}
          {scoreAxisTicks(maximum).map((tick) => (
            <g key={tick}>
              <line x1={plot.left} x2={plot.left + plot.width} y1={y(tick)} y2={y(tick)} stroke="#c9c9c6" strokeDasharray={tick === 0 ? undefined : "3 4"} />
              <text x={plot.left - 16} y={y(tick) + 6} textAnchor="end">{tick}</text>
            </g>
          ))}
          <line x1={plot.left} x2={plot.left} y1={plot.top} y2={plot.top + plot.height} stroke="#1a1a18" />
          {analysis.selectedCount > 1 ? [
            { key: "CB", position: cEnd, value: analysis.bCutoff, label: "B 진입" },
            { key: "BSA", position: bEnd, value: analysis.saCutoff, label: "S/A 진입" },
          ].filter((boundary) => boundary.value !== null).map((boundary) => (
            <g key={boundary.key} data-boundary={boundary.key} data-position={boundary.position}>
              <line x1={x(boundary.position)} x2={x(boundary.position)} y1={20} y2={plot.top + plot.height} stroke="#1a1a18" strokeDasharray="7 5" />
              <text x={x(boundary.position)} y={plot.top + plot.height - 36} textAnchor="middle" fontWeight="750" className="signal-relative-cutoff-label">
                <tspan x={x(boundary.position)}>{boundary.label}</tspan>
                <tspan x={x(boundary.position)} dy="23">{formatScore(boundary.value)}</tspan>
              </text>
            </g>
          )) : null}
          {analysis.points.slice(1).map((point, index) => {
            const previous = analysis.points[index]!
            const partial = point.scoreStatus === "partial" || previous.scoreStatus === "partial"
            return <line key={point.engineerId} data-segment-status={partial ? "partial" : "confirmed"} x1={x(previous.ascendingPosition)} y1={y(previous.score)} x2={x(point.ascendingPosition)} y2={y(point.score)} stroke="#1a1a18" strokeWidth="2.5" strokeDasharray={partial ? "7 5" : undefined} />
          })}
          {analysis.points.map((point) => {
            const selected = point.engineerId === selectedEngineerId
            return (
              <g
                key={point.engineerId}
                role="button" tabIndex={0}
                aria-label={`${point.engineerName} ${point.score.toFixed(1)}점 상세 보기`}
                aria-pressed={selected}
                onClick={() => onSelectEngineer(point.engineerId)}
                onMouseEnter={() => setHoveredId(point.engineerId)}
                onMouseLeave={() => setHoveredId(null)}
                onFocus={() => setHoveredId(point.engineerId)}
                onBlur={() => setHoveredId(null)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    onSelectEngineer(point.engineerId)
                  }
                }}
                className="signal-relative-point"
              >
                <circle aria-hidden="true" className="signal-relative-hit-area" cx={x(point.ascendingPosition)} cy={y(point.score)} r={29} fill="transparent" />
                {point.isBoundaryTie ? <circle aria-hidden="true" cx={x(point.ascendingPosition)} cy={y(point.score)} r={9} fill="none" stroke="#1a1a18" strokeWidth="1.5" /> : null}
                <circle
                  aria-hidden="true"
                  className="signal-relative-point-mark"
                  cx={x(point.ascendingPosition)} cy={y(point.score)} r={selected ? 7 : 5}
                  fill={selected || point.isBoundaryDense ? "#e8cf4a" : "#fff"}
                  stroke="#1a1a18" strokeWidth={selected ? 3 : 2}
                  strokeDasharray={point.scoreStatus === "partial" ? "3 2" : undefined}
                  data-engineer-id={point.engineerId} data-score={point.score} data-position={point.ascendingPosition} data-score-status={point.scoreStatus} data-boundary-tie={point.isBoundaryTie}
                />
                <title>{`${point.engineerName} · ${scoreStatusLabel(point.scoreStatus)} · ${gradeLabel(point.grade)}`}</title>
              </g>
            )
          })}
          {ticks.map((tick) => <text key={tick} x={x(tick)} y={404} textAnchor="middle">{tick}</text>)}
          <text x={plot.left} y={435} textAnchor="start">하위권</text>
          <text x={plot.left + plot.width / 2} y={435} textAnchor="middle">중간</text>
          <text x={plot.left + plot.width} y={435} textAnchor="end">상위권</text>
          <text x={plot.left + plot.width / 2} y={462} textAnchor="middle" fontWeight="750">선택 집단 내 상대 서열</text>
        </svg>
      </HorizontalScroll>
      {hoveredPoint !== null ? <RankingTooltip point={hoveredPoint} /> : null}
      <div className="signal-relative-legend mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span><i className="signal-relative-key-confirmed" aria-hidden="true" />확정 점수</span>
        <span><i className="signal-relative-key-partial" aria-hidden="true" />미완료 부분점수</span>
        <span><i className="signal-relative-key-dense" aria-hidden="true" />경계 ±{analysis.boundaryWindow.toFixed(1)}점</span>
        <span><i className="signal-relative-key-tie" aria-hidden="true" />경계 동점</span>
      </div>
    </div>
  )
}
