import type { Role } from "@/domain"
import { Label } from "@/components/ui/label"

import type { AuthEngineerOption, AuthEvaluatorOption } from "./types"

type AccountRoleFieldsProps = Readonly<{
  roles: ReadonlyArray<Role>
  evaluatorId: string
  engineerId: string
  evaluatorError?: string | undefined
  engineerError?: string | undefined
  evaluatorOptions: ReadonlyArray<AuthEvaluatorOption>
  engineerOptions: ReadonlyArray<AuthEngineerOption>
  disabled: boolean
  roleDisabled: boolean
  onRolesChange: (roles: ReadonlyArray<Role>) => void
  onEvaluatorChange: (evaluatorId: string) => void
  onEngineerChange: (engineerId: string) => void
}>

export function AccountRoleFields({
  roles,
  evaluatorId,
  engineerId,
  evaluatorError,
  engineerError,
  evaluatorOptions,
  engineerOptions,
  disabled,
  roleDisabled,
  onRolesChange,
  onEvaluatorChange,
  onEngineerChange,
}: AccountRoleFieldsProps) {
  const rolePreset = roles.length === 2 ? "evaluator_engineer" : (roles[0] ?? "approver")
  const hasEvaluatorRole = roles.includes("evaluator")
  const hasEngineerRole = roles.includes("engineer")

  function handleRolePreset(value: string) {
    if (value === "evaluator_engineer") {
      onRolesChange(["evaluator", "engineer"])
      return
    }
    if (value === "operator" || value === "evaluator" || value === "approver" || value === "engineer") {
      onRolesChange([value])
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="account-role">역할</Label>
        <select
          className="h-9 w-full rounded-md border border-input bg-card px-2.5 text-sm"
          disabled={roleDisabled}
          id="account-role"
          onChange={(event) => handleRolePreset(event.currentTarget.value)}
          value={rolePreset}
        >
          <option value="operator">운영자</option>
          <option value="evaluator">평가자</option>
          <option value="evaluator_engineer">평가자 · 엔지니어</option>
          <option value="approver">승인자</option>
          <option value="engineer">엔지니어</option>
        </select>
      </div>

      {hasEvaluatorRole ? (
        <div className="space-y-2">
          <Label htmlFor="account-evaluator">연결 평가자</Label>
          <select
            aria-describedby={evaluatorError ? "account-evaluator-error" : undefined}
            aria-invalid={Boolean(evaluatorError)}
            className="h-9 w-full rounded-md border border-input bg-card px-2.5 text-sm disabled:opacity-50"
            disabled={disabled}
            id="account-evaluator"
            onChange={(event) => onEvaluatorChange(event.currentTarget.value)}
            required
            value={evaluatorId}
          >
            <option value="">평가자 선택</option>
            {evaluatorOptions.map((evaluator) => (
              <option key={evaluator.id} value={evaluator.id}>{evaluator.label}</option>
            ))}
          </select>
          {evaluatorError ? (
            <p className="text-xs text-destructive" data-testid="account-evaluator-error" id="account-evaluator-error">
              {evaluatorError}
            </p>
          ) : null}
        </div>
      ) : null}

      {hasEngineerRole ? (
        <div className="space-y-2">
          <Label htmlFor="account-engineer">연결 엔지니어</Label>
          <select
            aria-describedby={engineerError ? "account-engineer-error" : undefined}
            aria-invalid={Boolean(engineerError)}
            className="h-9 w-full rounded-md border border-input bg-card px-2.5 text-sm disabled:opacity-50"
            disabled={disabled}
            id="account-engineer"
            onChange={(event) => onEngineerChange(event.currentTarget.value)}
            required
            value={engineerId}
          >
            <option value="">엔지니어 선택</option>
            {engineerOptions.map((engineer) => (
              <option key={engineer.id} value={engineer.id}>{engineer.label}</option>
            ))}
          </select>
          {engineerError ? (
            <p className="text-xs text-destructive" data-testid="account-engineer-error" id="account-engineer-error">
              {engineerError}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
