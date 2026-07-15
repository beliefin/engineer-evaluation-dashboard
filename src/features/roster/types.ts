export const ROSTER_TEAMS = ["생산 1팀", "생산 2팀"] as const

export type RosterTeam = (typeof ROSTER_TEAMS)[number]

export interface EngineerRegistration {
  readonly employeeCode: string
  readonly displayName: string
  readonly team: RosterTeam
  readonly position: string
}

export interface EvaluatorRegistration {
  readonly employeeCode: string
  readonly displayName: string
  readonly team: RosterTeam
}

export interface EngineerRosterItem extends EngineerRegistration {
  readonly id: string
}

export interface EvaluatorRosterItem extends EvaluatorRegistration {
  readonly id: string
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
  readonly onAddEvaluators: (
    evaluators: readonly EvaluatorRegistration[],
  ) => boolean
}
