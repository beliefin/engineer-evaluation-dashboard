"use client"

import { useState } from "react"
import type { ChangeEvent, KeyboardEvent } from "react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

import type { ScoreItemViewModel } from "./types"

const scoreErrorMessage = "0에서 10 사이의 정수를 입력해 주세요."

interface ScoreInputRowProps {
  readonly assignmentId: string
  readonly item: ScoreItemViewModel
  readonly locked: boolean
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

export function ScoreInputRow({
  assignmentId,
  item,
  locked,
  onChange,
}: ScoreInputRowProps) {
  const [draftState, setDraftState] = useState<DraftState>({
    sourceValue: item.value,
    value: toDraftValue(item.value),
    error: null,
  })
  const state =
    draftState.sourceValue === item.value
      ? draftState
      : { sourceValue: item.value, value: toDraftValue(item.value), error: null }
  const inputId = `score-${assignmentId}-${item.id}`
  const hintId = `${inputId}-hint`
  const errorId = `${inputId}-error`
  const label = item.label

  function updateDraft(rawValue: string) {
    const parsed = parseScore(rawValue)
    setDraftState({
      sourceValue: item.value,
      value: rawValue,
      error: parsed.error,
    })
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

  return (
    <div
      className={cn(
        "grid gap-3 border-b border-border-subtle px-4 py-4 last:border-b-0 md:grid-cols-[48px_minmax(0,1fr)_144px] md:items-center md:px-5",
        locked && "bg-muted/45"
      )}
    >
      <span
        aria-hidden="true"
        className="numeric hidden size-8 items-center justify-center rounded-md bg-muted text-xs font-semibold text-muted-foreground md:flex"
      >
        {String(item.index).padStart(2, "0")}
      </span>

      <div>
        <label htmlFor={inputId} className="text-sm font-semibold">
          {label}
        </label>
        <p id={hintId} className="mt-1 text-xs text-muted-foreground">
          0점부터 10점까지 정수로 입력
        </p>
      </div>

      <div className="grid gap-1.5">
        <div className="relative">
          <Input
            id={inputId}
            type="number"
            inputMode="numeric"
            min={0}
            max={10}
            step={1}
            value={state.value}
            disabled={locked}
            aria-label={`${label} 점수`}
            aria-invalid={state.error !== null}
            aria-describedby={state.error === null ? hintId : `${hintId} ${errorId}`}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            className="numeric h-10 pr-10 text-right text-base font-semibold md:text-base"
          />
          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">
            / 10
          </span>
        </div>
        {state.error === null ? null : (
          <p id={errorId} className="text-xs font-medium text-destructive">
            {state.error}
          </p>
        )}
      </div>
    </div>
  )
}
