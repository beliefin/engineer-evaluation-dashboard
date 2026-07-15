import type {
  BulkParseResult,
  BulkRosterError,
  EngineerRegistration,
  EvaluatorRegistration,
  RosterTeam,
} from "./types"
import { ROSTER_TEAMS } from "./types"

interface SourceRow {
  readonly line: number
  readonly cells: readonly string[]
}

function toSourceRows(text: string): readonly SourceRow[] {
  return text
    .split(/\r?\n/)
    .map((line, index) => ({
      line: index + 1,
      cells: line.split(/[\t,]/).map((cell) => cell.trim()),
    }))
    .filter((row) => row.cells.some((cell) => cell !== ""))
}

function isHeader(row: SourceRow): boolean {
  const code = row.cells[0]?.replaceAll(" ", "") ?? ""
  const name = row.cells[1]?.replaceAll(" ", "") ?? ""
  return code.includes("사번") && name.includes("이름")
}

function isRosterTeam(value: string): value is RosterTeam {
  return ROSTER_TEAMS.some((team) => team === value)
}

interface CommonRowResult {
  readonly value: {
    readonly employeeCode: string
    readonly displayName: string
    readonly team: RosterTeam
  } | null
  readonly errors: readonly BulkRosterError[]
}

function parseCommonRow(
  row: SourceRow,
  defaultTeam: RosterTeam,
  seenCodes: Map<string, string>,
): CommonRowResult {
  const employeeCode = row.cells[0] ?? ""
  const displayName = row.cells[1] ?? ""
  const teamValue = row.cells[2] === "" || row.cells[2] === undefined
    ? defaultTeam
    : row.cells[2]
  const errors: BulkRosterError[] = []

  if (employeeCode === "") errors.push({ line: row.line, message: "사번을 입력하세요." })
  if (displayName === "") errors.push({ line: row.line, message: "이름을 입력하세요." })
  if (!isRosterTeam(teamValue)) {
    errors.push({
      line: row.line,
      message: "팀은 생산 1팀 또는 생산 2팀이어야 합니다.",
    })
  }

  const codeKey = employeeCode.toLocaleUpperCase("ko-KR")
  const firstCode = seenCodes.get(codeKey)
  if (employeeCode !== "" && firstCode !== undefined) {
    errors.push({
      line: row.line,
      message: `사번 ${firstCode}이(가) 목록 안에서 중복되었습니다.`,
    })
  } else if (employeeCode !== "") {
    seenCodes.set(codeKey, employeeCode)
  }

  if (errors.length > 0 || !isRosterTeam(teamValue)) {
    return { value: null, errors }
  }
  return { value: { employeeCode, displayName, team: teamValue }, errors }
}

function dataRows(text: string): readonly SourceRow[] {
  const rows = toSourceRows(text)
  const firstRow = rows[0]
  return firstRow !== undefined && isHeader(firstRow) ? rows.slice(1) : rows
}

export function parseEngineerRoster(
  text: string,
  defaultTeam: RosterTeam,
): BulkParseResult<EngineerRegistration> {
  const rows: EngineerRegistration[] = []
  const errors: BulkRosterError[] = []
  const seenCodes = new Map<string, string>()

  for (const source of dataRows(text)) {
    const parsed = parseCommonRow(source, defaultTeam, seenCodes)
    errors.push(...parsed.errors)
    if (parsed.value === null) continue

    rows.push({
      employeeCode: parsed.value.employeeCode,
      displayName: parsed.value.displayName,
      team: parsed.value.team,
      position: source.cells[3] === "" || source.cells[3] === undefined
        ? "엔지니어"
        : source.cells[3],
    })
  }

  return errors.length === 0 ? { rows, errors } : { rows: [], errors }
}

export function parseEvaluatorRoster(
  text: string,
  defaultTeam: RosterTeam,
): BulkParseResult<EvaluatorRegistration> {
  return parseRows(text, defaultTeam)
}

function parseRows(
  text: string,
  defaultTeam: RosterTeam,
): BulkParseResult<EvaluatorRegistration> {
  const rows: EvaluatorRegistration[] = []
  const errors: BulkRosterError[] = []
  const seenCodes = new Map<string, string>()

  for (const source of dataRows(text)) {
    const parsed = parseCommonRow(source, defaultTeam, seenCodes)
    errors.push(...parsed.errors)
    if (parsed.value !== null) rows.push(parsed.value)
  }

  return errors.length === 0 ? { rows, errors } : { rows: [], errors }
}
