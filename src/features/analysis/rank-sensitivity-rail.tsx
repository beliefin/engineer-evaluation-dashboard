"use client"

import { useId, useMemo, useState } from "react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { AnalysisPanel } from "./analysis-panel"
import { formatDecimal, formatScore } from "./format"
import type { EvaluatorExclusionSensitivityDatum } from "./types"

type RankSensitivityRailProps = Readonly<{
  scenarios: readonly EvaluatorExclusionSensitivityDatum[]
  taskLabel: string
  rankShiftAlert: number
  isLoading?: boolean
}>

function rankPosition(rank: number, cohortCount: number): number {
  if (cohortCount < 2) return 50
  return ((rank - 1) / (cohortCount - 1)) * 100
}

function signed(value: number): string {
  return `${value > 0 ? "+" : ""}${formatDecimal(value)}`
}

export function RankSensitivityRail({
  scenarios,
  taskLabel,
  rankShiftAlert,
  isLoading = false,
}: RankSensitivityRailProps) {
  const id = useId()
  const [selectedEvaluatorId, setSelectedEvaluatorId] = useState(
    scenarios[0]?.evaluatorId ?? "",
  )
  const selectedScenario = useMemo(
    () => scenarios.find((scenario) => scenario.evaluatorId === selectedEvaluatorId) ?? scenarios[0],
    [scenarios, selectedEvaluatorId],
  )
  const highImpactCount = selectedScenario?.rows.filter((row) => row.isHighImpact).length ?? 0

  return (
    <AnalysisPanel
      title="평가자 제외 시 순위 안정성"
      description={`${taskLabel}에서 특정 평가자 원점수 제외 시 공통 평가 대상의 과제 순위 변화`}
      isEmpty={scenarios.length === 0}
      isLoading={isLoading}
    >
      {selectedScenario === undefined ? null : (
        <div className="space-y-4">
          <div className="grid gap-3 border-b border-border-subtle pb-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <div className="grid gap-1.5">
              <label htmlFor={`${id}-evaluator`} className="text-xs font-medium text-muted-foreground">
                제외해 볼 평가자
              </label>
              <Select value={selectedScenario.evaluatorId} onValueChange={setSelectedEvaluatorId}>
                <SelectTrigger id={`${id}-evaluator`} className="w-full bg-card sm:max-w-sm">
                  <SelectValue placeholder="평가자를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {scenarios.map((scenario) => (
                    <SelectItem key={scenario.evaluatorId} value={scenario.evaluatorId}>
                      {scenario.evaluatorLabel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p aria-live="polite" className="text-sm text-muted-foreground">
              공통 평가 대상 {selectedScenario.cohortCount}명 · {rankShiftAlert}위 이상 변동 {highImpactCount}명
            </p>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span><span aria-hidden="true" className="mr-1 inline-block size-2 rounded-full border-2 border-primary bg-card" />기준 순위</span>
            <span><span aria-hidden="true" className="mr-1 inline-block size-2 rounded-full border-2 border-warning bg-card" />평가자 제외 후</span>
            <span>상위권 ← 순위 → 하위권</span>
          </div>
          <ol className="space-y-3" aria-label="평가자 제외 순위 변화">
            {selectedScenario.rows.map((row) => {
              const baselinePosition = rankPosition(row.baselineRank, selectedScenario.cohortCount)
              const excludedPosition = rankPosition(row.excludedRank, selectedScenario.cohortCount)
              return (
                <li
                  key={row.engineerId}
                  className={
                    row.isHighImpact
                      ? "border border-warning/35 bg-warning-soft p-3"
                      : "border border-border-subtle bg-background p-3"
                  }
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{row.engineerLabel}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {row.teamLabel} · 기준 {formatScore(row.baselineScore)} → 제외 후 {formatScore(row.excludedScore)}
                      </p>
                    </div>
                    <p className={row.isHighImpact ? "numeric text-sm font-semibold text-warning" : "numeric text-sm font-semibold"}>
                      {signed(row.rankDelta)}위 변동
                    </p>
                  </div>
                  <div
                    aria-label={`${row.engineerLabel}: 기준 ${row.baselineRank}위, 평가자 제외 후 ${row.excludedRank}위, ${signed(row.rankDelta)}위 변동`}
                    className="relative mt-3 h-7 rounded-sm border border-border-subtle bg-muted/60"
                    role="img"
                  >
                    <span aria-hidden="true" className="absolute top-1/2 h-px -translate-y-1/2 bg-border" style={{ left: `${Math.min(baselinePosition, excludedPosition)}%`, width: `${Math.abs(excludedPosition - baselinePosition)}%` }} />
                    <span aria-hidden="true" className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-card" style={{ left: `${baselinePosition}%` }} />
                    <span aria-hidden="true" className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-warning bg-card" style={{ left: `${excludedPosition}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    기준 {row.baselineRank}위 · 제외 후 {row.excludedRank}위 · 점수 {signed(row.scoreDelta)}점
                  </p>
                </li>
              )
            })}
          </ol>
          <p className="text-xs leading-5 text-muted-foreground">
            해당 과제의 제출 원점수 단순평균만 사용한 시뮬레이션. 공식 가중 점수·최종 순위는 변경 없음
          </p>
        </div>
      )}
    </AnalysisPanel>
  )
}
