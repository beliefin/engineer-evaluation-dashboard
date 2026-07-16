import {
  DEPARTMENTS_BY_TEAM,
  DIVISIONS,
  TEAMS,
  type Department,
  type Division,
  type Team,
} from "@/domain"

export const ROSTER_DIVISIONS = DIVISIONS
export const ROSTER_TEAMS = TEAMS
export const ROSTER_DEPARTMENTS_BY_TEAM = DEPARTMENTS_BY_TEAM

export type RosterDivision = Division
export type RosterTeam = Team
export type RosterDepartment = Department

export function rosterDepartmentsForTeam(team: RosterTeam): readonly RosterDepartment[] {
  return ROSTER_DEPARTMENTS_BY_TEAM[team]
}

export function defaultRosterDepartment(team: RosterTeam): RosterDepartment {
  return team === "생산 1팀" ? "전자약품담당" : "염화메탄담당"
}

export function isRosterDepartmentForTeam(
  team: RosterTeam,
  department: string,
): department is RosterDepartment {
  return rosterDepartmentsForTeam(team).some((candidate) => candidate === department)
}

export interface EngineerRegistration {
  readonly employeeCode: string
  readonly displayName: string
  readonly division: RosterDivision
  readonly team: RosterTeam
  readonly department: RosterDepartment
  readonly position: string
}

export interface EvaluatorRegistration {
  readonly employeeCode: string
  readonly displayName: string
  readonly division: RosterDivision
  readonly team: RosterTeam
  readonly department: RosterDepartment
}

export interface EngineerRosterItem extends EngineerRegistration {
  readonly id: string
  readonly organizationUnit?: string | null
  readonly jobTitle?: string | null
}

export interface EvaluatorRosterItem extends EvaluatorRegistration {
  readonly id: string
  readonly organizationUnit?: string | null
  readonly rank?: string | null
  readonly jobTitle?: string | null
}

export interface BulkRosterError {
  readonly line: number
  readonly message: string
}

export interface BulkParseResult<Row> {
  readonly rows: readonly Row[]
  readonly errors: readonly BulkRosterError[]
}

export interface RosterManagementPanelProps {
  readonly engineers: readonly EngineerRosterItem[]
  readonly evaluators: readonly EvaluatorRosterItem[]
  readonly disabled?: boolean
  readonly onAddEngineers: (
    engineers: readonly EngineerRegistration[],
  ) => boolean
  readonly onUpdateEngineer: (
    engineerId: string,
    engineer: EngineerRegistration,
  ) => boolean
  readonly onDeleteEngineer: (engineerId: string) => boolean
  readonly onAddEvaluators: (
    evaluators: readonly EvaluatorRegistration[],
  ) => boolean
  readonly onUpdateEvaluator: (
    evaluatorId: string,
    evaluator: EvaluatorRegistration,
  ) => boolean
  readonly onDeleteEvaluator: (evaluatorId: string) => boolean
  readonly linkedEngineerIds?: readonly string[]
  readonly linkedEvaluatorIds?: readonly string[]
}
