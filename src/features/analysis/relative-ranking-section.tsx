"use client"

import { useMemo, useState } from "react"
import { SlidersHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  calculateRelativeRanking,
  type RelativeRankingCandidate,
  type RelativeRankingPoint,
} from "@/view-models/relative-ranking"

import { RelativeRankingChart } from "./relative-ranking-chart"
import { RelativeRankingSelector } from "./relative-ranking-selector"
import { RelativeRankingTable } from "./relative-ranking-table"

type RelativeRankingSectionProps = Readonly<{
  candidates: readonly RelativeRankingCandidate[]
  seasonLabel: string
}>

function formatScore(value: number | null): string {
  return value === null ? "—" : `${value.toFixed(1)}점`
}

function gradeLabel(point: RelativeRankingPoint): string {
  if (point.grade === "SA") return "S/A"
  if (point.grade === "unavailable") return "분석 불가"
  return point.grade
}

export function RelativeRankingSection({
  candidates,
  seasonLabel,
}: RelativeRankingSectionProps) {
  const selectableIds = useMemo(() => candidates.flatMap((candidate) => (
    candidate.score === null ? [] : [candidate.engineerId]
  )), [candidates])
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(
    () => new Set(selectableIds),
  )
  const [selectedEngineerId, setSelectedEngineerId] = useState<string | null>(null)
  const selectedCandidates = candidates.filter((candidate) => (
    candidate.score !== null && selectedIds.has(candidate.engineerId)
  ))
  const analysis = calculateRelativeRanking(selectedCandidates)
  const selectedPoint = analysis.points.find((point) => (
    point.engineerId === selectedEngineerId
  )) ?? null

  function toggle(engineerId: string) {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(engineerId)) next.delete(engineerId)
      else if (selectableIds.includes(engineerId)) next.add(engineerId)
      return next
    })
    if (selectedEngineerId === engineerId) setSelectedEngineerId(null)
  }

  function selectMany(engineerIds: readonly string[]) {
    setSelectedIds((current) => new Set([...current, ...engineerIds]))
  }

  const selector = (
    <RelativeRankingSelector
      candidates={candidates}
      selectedIds={selectedIds}
      onToggle={toggle}
      onSelectMany={selectMany}
      onClear={() => {
        setSelectedIds(new Set())
        setSelectedEngineerId(null)
      }}
      onReset={() => {
        setSelectedIds(new Set(selectableIds))
        setSelectedEngineerId(null)
      }}
    />
  )
  const partialCount = selectedCandidates.filter((candidate) => (
    candidate.scoreStatus === "partial"
  )).length
  const analysisMessages = (
    <>
      {analysis.warning !== null ? (
        <p role="status" className="rounded-md border border-warning/30 bg-warning-soft px-3 py-2 text-warning">
          {analysis.warning}
        </p>
      ) : null}
      {partialCount > 0 ? (
        <p className="text-muted-foreground">
          미완료 부분점수 {partialCount}명이 현재 선택 집단에 포함됩니다.
        </p>
      ) : null}
      {analysis.boundaryTies.map((tie) => (
        <p key={tie.boundary} role="alert" className="rounded-md border border-destructive/30 bg-danger-soft px-3 py-2 text-destructive">
          {tie.boundary === "BSA" ? "S/A·B" : "B·C"} 경계에 동점 {tie.count}명이 있습니다. 추가 기준 검토가 필요합니다.
        </p>
      ))}
      {analysis.bsaDensityCount >= 3 ? (
        <p className="text-muted-foreground">
          S/A 경계 {analysis.bsaDensityCount}명이 {(analysis.boundaryWindow * 2).toFixed(1)}점 범위에 밀집되어 있습니다.
        </p>
      ) : null}
      {analysis.cbDensityCount >= 3 ? (
        <p className="text-muted-foreground">
          C/B 경계 {analysis.cbDensityCount}명이 {(analysis.boundaryWindow * 2).toFixed(1)}점 범위에 밀집되어 있습니다.
        </p>
      ) : null}
    </>
  )

  return (
    <section aria-labelledby="relative-ranking-heading" className="overflow-hidden rounded-lg border bg-card">
      <div className="border-b px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-primary">{seasonLabel}</p>
            <h2 id="relative-ranking-heading" className="mt-1 text-xl font-semibold tracking-tight">
              선택 집단 상대 서열 분석
            </h2>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              체크된 인원만으로 순위와 등급을 다시 계산합니다. 미완료자는 현재 부분점수로 포함합니다.
            </p>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button type="button" variant="outline" className="lg:hidden">
                <SlidersHorizontal aria-hidden="true" />
                분석 대상 {selectedIds.size}명
              </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto" side="right">
              <SheetHeader>
                <SheetTitle>분석 대상 선택</SheetTitle>
                <SheetDescription>체크 변경 즉시 상대 순위와 구간이 다시 계산됩니다.</SheetDescription>
              </SheetHeader>
              <div className="px-4 pb-6">{selector}</div>
            </SheetContent>
          </Sheet>
        </div>

        <dl className="mt-5 grid grid-cols-4 border-y xl:grid-cols-8">
          {[
            ["선택 인원", `${analysis.selectedCount}명`],
            ["S/A", `${analysis.gradeCounts.sa}명`],
            ["B", `${analysis.gradeCounts.b}명`],
            ["C", `${analysis.gradeCounts.c}명`],
            ["S/A 진입", formatScore(analysis.saCutoff)],
            ["B 진입", formatScore(analysis.bCutoff)],
            ["S/A 경계차", formatScore(analysis.bsaGap)],
            ["C/B 경계차", formatScore(analysis.cbGap)],
          ].map(([label, value], index) => (
            <div key={label} className={`px-2 py-3 sm:px-3 ${index % 4 === 0 ? "" : "border-l"} ${index > 3 ? "border-t xl:border-t-0" : ""} ${index === 4 ? "xl:border-l" : ""}`}>
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="mt-1 font-semibold tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-4 hidden space-y-2 text-sm sm:block" aria-live="polite">
          {analysisMessages}
        </div>
      </div>

      <div className="grid min-w-0 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden border-r p-5 lg:block">{selector}</aside>
        <div className="min-w-0 p-4 sm:p-6">
          <p className="mb-2 text-xs text-muted-foreground">
            명목 구간 · C 하위 20% · B 중간 50% · S/A 상위 30%
          </p>
          <RelativeRankingChart
            analysis={analysis}
            selectedEngineerId={selectedEngineerId}
            onSelectEngineer={setSelectedEngineerId}
          />
          <div className="mt-4 space-y-2 text-sm sm:hidden" aria-live="polite">
            {analysisMessages}
          </div>

          {selectedPoint !== null ? (
            <div className="mt-5 border-t pt-4" aria-live="polite">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-semibold">{selectedPoint.engineerName}</h3>
                <span className="text-xs text-muted-foreground">
                  {selectedPoint.employeeCode} · {selectedPoint.team} · {selectedPoint.department}
                </span>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
                {[
                  ["현재 점수", `${selectedPoint.score.toFixed(1)}점`],
                  ["선택 집단 순위", `${selectedPoint.standardRank}위 / ${analysis.selectedCount}명`],
                  ["상위 백분위", `${selectedPoint.topPercentile.toFixed(1)}%`],
                  ["명목 구간", gradeLabel(selectedPoint)],
                  ["바로 위와 차이", formatScore(selectedPoint.gapToHigher)],
                  ["바로 아래와 차이", formatScore(selectedPoint.gapToLower)],
                  ["과제 반영", `${selectedPoint.completedTaskCount}/${selectedPoint.taskCount}`],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd className="mt-1 font-medium tabular-nums">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}

          <RelativeRankingTable
            points={analysis.points}
            selectedEngineerId={selectedEngineerId}
            onSelectEngineer={setSelectedEngineerId}
          />
        </div>
      </div>
    </section>
  )
}
