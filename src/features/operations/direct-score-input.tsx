"use client"

import { useId, useState } from "react"

import { Input } from "@/components/ui/input"

interface DirectScoreInputProps {
  readonly engineerName: string
  readonly fieldLabel: string
  readonly value: number | null
  readonly disabled: boolean
  readonly onChange: (value: number | null) => void
}

const SCORE_PATTERN = /^(?:100(?:\.0)?|\d{1,2}(?:\.\d)?)$/

function parseScore(value: string): number | null {
  if (!SCORE_PATTERN.test(value)) {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 100 ? parsed : null
}

export function DirectScoreInput({
  engineerName,
  fieldLabel,
  value,
  disabled,
  onChange,
}: DirectScoreInputProps) {
  const inputId = useId()
  const errorId = `${inputId}-error`
  const [draft, setDraft] = useState<string | null>(null)
  const [invalid, setInvalid] = useState(false)

  function handleChange(nextValue: string) {
    setDraft(nextValue)
    if (nextValue === "") {
      setInvalid(false)
      onChange(null)
      return
    }

    const parsed = parseScore(nextValue)
    if (parsed === null) {
      setInvalid(true)
      return
    }

    setInvalid(false)
    onChange(parsed)
  }

  function handleBlur() {
    setDraft(null)
    setInvalid(false)
  }

  return (
    <div className="min-w-24">
      <label className="sr-only" htmlFor={inputId}>
        {engineerName} {fieldLabel} 점수
      </label>
      <Input
        aria-describedby={invalid ? errorId : undefined}
        aria-invalid={invalid}
        className="numeric h-8 w-24 text-right"
        disabled={disabled}
        id={inputId}
        inputMode="decimal"
        max="100"
        min="0"
        onBlur={handleBlur}
        onChange={(event) => handleChange(event.currentTarget.value)}
        placeholder="미입력"
        step="0.1"
        type="number"
        value={draft ?? (value === null ? "" : String(value))}
      />
      {invalid ? (
        <span className="sr-only" id={errorId}>
          0부터 100 사이의 점수를 소수 첫째 자리까지 입력해 주세요.
        </span>
      ) : null}
    </div>
  )
}
