import type { Cell, Sheet, SheetData } from "write-excel-file/browser"

import type { CompletedRankingRow, TaskRankingSection } from "./dashboard-view-models"

type ExportValue = string | number | boolean | null
type ExportRow = Readonly<Record<string, ExportValue>>
type ColumnDefinition = Readonly<{ header: string; key: string; width: number }>

export type RankingExportSheet = Readonly<{
  name: string
  columns: readonly ColumnDefinition[]
  rows: readonly ExportRow[]
}>

export type RankingExportWorkbook = Readonly<{
  title: string
  sheets: readonly RankingExportSheet[]
}>

const HEADER_FILL = "#2B5278"
const HEADER_TEXT = "#FFFFFF"
const BORDER_COLOR = "#D6DCE0"

const TASK_COLUMNS = [
  { header: "과제", key: "task", width: 24 },
  { header: "순위", key: "rank", width: 9 },
  { header: "엔지니어", key: "name", width: 14 },
  { header: "팀", key: "team", width: 14 },
  { header: "과제 평균", key: "score", width: 12 },
  { header: "평가 상태", key: "status", width: 12 },
  { header: "공동 순위", key: "tied", width: 11 },
] as const

const OVERALL_COLUMNS = [
  { header: "순위", key: "rank", width: 9 },
  { header: "엔지니어", key: "name", width: 14 },
  { header: "팀", key: "team", width: 14 },
  { header: "현재 종합 점수", key: "totalScore", width: 16 },
  { header: "상태", key: "status", width: 12 },
  { header: "반영 과제", key: "taskProgress", width: 12 },
  { header: "공동 순위", key: "tied", width: 11 },
] as const

function safeSheetName(input: string, existing: ReadonlySet<string>): string {
  const base = input.replace(/[\\/?*\[\]:]/g, " ").replace(/\s+/g, " ").trim().slice(0, 31) || "Sheet"
  if (!existing.has(base)) return base
  let suffix = 2
  while (existing.has(`${base.slice(0, 27)} ${suffix}`)) suffix += 1
  return `${base.slice(0, 27)} ${suffix}`
}

function taskStatusLabel(status: TaskRankingSection["rows"][number]["status"]): string {
  if (status === "complete") return "평가 완료"
  if (status === "in_progress") return "진행 중"
  return "미진행"
}

function overallStatusLabel(status: CompletedRankingRow["status"]): string {
  if (status === "confirmed") return "최종 확정"
  if (status === "in_progress") return "진행 중"
  return "미진행"
}

function buildTaskRows(rankings: readonly TaskRankingSection[]): readonly ExportRow[] {
  return rankings.flatMap((ranking) => ranking.rows.map((row) => ({
    task: ranking.label,
    rank: row.rank,
    name: row.name,
    team: row.team,
    score: row.score,
    status: taskStatusLabel(row.status),
    tied: row.isTied ? "공동 순위" : "",
  })))
}

export function buildTaskRankingWorkbook(
  cycleLabel: string,
  scopeLabel: string,
  rankings: readonly TaskRankingSection[],
): RankingExportWorkbook {
  const sheets: RankingExportSheet[] = [{
    name: "전체 과제 순위",
    columns: TASK_COLUMNS,
    rows: buildTaskRows(rankings),
  }]

  rankings.forEach((ranking, index) => {
    const existing = new Set(sheets.map((sheet) => sheet.name))
    sheets.push({
      name: safeSheetName(`${index + 1}. ${ranking.label}`, existing),
      columns: TASK_COLUMNS,
      rows: buildTaskRows([ranking]),
    })
  })

  return {
    title: `${cycleLabel} ${scopeLabel} 과제별 순위`,
    sheets,
  }
}

export function buildOverallRankingWorkbook(
  cycleLabel: string,
  scopeLabel: string,
  rows: readonly CompletedRankingRow[],
): RankingExportWorkbook {
  return {
    title: `${cycleLabel} ${scopeLabel} 종합 순위`,
    sheets: [{
      name: "종합 순위",
      columns: OVERALL_COLUMNS,
      rows: rows.map((row) => ({
        rank: row.rank,
        name: row.name,
        team: row.team,
        totalScore: row.totalScore,
        status: overallStatusLabel(row.status),
        taskProgress: row.completedTaskCount === undefined || row.taskCount === undefined
          ? ""
          : `${row.completedTaskCount}/${row.taskCount}`,
        tied: row.isTied === true ? "공동 순위" : "",
      })),
    }],
  }
}

function toCell(value: ExportValue): Cell {
  if (value === null) return null
  return {
    value,
    alignVertical: "top",
    wrap: true,
    bottomBorderColor: BORDER_COLOR,
    bottomBorderStyle: "thin",
  }
}

function toWorkbookSheet(sheet: RankingExportSheet): Sheet<Blob> {
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
    ...sheet.rows.map((row) => sheet.columns.map((column) => toCell(row[column.key] ?? null))),
  ]
  return {
    data,
    sheet: sheet.name,
    columns: sheet.columns.map((column) => ({ width: column.width })),
    stickyRowsCount: 1,
    showGridLines: false,
  }
}

function filenamePart(value: string): string {
  return value.replace(/[\\/:*?"<>|]/g, "-")
}

async function downloadWorkbook(workbook: RankingExportWorkbook): Promise<void> {
  const { default: writeExcelFile } = await import("write-excel-file/browser")
  await writeExcelFile(workbook.sheets.map(toWorkbookSheet), {
    fontFamily: "Pretendard",
    fontSize: 10,
  }).toFile(`${filenamePart(workbook.title)}_${new Date().toISOString().slice(0, 10)}.xlsx`)
}

export async function downloadTaskRankingsExcel(
  cycleLabel: string,
  scopeLabel: string,
  rankings: readonly TaskRankingSection[],
): Promise<void> {
  await downloadWorkbook(buildTaskRankingWorkbook(cycleLabel, scopeLabel, rankings))
}

export async function downloadOverallRankingExcel(
  cycleLabel: string,
  scopeLabel: string,
  rows: readonly CompletedRankingRow[],
): Promise<void> {
  await downloadWorkbook(buildOverallRankingWorkbook(cycleLabel, scopeLabel, rows))
}
