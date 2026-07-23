import { ChevronDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"

import { ScoreInputField } from "./score-input-field"
import type { ScoreItemViewModel } from "./types"

interface ScoreInputRowProps {
  readonly assignmentId: string
  readonly item: ScoreItemViewModel
  readonly locked: boolean
  readonly onChange: (value: number | null) => void
}

export function ScoreInputRow({
  assignmentId,
  item,
  locked,
  onChange,
}: ScoreInputRowProps) {
  const inputId = `score-${assignmentId}-${item.id}`
  const hintId = `${inputId}-hint`
  const labelId = `${inputId}-label`
  const label = item.label

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

      <ScoreInputField
        assignmentId={assignmentId}
        describedBy={hintId}
        itemId={item.id}
        label={`${label} 점수`}
        locked={locked}
        onChange={onChange}
        value={item.value}
      />
    </div>
  )
}
