"use client"

import { useId, useState } from "react"

import { Input } from "@/components/ui/input"

interface WeightInputProps {
  readonly engineerName: string
  readonly evaluatorName: string
  readonly categoryLabel: string
  readonly value: number
  readonly disabled: boolean
  readonly onChange: (value: number) => void
}

function parsePositiveWeight(value: string): number | null {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

export function WeightInput({
  engineerName,
  evaluatorName,
  categoryLabel,
  value,
  disabled,
  onChange,
}: WeightInputProps) {
  const inputId = useId()
  const errorId = `${inputId}-error`
  const [draft, setDraft] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleChange(nextValue: string) {
    setDraft(nextValue)
    const parsed = parsePositiveWeight(nextValue)
    if (parsed === null) {
      setError("0보다 큰 값을 입력해 주세요.")
      return
    }

    setError(null)
    onChange(parsed)
  }

  function handleBlur() {
    if (draft !== null && parsePositiveWeight(draft) === null) {
      setError(null)
    }
    setDraft(null)
  }

  return (
    <div className="min-w-32">
      <label className="sr-only" htmlFor={inputId}>
        {engineerName} {evaluatorName} {categoryLabel} 원시 가중치
      </label>
      <Input
        aria-describedby={error === null ? undefined : errorId}
        aria-invalid={error !== null}
        className="numeric h-8 w-28 text-right"
        disabled={disabled}
        id={inputId}
        inputMode="decimal"
        min="0.1"
        onBlur={handleBlur}
        onChange={(event) => handleChange(event.currentTarget.value)}
        step="0.1"
        type="number"
        value={draft ?? String(value)}
      />
      {error === null ? null : (
        <p className="mt-1 text-xs text-destructive" id={errorId}>
          {error}
        </p>
      )}
    </div>
  )
}
