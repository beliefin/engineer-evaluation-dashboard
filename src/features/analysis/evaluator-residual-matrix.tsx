"use client"

import { HorizontalScroll } from "@/components/ui/horizontal-scroll"

import { AlertTriangle } from "lucide-react"

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { AnalysisPanel } from "./analysis-panel"
import { formatDecimal, formatScore } from "./format"
import type { EvaluatorResidualDatum } from "./types"

import "./analysis-summary-signal.css"

type ResidualMatrixProps = Readonly<{
  data: readonly EvaluatorResidualDatum[]
  taskLabel: string
  outlierThreshold: number
  isLoading?: boolean
}>

type EngineerRow = Readonly<{
  engineerId: string
  engineerLabel: string
  teamLabel: string
  averageScore: number
  cells: ReadonlyMap<string, EvaluatorResidualDatum>
}>

function signed(value: number): string {
  return `${value > 0 ? "+" : ""}${formatDecimal(value)}점`
}

function evaluatorPriority(label: string): number {
  if (label === "박경철") return 0
  if (label === "박상홍") return 1
  if (label === "박주현") return 2
  return 3
}

function evaluators(data: readonly EvaluatorResidualDatum[]): readonly Readonly<{ id: string; label: string }>[] {
  const entries = new Map<string, string>()
  for (const entry of data) entries.set(entry.evaluatorId, entry.evaluatorLabel)
  return Array.from(entries.entries())
    .map(([id, label]) => ({ id, label }))
    .toSorted((left, right) => {
      const priorityDifference = evaluatorPriority(left.label) - evaluatorPriority(right.label)
      if (priorityDifference !== 0) return priorityDifference
      const labelDifference = left.label.localeCompare(right.label, "ko")
      return labelDifference !== 0 ? labelDifference : left.id.localeCompare(right.id)
    })
}

function engineers(data: readonly EvaluatorResidualDatum[]): readonly EngineerRow[] {
  const rows = new Map<string, {
    engineerLabel: string
    teamLabel: string
    cells: Map<string, EvaluatorResidualDatum>
  }>()
  for (const entry of data) {
    const row = rows.get(entry.engineerId)
    if (row === undefined) {
      rows.set(entry.engineerId, {
        engineerLabel: entry.engineerLabel,
        teamLabel: entry.teamLabel,
        cells: new Map([[entry.evaluatorId, entry]]),
      })
    } else {
      row.cells.set(entry.evaluatorId, entry)
    }
  }
  return Array.from(rows.entries())
    .map(([engineerId, row]) => {
      const scores = Array.from(row.cells.values(), (entry) => entry.score)
      const averageScore = scores.reduce((total, score) => total + score, 0) / scores.length
      return { engineerId, ...row, averageScore }
    })
    .toSorted((left, right) => left.engineerLabel.localeCompare(right.engineerLabel, "ko"))
}

function cellClass(entry: EvaluatorResidualDatum | undefined): string {
  if (entry === undefined) return "bg-muted text-muted-foreground"
  if (entry.residual >= 0 && entry.isOutlier) return "bg-warning-soft font-semibold text-warning"
  if (entry.residual < 0 && entry.isOutlier) return "bg-danger-soft font-semibold text-destructive"
  if (entry.residual > 0) return "bg-accent text-primary"
  if (entry.residual < 0) return "bg-muted text-foreground"
  return "bg-background text-muted-foreground"
}

export function EvaluatorResidualMatrix({
  data,
  taskLabel,
  outlierThreshold,
  isLoading = false,
}: ResidualMatrixProps) {
  const evaluatorColumns = evaluators(data)
  const engineerRows = engineers(data)
  const outlierCount = data.filter((entry) => entry.isOutlier).length

  return (
    <div className="signal-analysis-panel signal-analysis-residuals">
      <AnalysisPanel
        title="평가자×엔지니어 편차 매트릭스"
        description={`${taskLabel}의 엔지니어 평균과 평가자별 편차를 함께 보여줍니다. 편차는 해당 평가자의 점수에서 다른 평가자 평균을 뺀 값입니다.`}
        isEmpty={data.length === 0}
        isLoading={isLoading}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>양수는 다른 평가자 평균보다 높게, 음수는 낮게 평가한 경우입니다.</p>
          <span className="inline-flex items-center gap-1.5 font-medium text-warning">
            <AlertTriangle aria-hidden="true" className="size-3.5" />
            ±{formatDecimal(outlierThreshold)}점 이상 {outlierCount}건
          </span>
        </div>
        <HorizontalScroll className="signal-analysis-residual-scroll mt-4 overflow-x-auto border border-border-subtle" role="region" aria-label="평가자와 엔지니어 편차표 가로 스크롤 영역" tabIndex={0}>
          <Table scrollable={false} className="min-w-max text-xs">
            <TableCaption className="sr-only">
              {taskLabel} 엔지니어 평균과 평가자별 다른 평가자 평균 대비 편차 매트릭스
            </TableCaption>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="sticky left-0 z-10 min-w-32 bg-card">엔지니어</TableHead>
                <TableHead className="min-w-24 border-r border-border-subtle bg-accent text-right">
                  엔지니어 평균
                </TableHead>
                {evaluatorColumns.map((evaluator) => (
                  <TableHead key={evaluator.id} className="min-w-24 text-right">
                    {evaluator.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {engineerRows.map((row) => (
                <TableRow key={row.engineerId}>
                  <TableCell className="sticky left-0 z-10 bg-card">
                    <span className="block font-medium">{row.engineerLabel}</span>
                    <span className="block text-xs text-muted-foreground">{row.teamLabel}</span>
                  </TableCell>
                  <TableCell
                    aria-label={`${row.engineerLabel} 평균 점수 ${formatScore(row.averageScore)}`}
                    className="numeric border-r border-border-subtle bg-accent text-right font-semibold text-primary"
                  >
                    {formatScore(row.averageScore)}
                  </TableCell>
                  {evaluatorColumns.map((evaluator) => {
                    const entry = row.cells.get(evaluator.id)
                    return (
                      <TableCell
                        key={evaluator.id}
                        data-observed={entry !== undefined}
                        data-outlier={entry?.isOutlier ?? false}
                        aria-label={
                          entry === undefined
                            ? `${row.engineerLabel}, ${evaluator.label}, 제출 점수 없음`
                            : `${row.engineerLabel}, ${evaluator.label}, 원점수 ${formatScore(entry.score)}, 다른 평가자 평균 ${formatScore(entry.leaveOneOutAverage)}, 편차 ${signed(entry.residual)}`
                        }
                        className={`numeric text-right ${cellClass(entry)}`}
                      >
                        {entry === undefined ? "—" : signed(entry.residual)}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </HorizontalScroll>
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          엔지니어 평균은 제출된 평가자 원점수의 단순 평균입니다. 표본이 한 명뿐인 평가는 비교 대상이 없으므로 표시하지 않습니다. 셀의 원점수와 비교 평균은 접근 가능한 이름으로 함께 제공됩니다.
        </p>
      </AnalysisPanel>
    </div>
  )
}
