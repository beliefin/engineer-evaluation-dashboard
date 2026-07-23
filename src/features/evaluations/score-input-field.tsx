"use client"

import { useState } from "react"
import type { ChangeEvent, KeyboardEvent } from "react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const scoreErrorMessage = "0에서 10 사이의 정수를 입력해 주세요."

interface ScoreInputFieldProps {
  readonly assignmentId: string
  readonly itemId: string
  readonly value: number | null
  readonly locked: boolean
  readonly label: string
  readonly describedBy?: string
  readonly compact?: boolean
  readonly onChange: (value: number | null) => void
}

interface DraftState {
  readonly sourceValue: number | null
  readonly value: string
  readonly error: string | null
}

interface ParsedScore {
  readonly accepted: boolean
  readonly value: number | null
  readonly error: string | null
}

function toDraftValue(value: number | null): string {
  return value === null ? "" : String(value)
}

function parseScore(value: string): ParsedScore {
  if (value === "") return { accepted: true, value: null, error: null }

  const score = Number(value)
  const accepted = Number.isInteger(score) && score >= 0 && score <= 10
  return accepted
    ? { accepted: true, value: score, error: null }
    : { accepted: false, value: null, error: scoreErrorMessage }
}

export function ScoreInputField({
  assignmentId,
  itemId,
  value,
  locked,
  label,
  describedBy,
  compact = false,
  onChange,
}: ScoreInputFieldProps) {
  const [draftState, setDraftState] = useState<DraftState>({
    sourceValue: value,
    value: toDraftValue(value),
    error: null,
  })
  const state = draftState.sourceValue === value
    ? draftState
    : { sourceValue: value, value: toDraftValue(value), error: null }
  const inputId = `score-${assignmentId}-${itemId}`
  const errorId = `${inputId}-error`

  function updateDraft(rawValue: string) {
    const parsed = parseScore(rawValue)
    setDraftState({ sourceValue: value, value: rawValue, error: parsed.error })
    if (parsed.accepted) onChange(parsed.value)
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    updateDraft(event.currentTarget.value)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (locked || (event.key !== "ArrowUp" && event.key !== "ArrowDown")) return

    event.preventDefault()
    const parsed = parseScore(state.value)
    const currentValue = parsed.accepted && parsed.value !== null ? parsed.value : 0
    const delta = event.key === "ArrowUp" ? 1 : -1
    updateDraft(String(Math.min(10, Math.max(0, currentValue + delta))))
  }

  const ariaDescribedBy = state.error === null
    ? describedBy
    : [describedBy, errorId].filter(Boolean).join(" ")

  return (
    <div className="grid min-w-0 gap-1.5">
      <div className="relative">
        <Input
          id={inputId}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={state.value}
          disabled={locked}
          aria-label={label}
          aria-invalid={state.error !== null}
          aria-describedby={ariaDescribedBy}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className={cn(
            "numeric h-10 w-full text-base font-semibold md:text-base",
            compact ? "px-1 text-center" : "pr-10 text-right",
          )}
        />
        {compact ? null : (
          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">
            / 10
          </span>
        )}
      </div>
      {state.error === null ? null : (
        <p id={errorId} className="text-[11px] font-medium leading-4 text-destructive">
          {state.error}
        </p>
      )}
    </div>
  )
}
