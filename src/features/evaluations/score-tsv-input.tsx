"use client"

import { useState } from "react"
import { ClipboardPasteIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface ScoreTsvInputProps {
  readonly itemCount: number
  readonly locked: boolean
  readonly onApply: (scores: readonly number[]) => void
}

type ParsedTsvScores =
  | Readonly<{ valid: true; scores: readonly number[] }>
  | Readonly<{ valid: false; message: string }>

function parseTsvScores(rawValue: string, expectedCount: number): ParsedTsvScores {
  const normalized = rawValue.trim()
  const cells = normalized.length === 0
    ? []
    : normalized.split(/\t|\r?\n/).map((value) => value.trim())

  if (cells.length !== expectedCount) {
    return {
      valid: false,
      message: `${expectedCount}개 점수가 필요합니다. 현재 ${cells.length}개가 입력되었습니다.`,
    }
  }

  const invalidIndex = cells.findIndex((value) => {
    if (value.length === 0) return true
    const score = Number(value)
    return !Number.isInteger(score) || score < 0 || score > 10
  })
  if (invalidIndex >= 0) {
    return {
      valid: false,
      message: `${invalidIndex + 1}번째 값은 0에서 10 사이의 정수여야 합니다.`,
    }
  }

  return { valid: true, scores: cells.map(Number) }
}

export function ScoreTsvInput({ itemCount, locked, onApply }: ScoreTsvInputProps) {
  const [rawValue, setRawValue] = useState("")
  const [error, setError] = useState<string | null>(null)
  const inputId = "score-tsv-input"
  const helpId = `${inputId}-help`
  const errorId = `${inputId}-error`

  function handleApply() {
    const result = parseTsvScores(rawValue, itemCount)
    if (!result.valid) {
      setError(result.message)
      return
    }

    onApply(result.scores)
    setRawValue("")
    setError(null)
  }

  return (
    <section className="border-b border-border-subtle bg-muted/20 px-4 py-4 md:px-5" aria-labelledby={`${inputId}-title`}>
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <div className="min-w-0">
          <label className="text-sm font-semibold" htmlFor={inputId} id={`${inputId}-title`}>
            TSV 점수 일괄 입력
          </label>
          <Textarea
            aria-describedby={error === null ? helpId : `${helpId} ${errorId}`}
            aria-invalid={error !== null}
            aria-label="TSV 점수"
            className="mt-2 min-h-20 resize-y font-mono"
            disabled={locked}
            id={inputId}
            onChange={(event) => {
              setRawValue(event.currentTarget.value)
              if (error !== null) setError(null)
            }}
            placeholder={`예: ${Array.from({ length: itemCount }, (_, index) => 10 - (index % 3)).join("\t")}`}
            value={rawValue}
          />
          <p className="mt-1.5 text-xs text-muted-foreground" id={helpId}>
            엑셀에서 {itemCount}개 점수를 한 행 또는 한 열로 복사해 붙여넣으세요. 각 값은 0~10 정수입니다.
          </p>
          {error === null ? null : (
            <p className="mt-1.5 text-xs font-medium text-destructive" id={errorId} role="alert">
              {error}
            </p>
          )}
        </div>
        <Button disabled={locked || rawValue.trim().length === 0} onClick={handleApply} type="button" variant="outline">
          <ClipboardPasteIcon aria-hidden="true" />
          점수 일괄 적용
        </Button>
      </div>
    </section>
  )
}
