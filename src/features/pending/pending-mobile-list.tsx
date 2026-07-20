import type { Role } from "@/domain"
import type { PendingEvaluationRow } from "@/view-models/pending"

import { PendingActionLink } from "./pending-action-link"
import { getPendingReason, PendingStatusBadge } from "./pending-status"

type PendingMobileListProps = Readonly<{
  rows: ReadonlyArray<PendingEvaluationRow>
  role: Role
}>

export function PendingMobileList({ rows, role }: PendingMobileListProps) {
  return (
    <ul className="divide-y divide-border md:hidden" aria-label="미평가 엔지니어 목록">
      {rows.map((row) => (
        <li key={row.engineerId} className="bg-card px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-semibold text-foreground">{row.engineerName}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {row.employeeCode} · {row.team}
              </p>
            </div>
            <PendingStatusBadge status={row.status} className="shrink-0" />
          </div>

          <p className="mt-3 border-l-2 border-warning bg-warning-soft px-3 py-2 text-sm leading-5 text-foreground">
            {getPendingReason(row)}
          </p>

          <dl className="mt-3 grid grid-cols-2 gap-3 border-t border-border-subtle pt-3 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">평가지 제출</dt>
              <dd className="numeric mt-1 font-semibold">
                {row.submittedSheetCount}/{row.totalSheetCount}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">직접점수 입력</dt>
              <dd className="numeric mt-1 font-semibold">
                {row.enteredDirectScoreCount}/{row.totalDirectScoreCount}
              </dd>
            </div>
          </dl>

          <div className="mt-4 flex justify-end">
            <PendingActionLink row={row} role={role} />
          </div>
        </li>
      ))}
    </ul>
  )
}
