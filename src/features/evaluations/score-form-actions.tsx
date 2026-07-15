import { LockKeyholeIcon, SaveIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

import { AutosaveIndicator } from "./autosave-indicator"
import type { AutosaveStatus } from "./types"

interface ScoreFormActionsProps {
  readonly autosaveStatus: AutosaveStatus
  readonly lastSavedAtLabel: string | null
  readonly locked: boolean
  readonly canSubmit: boolean
  readonly requirementsId: string
  readonly onSave: () => void
}

export function ScoreFormActions({
  autosaveStatus,
  lastSavedAtLabel,
  locked,
  canSubmit,
  requirementsId,
  onSave,
}: ScoreFormActionsProps) {
  const saving = autosaveStatus === "saving"

  return (
    <div
      data-testid="score-form-actions"
      className="fixed inset-x-0 bottom-0 z-30 grid gap-2 border-t border-border bg-card px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] md:static md:z-auto md:flex md:items-center md:border-0 md:bg-transparent md:p-0"
    >
      <div className="flex min-h-5 items-center justify-between md:mr-2 md:justify-end">
        <AutosaveIndicator status={autosaveStatus} lastSavedAtLabel={lastSavedAtLabel} />
      </div>
      <div className="grid grid-cols-2 gap-2 md:flex">
        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={locked || saving}
          onClick={onSave}
        >
          <SaveIcon data-icon="inline-start" aria-hidden="true" />
          임시저장
        </Button>
        <Button
          type="submit"
          size="lg"
          disabled={locked || saving || !canSubmit}
          aria-describedby={requirementsId}
        >
          <LockKeyholeIcon data-icon="inline-start" aria-hidden="true" />
          제출 및 잠금
        </Button>
      </div>
    </div>
  )
}
