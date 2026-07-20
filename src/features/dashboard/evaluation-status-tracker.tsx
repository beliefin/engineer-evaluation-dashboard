import Link from "next/link"

import type {
  DashboardEvaluationStatus,
  EngineerEvaluationProgressRow,
} from "./dashboard-view-models"

type EvaluationStatusTrackerProps = Readonly<{
  rows: readonly EngineerEvaluationProgressRow[]
}>

const STATUS_META: Record<
  DashboardEvaluationStatus,
  Readonly<{ label: string; segmentClass: string; swatchClass: string }>
> = {
  complete: {
    label: "완료",
    segmentClass: "bg-success hover:bg-success/85",
    swatchClass: "bg-success",
  },
  in_progress: {
    label: "진행 중",
    segmentClass: "bg-warning hover:bg-warning/85",
    swatchClass: "bg-warning",
  },
  not_started: {
    label: "미진행",
    segmentClass: "bg-border hover:bg-muted-foreground/45",
    swatchClass: "bg-border",
  },
}

export function EvaluationStatusTracker({ rows }: EvaluationStatusTrackerProps) {
  const counts = rows.reduce<Record<DashboardEvaluationStatus, number>>(
    (totals, row) => ({ ...totals, [row.status]: totals[row.status] + 1 }),
    { complete: 0, in_progress: 0, not_started: 0 },
  )

  return (
    <section aria-labelledby="evaluation-status-title" className="border-y border-border bg-card px-5 py-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold" id="evaluation-status-title">평가 진행 레일</h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            구간 하나가 엔지니어 한 명입니다. <span className="whitespace-nowrap">선택하면 상세 화면을 엽니다.</span>
          </p>
        </div>
        <p className="numeric text-xs text-muted-foreground">
          완료 {counts.complete}/{rows.length}명
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="mt-4 border-t border-border-subtle pt-4 text-sm text-muted-foreground">
          선택 범위에 평가 대상이 없습니다.
        </p>
      ) : (
        <ul
          aria-label="엔지니어별 평가 진행 상태"
          className="mt-4 grid h-7 overflow-hidden rounded-[3px] border border-border bg-muted"
          style={{ gridTemplateColumns: `repeat(${rows.length}, minmax(4px, 1fr))` }}
        >
          {rows.map((row) => {
            const meta = STATUS_META[row.status]
            const label = `${row.name}, ${row.team}, ${meta.label}, 과제 ${row.completedTaskCount}/${row.taskCount}개 완료`
            return (
              <li className="min-w-0 border-r border-card last:border-r-0" key={row.id}>
                <Link
                  aria-label={label}
                  className={`block h-full focus-visible:relative focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary ${meta.segmentClass}`}
                  href={row.href}
                  title={label}
                />
              </li>
            )
          })}
        </ul>
      )}

      <ul aria-label="평가 진행 상태 범례" className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
        {(Object.keys(STATUS_META) as DashboardEvaluationStatus[]).map((status) => {
          const meta = STATUS_META[status]
          return (
            <li className="flex items-center gap-2" key={status}>
              <span aria-hidden="true" className={`h-2 w-4 rounded-[1px] ${meta.swatchClass}`} />
              <span>{meta.label}</span>
              <span className="numeric font-medium text-foreground">{counts[status]}명</span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
