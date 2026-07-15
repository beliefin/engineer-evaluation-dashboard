"use client"

import { cn } from "@/lib/utils"

import {
  type AppShellCycleOption,
  type AppShellEvaluatorOption,
  type AppShellRole,
} from "./types"

interface ShellControlsProps {
  readonly role: AppShellRole
  readonly cycles: readonly AppShellCycleOption[]
  readonly activeCycleId: string
  readonly evaluatorOptions: readonly AppShellEvaluatorOption[]
  readonly activeEvaluatorId: string
  readonly onCycleChange: (cycleId: string) => void
  readonly onEvaluatorChange: (evaluatorId: string) => void
  readonly orientation?: "horizontal" | "vertical"
  readonly idPrefix: string
}

export function ShellControls({
  role,
  cycles,
  activeCycleId,
  evaluatorOptions,
  activeEvaluatorId,
  onCycleChange,
  onEvaluatorChange,
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
          <span
            className="shrink-0 text-xs font-medium text-muted-foreground"
            id={`${idPrefix}-evaluator-label`}
          >
            대리 입력 평가자
          </span>
          <select
            aria-labelledby={`${idPrefix}-evaluator-label`}
            className={cn(
              "h-9 rounded-md border border-input bg-card px-2.5 text-sm font-medium",
              orientation === "vertical" ? "w-full" : "w-36"
            )}
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
