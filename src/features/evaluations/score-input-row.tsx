"use client"

import { useState } from "react"
import type { ChangeEvent, KeyboardEvent } from "react"
import { ChevronDownIcon } from "lucide-react"

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
  const labelId = `${inputId}-label`
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

      <div className="min-w-0">
        {item.criteria.length === 0 ? (
          <>
            <label htmlFor={inputId} id={labelId} className="text-sm font-semibold">
              {label}
            </label>
            <p id={hintId} className="mt-1 text-xs text-muted-foreground">
              0점부터 10점까지 정수로 입력
            </p>
          </>
        ) : (
          <details className="group">
            <summary className="flex min-h-10 cursor-pointer list-none items-start gap-2 rounded-md py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  {item.section === null ? null : (
                    <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs font-semibold text-muted-foreground">
                      {item.section}
                    </span>
                  )}
                  <span className="text-sm font-semibold" id={labelId}>{label}</span>
                </span>
                <span className="mt-1 block text-xs text-primary">세부 평가기준 보기</span>
              </span>
              <ChevronDownIcon className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="mt-3 border-l-2 border-primary/20 pl-3">
              <p id={hintId} className="text-xs text-muted-foreground">
                기준을 참고해 0점부터 10점까지 정수로 입력합니다.
              </p>
              <dl className="mt-3 grid gap-2">
                {item.criteria.map((criterion) => (
                  <div className="grid grid-cols-[40px_minmax(0,1fr)] gap-2 text-xs leading-5" key={criterion.score}>
                    <dt className="numeric font-semibold text-primary">{criterion.score}점</dt>
                    <dd className="text-muted-foreground">{criterion.description}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </details>
        )}
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
