"use client"

import { cn } from "@/lib/utils"

import {
  APP_SHELL_ROLE_LABELS,
  type AppShellCycleOption,
  type AppShellEvaluatorOption,
  type AppShellRole,
} from "./types"

interface ShellControlsProps {
  readonly role: AppShellRole
  readonly availableRoles: readonly AppShellRole[]
  readonly cycles: readonly AppShellCycleOption[]
  readonly activeCycleId: string
  readonly evaluatorOptions: readonly AppShellEvaluatorOption[]
  readonly activeEvaluatorId: string
  readonly onCycleChange: (cycleId: string) => void
  readonly onEvaluatorChange: (evaluatorId: string) => void
  readonly onRoleChange: (role: AppShellRole) => void
  readonly orientation?: "horizontal" | "vertical"
  readonly idPrefix: string
}

export function ShellControls({
  role,
  availableRoles,
  cycles,
  activeCycleId,
  evaluatorOptions,
  activeEvaluatorId,
  onCycleChange,
  onEvaluatorChange,
  onRoleChange,
  orientation = "horizontal",
  idPrefix,
}: ShellControlsProps) {
  return (
    <div
      className={cn(
        "flex gap-3",
        orientation === "vertical" ? "flex-col" : "items-center"
      )}
    >
      {availableRoles.length > 1 ? (
        <div
          className={cn(
            "flex gap-2",
            orientation === "vertical" ? "flex-col" : "items-center"
          )}
        >
          <label className="shrink-0 text-xs font-medium text-muted-foreground" htmlFor={`${idPrefix}-role`}>
            사용 모드
          </label>
          <select
            className={cn(
              "h-9 rounded-md border border-input bg-card px-2.5 text-sm font-medium",
              orientation === "vertical" ? "w-full" : "w-32"
            )}
            id={`${idPrefix}-role`}
            onChange={(event) => {
              const nextRole = availableRoles.find((entry) => entry === event.currentTarget.value)
              if (nextRole !== undefined) onRoleChange(nextRole)
            }}
            value={role}
          >
            {availableRoles.map((availableRole) => (
              <option key={availableRole} value={availableRole}>
                {APP_SHELL_ROLE_LABELS[availableRole]}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <div
        className={cn(
          "flex gap-2",
          orientation === "vertical" ? "flex-col" : "items-center"
        )}
      >
        <span
          className="shrink-0 text-xs font-medium text-muted-foreground"
          id={`${idPrefix}-cycle-label`}
        >
          평가 시즌
        </span>
        <select
          aria-labelledby={`${idPrefix}-cycle-label`}
          className={cn(
            "h-9 rounded-md border border-input bg-card px-2.5 text-sm font-medium",
            orientation === "vertical" ? "w-full" : "w-44"
          )}
          onChange={(event) => onCycleChange(event.currentTarget.value)}
          value={activeCycleId}
        >
          {cycles.map((cycle) => (
            <option disabled={cycle.disabled ?? false} key={cycle.id} value={cycle.id}>
              {cycle.label}
            </option>
          ))}
        </select>
      </div>

      {role === "operator" ? (
        <div
          className={cn(
            "flex gap-2",
            orientation === "vertical" ? "flex-col" : "items-center"
          )}
        >
          <label
            className="shrink-0 text-xs font-medium text-muted-foreground"
            htmlFor={`${idPrefix}-evaluator`}
          >
            대리 입력 평가자
          </label>
          <select
            className={cn(
              "h-9 rounded-md border border-input bg-card px-2.5 text-sm font-medium",
              orientation === "vertical" ? "w-full" : "w-40"
            )}
            disabled={evaluatorOptions.length === 0}
            id={`${idPrefix}-evaluator`}
            onChange={(event) => onEvaluatorChange(event.currentTarget.value)}
            value={activeEvaluatorId}
          >
            {evaluatorOptions.map((evaluator) => (
              <option key={evaluator.id} value={evaluator.id}>
                {evaluator.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}

    </div>
  )
}
