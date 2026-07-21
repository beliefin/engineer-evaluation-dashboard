import type { Cell, Sheet, SheetData } from "write-excel-file/browser"

import {
  calculateCertificationScore,
  calculateLanguageScore,
  resolveEngineerTaskWeight,
  type EvaluationSnapshot,
  type EvaluationTask,
} from "@/domain"
import { selectDashboardViewModel } from "@/view-models/dashboard"
import { selectEngineerResultSummaries } from "@/view-models/results"

type ExportOptions = Readonly<{ taskId?: string }>
type ExportRow = Readonly<Record<string, string | number | boolean | null>>
type ColumnDefinition = Readonly<{ header: string; key: string; width: number }>

export type SeasonExportSheet = Readonly<{
  name: string
  columns: readonly ColumnDefinition[]
  rows: readonly ExportRow[]
  percentKeys?: ReadonlySet<string>
}>

export type SeasonExportWorkbook = Readonly<{
  title: string
  sheets: readonly SeasonExportSheet[]
}>

const HEADER_FILL = "#2B5278"
const HEADER_TEXT = "#FFFFFF"
const BORDER_COLOR = "#D6DCE0"

function safeSheetName(input: string, existing: ReadonlySet<string>): string {
  const base = input.replace(/[\\/?*\[\]:]/g, " ").replace(/\s+/g, " ").trim().slice(0, 31) || "Sheet"
  if (!existing.has(base)) return base
  let suffix = 2
  while (existing.has(`${base.slice(0, 27)} ${suffix}`)) suffix += 1
  return `${base.slice(0, 27)} ${suffix}`
}

function addDataSheet(
  sheets: SeasonExportSheet[],
  name: string,
  columns: readonly ColumnDefinition[],
  rows: readonly ExportRow[],
  percentKeys?: ReadonlySet<string>,
): void {
  const existing = new Set(sheets.map((sheet) => sheet.name))
  sheets.push({
    name: safeSheetName(name, existing),
    columns,
    rows,
    ...(percentKeys === undefined ? {} : { percentKeys }),
  })
}

function resultLabel(status: "complete" | "incomplete"): string {
  return status === "complete" ? "평가 완료" : "미완료"
}

function taskScoreLabel(task: EvaluationTask, score: number | null, passCount: number | null): string | number | null {
  if (task.method === "evaluator_pass_fail" || task.method === "operator_pass_fail") {
    if (score === null) return null
    return passCount === null ? (score >= 100 ? "P" : "F") : `${passCount}명 P`
  }
  return score
}

function buildTaskRows(
  snapshot: EvaluationSnapshot,
  cycleId: string,
  task: EvaluationTask,
): readonly ExportRow[] {
  return selectEngineerResultSummaries(snapshot, cycleId).map(({ engineer, result }) => {
    const taskResult = result.taskResults.find((entry) => entry.taskId === task.id)
    return {
      employeeCode: engineer.employeeCode,
      name: engineer.displayName,
      division: engineer.division,
      team: engineer.team,
      department: engineer.department,
      position: engineer.position,
      task: task.name,
      method: task.method,
      weight: resolveEngineerTaskWeight(task, engineer.id, snapshot.engineerTaskWeights),
      status: taskResult === undefined ? "해당 없음" : resultLabel(taskResult.status),
      score: taskResult === undefined ? null : taskScoreLabel(task, taskResult.score, taskResult.passCount),
      contribution: result.contributions[task.id] ?? null,
    }
  })
}

function buildEvaluatorRows(
  snapshot: EvaluationSnapshot,
  cycleId: string,
  taskIds: ReadonlySet<string>,
): readonly ExportRow[] {
  const taskById = new Map(snapshot.tasks.map((task) => [task.id, task]))
  const engineerById = new Map(snapshot.engineers.map((engineer) => [engineer.id, engineer]))
  const evaluatorById = new Map(snapshot.evaluators.map((evaluator) => [evaluator.id, evaluator]))
  const resultByEngineer = new Map(
    selectEngineerResultSummaries(snapshot, cycleId).map((entry) => [entry.engineer.id, entry.result]),
  )
  return snapshot.assignments
    .filter((assignment) => assignment.cycleId === cycleId && taskIds.has(assignment.taskId))
    .flatMap((assignment) => {
      const task = taskById.get(assignment.taskId)
      const engineer = engineerById.get(assignment.engineerId)
      const evaluator = evaluatorById.get(assignment.evaluatorId)
      const taskResult = resultByEngineer.get(assignment.engineerId)?.taskResults
        .find((entry) => entry.taskId === assignment.taskId)
      const evaluatorResult = taskResult?.evaluators.find((entry) => entry.assignmentId === assignment.id)
      if (task === undefined || engineer === undefined || evaluator === undefined) return []
      return [{
        engineerCode: engineer.employeeCode,
        engineerName: engineer.displayName,
        team: engineer.team,
        task: task.name,
        evaluatorCode: evaluator.employeeCode,
        evaluatorName: evaluator.displayName,
        rawWeight: assignment.weight,
        normalizedWeight: evaluatorResult === undefined ? null : evaluatorResult.normalizedWeight,
        rawScore: evaluatorResult?.rawScore ?? null,
        passResult: evaluatorResult?.passResult === null || evaluatorResult?.passResult === undefined
          ? null
          : evaluatorResult.passResult ? "P" : "F",
        submitted: evaluatorResult?.submitted === true ? "제출 완료" : "미제출",
      }]
    })
}

export function buildSeasonExportWorkbook(
  snapshot: EvaluationSnapshot,
  cycleId: string,
  options: ExportOptions = {},
): SeasonExportWorkbook {
  const cycle = snapshot.cycles.find((entry) => entry.id === cycleId)
  if (cycle === undefined) throw new RangeError("평가 시즌을 찾을 수 없습니다.")
  const tasks = snapshot.tasks
    .filter((task) => task.cycleId === cycleId && (options.taskId === undefined || task.id === options.taskId))
    .toSorted((left, right) => left.order - right.order)
  if (options.taskId !== undefined && tasks.length === 0) throw new RangeError("평가 과제를 찾을 수 없습니다.")

  const sheets: SeasonExportSheet[] = []
  const title = options.taskId === undefined
    ? `${cycle.name} 전체 평가 데이터`
    : `${cycle.name} ${tasks[0]?.name ?? "과제"} 평가 데이터`

  const taskIds = new Set(tasks.map((task) => task.id))
  if (options.taskId === undefined) {
    const dashboard = selectDashboardViewModel(snapshot, cycleId)
    const rankingByEngineer = new Map(dashboard?.rankingRows.map((row) => [row.id, row]) ?? [])
    const summaryRows = selectEngineerResultSummaries(snapshot, cycleId).map(({ engineer, result }) => {
      const ranking = rankingByEngineer.get(engineer.id)
      return {
        employeeCode: engineer.employeeCode,
        name: engineer.displayName,
        division: engineer.division,
        team: engineer.team,
        department: engineer.department,
        position: engineer.position,
        status: result.status === "complete" ? "최종 확정" : ranking?.totalScore === null ? "점수 없음" : "진행 중",
        rank: ranking?.rank ?? null,
        baseScore: result.baseScore,
        adjustment: result.adjustmentTotal,
        totalScore: ranking?.totalScore ?? null,
      }
    })
    addDataSheet(sheets, "종합 결과", [
      { header: "사번", key: "employeeCode", width: 10 },
      { header: "이름", key: "name", width: 12 },
      { header: "부문", key: "division", width: 10 },
      { header: "팀", key: "team", width: 12 },
      { header: "담당", key: "department", width: 18 },
      { header: "직급", key: "position", width: 12 },
      { header: "상태", key: "status", width: 12 },
      { header: "현재 순위", key: "rank", width: 10 },
      { header: "기본 점수", key: "baseScore", width: 12 },
      { header: "가·감점", key: "adjustment", width: 10 },
      { header: "현재 종합 점수", key: "totalScore", width: 14 },
    ], summaryRows)
  }

  const taskColumns = [
    { header: "사번", key: "employeeCode", width: 10 },
    { header: "이름", key: "name", width: 12 },
    { header: "부문", key: "division", width: 10 },
    { header: "팀", key: "team", width: 12 },
    { header: "담당", key: "department", width: 18 },
    { header: "직급", key: "position", width: 12 },
    { header: "과제", key: "task", width: 24 },
    { header: "평가 방식", key: "method", width: 18 },
    { header: "개인 가중치(%)", key: "weight", width: 15 },
    { header: "상태", key: "status", width: 12 },
    { header: "공식 점수/결과", key: "score", width: 16 },
    { header: "종합 반영 점수", key: "contribution", width: 16 },
  ] as const
  tasks.forEach((task, index) => {
    addDataSheet(sheets, `${index + 1}. ${task.name}`, taskColumns, buildTaskRows(snapshot, cycleId, task))
  })
  if (options.taskId === undefined) {
    addDataSheet(
      sheets,
      "과제별 결과",
      taskColumns,
      tasks.flatMap((task) => buildTaskRows(snapshot, cycleId, task)),
    )
  }

  const evaluatorRows = buildEvaluatorRows(snapshot, cycleId, taskIds)
  if (evaluatorRows.length > 0) {
    addDataSheet(sheets, "평가자별 원점수", [
      { header: "대상 사번", key: "engineerCode", width: 12 },
      { header: "대상 이름", key: "engineerName", width: 12 },
      { header: "팀", key: "team", width: 12 },
      { header: "과제", key: "task", width: 24 },
      { header: "평가자 사번", key: "evaluatorCode", width: 12 },
      { header: "평가자 이름", key: "evaluatorName", width: 12 },
      { header: "원시 가중치", key: "rawWeight", width: 12 },
      { header: "실제 반영 비율", key: "normalizedWeight", width: 14 },
      { header: "원점수", key: "rawScore", width: 10 },
      { header: "P/F", key: "passResult", width: 8 },
      { header: "제출 상태", key: "submitted", width: 12 },
    ], evaluatorRows, new Set(["normalizedWeight"]))
  }

  if (options.taskId === undefined) {
    const rules = snapshot.directScoreRules.filter((rule) => rule.cycleId === cycleId)
    const engineerById = new Map(snapshot.engineers.map((engineer) => [engineer.id, engineer]))
    const languageByEngineer = new Map(snapshot.engineers.map((engineer) => [
      engineer.id,
      calculateLanguageScore(
        snapshot.languageScoreRecords.filter((record) => record.cycleId === cycleId && record.engineerId === engineer.id),
        rules,
        cycle.startsAt,
      ),
    ]))
    const certificationByEngineer = new Map(snapshot.engineers.map((engineer) => [
      engineer.id,
      calculateCertificationScore(
        snapshot.certificationRecords.filter((record) => record.cycleId === cycleId && record.engineerId === engineer.id),
        rules,
        cycle.startsAt,
      ),
    ]))

    addDataSheet(sheets, "어학 기록", [
      { header: "사번", key: "employeeCode", width: 10 },
      { header: "이름", key: "name", width: 12 },
      { header: "팀", key: "team", width: 12 },
      { header: "언어 구분", key: "languageGroup", width: 14 },
      { header: "시험명", key: "examName", width: 18 },
      { header: "현재 결과", key: "result", width: 12 },
      { header: "전년 결과", key: "previousResult", width: 12 },
      { header: "신규 취득", key: "newlyAcquired", width: 10 },
      { header: "취득 년월", key: "acquiredMonth", width: 12 },
      { header: "환산 총점", key: "convertedScore", width: 12 },
      { header: "메모", key: "note", width: 24 },
    ], snapshot.languageScoreRecords.filter((record) => record.cycleId === cycleId).flatMap((record) => {
      const engineer = engineerById.get(record.engineerId)
      if (engineer === undefined) return []
      return [{
        employeeCode: engineer.employeeCode,
        name: engineer.displayName,
        team: engineer.team,
        languageGroup: record.languageGroup === "second_language" ? "제2 외국어" : "영어",
        examName: record.examName,
        result: record.result,
        previousResult: record.previousResult ?? null,
        newlyAcquired: record.newlyAcquired === true ? "예" : "아니오",
        acquiredMonth: record.acquiredOn?.slice(0, 7) ?? null,
        convertedScore: languageByEngineer.get(engineer.id)?.score ?? null,
        note: record.note,
      }]
    }))

    addDataSheet(sheets, "자격증 기록", [
      { header: "사번", key: "employeeCode", width: 10 },
      { header: "이름", key: "name", width: 12 },
      { header: "팀", key: "team", width: 12 },
      { header: "자격증명", key: "certificateName", width: 28 },
      { header: "등급", key: "grade", width: 12 },
      { header: "취득 년월", key: "acquiredMonth", width: 12 },
      { header: "발급기관", key: "issuer", width: 18 },
      { header: "환산 총점", key: "convertedScore", width: 12 },
    ], snapshot.certificationRecords.filter((record) => record.cycleId === cycleId).flatMap((record) => {
      const engineer = engineerById.get(record.engineerId)
      if (engineer === undefined) return []
      return [{
        employeeCode: engineer.employeeCode,
        name: engineer.displayName,
        team: engineer.team,
        certificateName: record.certificateName,
        grade: record.grade,
        acquiredMonth: record.acquiredOn?.slice(0, 7) ?? null,
        issuer: record.issuer,
        convertedScore: certificationByEngineer.get(engineer.id)?.score ?? null,
      }]
    }))

    addDataSheet(sheets, "가감점", [
      { header: "사번", key: "employeeCode", width: 10 },
      { header: "이름", key: "name", width: 12 },
      { header: "팀", key: "team", width: 12 },
      { header: "가·감점", key: "amount", width: 10 },
      { header: "사유", key: "reason", width: 36 },
      { header: "수정 시각", key: "updatedAt", width: 22 },
    ], snapshot.scoreAdjustments.filter((entry) => entry.cycleId === cycleId).flatMap((entry) => {
      const engineer = engineerById.get(entry.engineerId)
      return engineer === undefined ? [] : [{
        employeeCode: engineer.employeeCode,
        name: engineer.displayName,
        team: engineer.team,
        amount: entry.amount,
        reason: entry.reason,
        updatedAt: entry.updatedAt,
      }]
    }))
  }

  return { title, sheets }
}

function toCell(value: ExportRow[string], format?: string): Cell {
  if (value === null) return null
  return {
    value,
    ...(format === undefined ? {} : { format }),
    alignVertical: "top",
    wrap: true,
    bottomBorderColor: BORDER_COLOR,
    bottomBorderStyle: "thin",
  }
}

function toWorkbookSheet(sheet: SeasonExportSheet): Sheet<Blob> {
  const header = sheet.columns.map((column) => ({
    value: column.header,
    fontWeight: "bold" as const,
    textColor: HEADER_TEXT,
    backgroundColor: HEADER_FILL,
    align: "center" as const,
    alignVertical: "center" as const,
    height: 24,
  }))
  const data: SheetData = [
    header,
    ...sheet.rows.map((row) => sheet.columns.map((column) => (
      toCell(row[column.key] ?? null, sheet.percentKeys?.has(column.key) === true ? "0.0%" : undefined)
    ))),
  ]
  return {
    data,
    sheet: sheet.name,
    columns: sheet.columns.map((column) => ({ width: column.width })),
    stickyRowsCount: 1,
    showGridLines: false,
  }
}

export async function downloadSeasonExport(
  snapshot: EvaluationSnapshot,
  cycleId: string,
  options: ExportOptions = {},
): Promise<void> {
  const cycle = snapshot.cycles.find((entry) => entry.id === cycleId)
  if (cycle === undefined) throw new RangeError("평가 시즌을 찾을 수 없습니다.")
  const workbook = buildSeasonExportWorkbook(snapshot, cycleId, options)
  const task = options.taskId === undefined
    ? "전체"
    : snapshot.tasks.find((entry) => entry.id === options.taskId)?.name ?? "과제"
  const filename = `${cycle.name}_${task}_평가데이터_${new Date().toISOString().slice(0, 10)}.xlsx`
    .replace(/[\\/:*?"<>|]/g, "-")
  const { default: writeExcelFile } = await import("write-excel-file/browser")
  await writeExcelFile(workbook.sheets.map(toWorkbookSheet), {
    fontFamily: "Pretendard",
    fontSize: 10,
  }).toFile(filename)
}
