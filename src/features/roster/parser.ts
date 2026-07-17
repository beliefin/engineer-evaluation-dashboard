import type {
  BulkParseResult,
  BulkRosterError,
  EngineerRegistration,
  EvaluatorRegistration,
  RosterDepartment,
  RosterTeam,
} from "./types"
import { defaultRosterDepartment, ROSTER_TEAMS } from "./types"

interface SourceRow {
  readonly line: number
  readonly cells: readonly string[]
}

export function normalizeEmployeeCode(value: string): string {
  const trimmed = value.trim()
  return /^3101\d{4}$/.test(trimmed) ? trimmed.slice(4) : trimmed
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
    readonly division: "1부문"
    readonly team: RosterTeam
    readonly department: RosterDepartment
  } | null
  readonly errors: readonly BulkRosterError[]
}

function parseCommonRow(
  row: SourceRow,
  defaultTeam: RosterTeam,
  defaultDepartment: RosterDepartment,
  seenCodes: Map<string, string>,
): CommonRowResult {
  const employeeCode = normalizeEmployeeCode(row.cells[0] ?? "")
  const displayName = row.cells[1] ?? ""
  const teamValue = row.cells[2] === "" || row.cells[2] === undefined
    ? defaultTeam
    : row.cells[2]
  const departmentValue = row.cells[3] === "" || row.cells[3] === undefined
    ? isRosterTeam(teamValue) && teamValue !== defaultTeam
      ? defaultRosterDepartment(teamValue)
      : defaultDepartment
    : row.cells[3]
  const errors: BulkRosterError[] = []

  if (employeeCode === "") errors.push({ line: row.line, message: "사번을 입력하세요." })
  if (displayName === "") errors.push({ line: row.line, message: "이름을 입력하세요." })
  if (!isRosterTeam(teamValue)) {
    errors.push({
      line: row.line,
      message: "팀은 생산 1팀 또는 생산 2팀이어야 합니다.",
    })
  }
  if (departmentValue === "") errors.push({ line: row.line, message: "담당을 입력하세요." })
  if (departmentValue.length > 100) errors.push({ line: row.line, message: "담당은 100자 이내로 입력하세요." })

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

  if (
    errors.length > 0 ||
    !isRosterTeam(teamValue) ||
    departmentValue === "" ||
    departmentValue.length > 100
  ) {
    return { value: null, errors }
  }
  return {
    value: {
      employeeCode,
      displayName,
      division: "1부문",
      team: teamValue,
      department: departmentValue,
    },
    errors,
  }
}

function dataRows(text: string): readonly SourceRow[] {
  const rows = toSourceRows(text)
  const firstRow = rows[0]
  return firstRow !== undefined && isHeader(firstRow) ? rows.slice(1) : rows
}

export function parseEngineerRoster(
  text: string,
  defaultTeam: RosterTeam,
  defaultDepartment: RosterDepartment,
): BulkParseResult<EngineerRegistration> {
  const rows: EngineerRegistration[] = []
  const errors: BulkRosterError[] = []
  const seenCodes = new Map<string, string>()

  for (const source of dataRows(text)) {
    const parsed = parseCommonRow(source, defaultTeam, defaultDepartment, seenCodes)
    errors.push(...parsed.errors)
    if (parsed.value === null) continue

    rows.push({
      employeeCode: parsed.value.employeeCode,
      displayName: parsed.value.displayName,
      division: parsed.value.division,
      team: parsed.value.team,
      department: parsed.value.department,
      position: source.cells[4] === "" || source.cells[4] === undefined
        ? "엔지니어"
        : source.cells[4],
    })
  }

  return errors.length === 0 ? { rows, errors } : { rows: [], errors }
}

export function parseEvaluatorRoster(
  text: string,
  defaultTeam: RosterTeam,
  defaultDepartment: RosterDepartment,
): BulkParseResult<EvaluatorRegistration> {
  return parseRows(text, defaultTeam, defaultDepartment)
}

function parseRows(
  text: string,
  defaultTeam: RosterTeam,
  defaultDepartment: RosterDepartment,
): BulkParseResult<EvaluatorRegistration> {
  const rows: EvaluatorRegistration[] = []
  const errors: BulkRosterError[] = []
  const seenCodes = new Map<string, string>()

  for (const source of dataRows(text)) {
    const parsed = parseCommonRow(source, defaultTeam, defaultDepartment, seenCodes)
    errors.push(...parsed.errors)
    if (parsed.value !== null) rows.push(parsed.value)
  }

  return errors.length === 0 ? { rows, errors } : { rows: [], errors }
}
