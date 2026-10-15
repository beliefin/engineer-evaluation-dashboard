"use client"

import { useState } from "react"

import type { EvaluationSnapshot } from "@/domain"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { downloadSeasonExport } from "./season-export"
import "./report-signal.css"

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
    <section className="signal-report-export print:hidden" aria-labelledby="season-export-title">
      <h2 className="signal-report-bar" id="season-export-title">평가 데이터 Excel 출력</h2>
      <div className="signal-report-export-body">
        <p>
          엔지니어 명단을 기준으로 종합 결과, 과제별 점수, 평가자 원점수, 어학·자격증, 가·감점을 각각 구분한 Excel 파일을 만듭니다.
        </p>
        <div className="signal-report-export-actions">
          <Button
            className="signal-report-export-all"
            disabled={exporting !== null}
            onClick={() => exportWorkbook("all")}
            type="button"
          >
            {exporting === "all" ? "전체 파일 생성 중" : "전체 데이터 Excel"}
          </Button>
          <div className="signal-report-export-task">
            <Label htmlFor="season-export-task">과제별 출력</Label>
            <Select onValueChange={setTaskId} value={taskId}>
              <SelectTrigger id="season-export-task"><SelectValue placeholder="과제 선택" /></SelectTrigger>
              <SelectContent className="signal-report-export-options">{tasks.map((task) => <SelectItem key={task.id} value={task.id}>{task.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button
            className="signal-report-export-selected"
            disabled={exporting !== null || taskId === ""}
            onClick={() => exportWorkbook("task")}
            type="button"
            variant="outline"
          >
            {exporting === "task" ? "과제 파일 생성 중" : "선택 과제 Excel"}
          </Button>
        </div>
        {exporting === null ? null : <p className="signal-report-export-status" role="status">Excel 파일을 만들고 있습니다.</p>}
        {error === null ? null : <p className="signal-report-export-error" role="alert">{error}</p>}
      </div>
    </section>
  )
}
