"use client"

import { useState } from "react"

import type { EvaluationSnapshot } from "@/domain"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { downloadSeasonExport } from "./season-export"

type Props = Readonly<{
  snapshot: EvaluationSnapshot
  cycleId: string
}>

export function SeasonExportPanel({ snapshot, cycleId }: Props) {
  const tasks = snapshot.tasks
    .filter((task) => task.cycleId === cycleId)
    .toSorted((left, right) => left.order - right.order)
  const [taskId, setTaskId] = useState(tasks[0]?.id ?? "")
  const [exporting, setExporting] = useState<"all" | "task" | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function exportWorkbook(scope: "all" | "task") {
    setExporting(scope)
    setError(null)
    try {
      await downloadSeasonExport(snapshot, cycleId, scope === "task" ? { taskId } : {})
    } catch {
      setError("Excel 파일을 만들지 못했습니다. 잠시 후 다시 시도해 주세요.")
    } finally {
      setExporting(null)
    }
  }

  return (
    <section className="print:hidden" aria-labelledby="season-export-title">
      <div className="border-y border-border bg-muted/35 px-5 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-base font-semibold" id="season-export-title">평가 데이터 Excel 출력</h2>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">
              엔지니어 명단을 기준으로 종합 결과, 과제별 점수, 평가자 원점수, 어학·자격증, 가·감점을 각각 구분한 Excel 파일을 만듭니다.
            </p>
          </div>
          <Button
            disabled={exporting !== null}
            onClick={() => exportWorkbook("all")}
            type="button"
          >
            {exporting === "all" ? "전체 파일 생성 중" : "전체 데이터 Excel"}
          </Button>
        </div>
        <div className="mt-4 grid gap-3 border-t border-border-subtle pt-4 sm:grid-cols-[minmax(0,24rem)_auto] sm:items-end">
          <div>
            <Label htmlFor="season-export-task">과제별 출력</Label>
            <Select onValueChange={setTaskId} value={taskId}>
              <SelectTrigger className="mt-1.5 w-full" id="season-export-task"><SelectValue placeholder="과제 선택" /></SelectTrigger>
              <SelectContent>{tasks.map((task) => <SelectItem key={task.id} value={task.id}>{task.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button
            disabled={exporting !== null || taskId === ""}
            onClick={() => exportWorkbook("task")}
            type="button"
            variant="outline"
          >
            {exporting === "task" ? "과제 파일 생성 중" : "선택 과제 Excel"}
          </Button>
        </div>
        {error === null ? null : <p className="mt-3 text-sm text-destructive" role="alert">{error}</p>}
      </div>
    </section>
  )
}
