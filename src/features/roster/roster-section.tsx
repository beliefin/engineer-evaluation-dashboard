import { BulkRegistrationDialog } from "./bulk-registration-dialog"
import { RosterList } from "./roster-list"
import { SingleRegistrationDialog } from "./single-registration-dialog"
import type {
  EngineerRegistration,
  EngineerRosterItem,
  EvaluatorRegistration,
  EvaluatorRosterItem,
  RosterDepartmentOptions,
} from "./types"

interface RosterSectionProps {
  readonly kind: "engineer" | "evaluator"
  readonly rows: readonly (EngineerRosterItem | EvaluatorRosterItem)[]
  readonly disabled: boolean
  readonly departmentOptions: RosterDepartmentOptions
  readonly onAddEngineers: (rows: readonly EngineerRegistration[]) => boolean
  readonly onAddEvaluators: (rows: readonly EvaluatorRegistration[]) => boolean
  readonly onUpdateEngineer: (engineerId: string, row: EngineerRegistration) => boolean
  readonly onDeleteEngineer: (engineerId: string) => boolean
  readonly onUpdateEvaluator: (evaluatorId: string, row: EvaluatorRegistration) => boolean
  readonly onDeleteEvaluator: (evaluatorId: string) => boolean
  readonly linkedEngineerIds: readonly string[]
  readonly linkedEvaluatorIds: readonly string[]
}

export function RosterSection({
  kind,
  rows,
  disabled,
  departmentOptions,
  onAddEngineers,
  onAddEvaluators,
  onUpdateEngineer,
  onDeleteEngineer,
  onUpdateEvaluator,
  onDeleteEvaluator,
  linkedEngineerIds,
  linkedEvaluatorIds,
}: RosterSectionProps) {
  const label = kind === "engineer" ? "엔지니어" : "평가자"
  const existingEmployeeCodes = rows.map((row) => row.employeeCode)

  return (
    <section aria-labelledby={`${kind}-roster-title`} className="space-y-5 pt-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold" id={`${kind}-roster-title`}>{label} 명단</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            개별 추가하거나 스프레드시트 목록을 붙여넣어 일괄 등록합니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <SingleRegistrationDialog
            departmentOptions={departmentOptions}
            disabled={disabled}
            existingEmployeeCodes={existingEmployeeCodes}
            kind={kind}
            onAddEngineers={onAddEngineers}
            onAddEvaluators={onAddEvaluators}
          />
          <BulkRegistrationDialog
            departmentOptions={departmentOptions}
            disabled={disabled}
            kind={kind}
            onAddEngineers={onAddEngineers}
            onAddEvaluators={onAddEvaluators}
          />
        </div>
      </div>
      <RosterList
        departmentOptions={departmentOptions}
        disabled={disabled}
        kind={kind}
        linkedEngineerIds={linkedEngineerIds}
        linkedEvaluatorIds={linkedEvaluatorIds}
        onDeleteEngineer={onDeleteEngineer}
        onDeleteEvaluator={onDeleteEvaluator}
        onUpdateEngineer={onUpdateEngineer}
        onUpdateEvaluator={onUpdateEvaluator}
        rows={rows}
      />
    </section>
  )
}
