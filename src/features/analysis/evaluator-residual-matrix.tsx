"use client"

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
  cells: ReadonlyMap<string, EvaluatorResidualDatum>
}>

function signed(value: number): string {
  return `${value > 0 ? "+" : ""}${formatDecimal(value)}점`
}

function evaluators(data: readonly EvaluatorResidualDatum[]): readonly Readonly<{ id: string; label: string }>[] {
  const entries = new Map<string, string>()
  for (const entry of data) entries.set(entry.evaluatorId, entry.evaluatorLabel)
  return Array.from(entries.entries())
    .map(([id, label]) => ({ id, label }))
    .toSorted((left, right) => left.label.localeCompare(right.label, "ko"))
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
    .map(([engineerId, row]) => ({ engineerId, ...row }))
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
    <AnalysisPanel
      title="평가자×엔지니어 편차 매트릭스"
      description={`${taskLabel}에서 각 셀은 해당 평가자의 점수에서 다른 평가자 평균을 뺀 값입니다. 본인의 점수는 비교 평균에서 제외합니다.`}
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
      <div className="mt-4 overflow-x-auto rounded-md border border-border-subtle">
        <Table className="min-w-max text-xs">
          <TableCaption className="sr-only">
            {taskLabel} 평가자별 다른 평가자 평균 대비 편차 매트릭스
          </TableCaption>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="sticky left-0 z-10 min-w-32 bg-card">엔지니어</TableHead>
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
                {evaluatorColumns.map((evaluator) => {
                  const entry = row.cells.get(evaluator.id)
                  return (
                    <TableCell
                      key={evaluator.id}
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
      </div>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">
        표본이 한 명뿐인 평가는 비교 대상이 없으므로 표시하지 않습니다. 셀의 원점수와 비교 평균은 접근 가능한 이름으로 함께 제공됩니다.
      </p>
    </AnalysisPanel>
  )
}
