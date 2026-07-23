import { ChevronDownIcon } from "lucide-react"

import { ScoreInputField } from "./score-input-field"
import type { EvaluationScoreFormViewModel, ScoreItemViewModel } from "./types"

interface ParallelScoreItemRowProps {
  readonly item: ScoreItemViewModel
  readonly left: EvaluationScoreFormViewModel
  readonly right: EvaluationScoreFormViewModel
  readonly onLeftChange: (itemId: string, value: number | null) => void
  readonly onRightChange: (itemId: string, value: number | null) => void
}

export function ParallelScoreItemRow({
  item,
  left,
  right,
  onLeftChange,
  onRightChange,
}: ParallelScoreItemRowProps) {
  const rightItem = right.items.find((candidate) => candidate.id === item.id)
  const hintId = `parallel-score-${left.assignmentId}-${item.id}-hint`

  return (
    <div
      role="row"
      className="grid grid-cols-[minmax(0,1fr)_72px_72px] border-b border-border-subtle last:border-b-0 sm:grid-cols-[minmax(0,1fr)_112px_112px]"
    >
      <div role="cell" className="min-w-0 px-3 py-4 sm:px-4">
        <div className="flex items-start gap-2">
          <span className="numeric mt-0.5 hidden w-7 shrink-0 text-xs font-semibold text-muted-foreground sm:block">
            {String(item.index).padStart(2, "0")}
          </span>
          <div className="min-w-0 flex-1">
            {item.criteria.length === 0 ? (
              <>
                <p className="text-sm font-semibold leading-5">{item.label}</p>
                <p id={hintId} className="mt-1 text-xs text-muted-foreground">0~10점 정수</p>
              </>
            ) : (
              <details className="group">
                <summary className="flex min-h-10 cursor-pointer list-none items-start gap-1 rounded-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                  <span className="min-w-0 flex-1">
                    {item.section === null ? null : (
                      <span className="mb-1 block text-[11px] font-semibold text-muted-foreground">
                        {item.section}
                      </span>
                    )}
                    <span className="text-sm font-semibold leading-5">{item.label}</span>
                    <span id={hintId} className="mt-1 block text-[11px] text-primary sm:text-xs">
                      평가기준 보기
                    </span>
                  </span>
                  <ChevronDownIcon
                    className="mt-1 size-3.5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <dl className="mt-3 grid gap-2 border-l-2 border-primary/20 pl-3">
                  {item.criteria.map((criterion) => (
                    <div
                      className="grid gap-0.5 text-xs leading-5 sm:grid-cols-[40px_minmax(0,1fr)] sm:gap-2"
                      key={criterion.score}
                    >
                      <dt className="numeric font-semibold text-primary">{criterion.score}점</dt>
                      <dd className="text-muted-foreground">{criterion.description}</dd>
                    </div>
                  ))}
                </dl>
              </details>
            )}
          </div>
        </div>
      </div>

      <div role="cell" className="flex items-center border-l border-border-subtle px-1.5 py-3 sm:px-3">
        <ScoreInputField
          assignmentId={left.assignmentId}
          compact
          describedBy={hintId}
          itemId={item.id}
          label={`${left.engineerName} · ${item.label} 점수`}
          locked={left.locked}
          onChange={(value) => onLeftChange(item.id, value)}
          value={item.value}
        />
      </div>
      <div role="cell" className="flex items-center border-l border-border-subtle px-1.5 py-3 sm:px-3">
        {rightItem === undefined ? (
          <span className="mx-auto text-xs text-muted-foreground">항목 없음</span>
        ) : (
          <ScoreInputField
            assignmentId={right.assignmentId}
            compact
            describedBy={hintId}
            itemId={rightItem.id}
            label={`${right.engineerName} · ${rightItem.label} 점수`}
            locked={right.locked}
            onChange={(value) => onRightChange(rightItem.id, value)}
            value={rightItem.value}
          />
        )}
      </div>
    </div>
  )
}
