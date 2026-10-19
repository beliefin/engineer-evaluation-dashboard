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
    <ul className="signal-pending-mobile md:hidden" aria-label="미평가 엔지니어 목록">
      {rows.map((row) => (
        <li key={row.engineerId} className="signal-pending-card">
          <div className="signal-pending-identity">
            <p className="signal-pending-engineer-name">{row.engineerName}</p>
            <p className="signal-pending-engineer-meta">
              {row.team} · {row.position}
            </p>
          </div>

          <div className="signal-pending-card-status">
            <PendingStatusBadge status={row.status} />
            <p className="signal-pending-reason">{getPendingReason(row)}</p>
          </div>

          <dl className="signal-pending-card-progress">
            <div>
              <dt>평가지 제출</dt>
              <dd className="numeric">
                <strong>{row.submittedSheetCount}</strong><span>/{row.totalSheetCount}</span>
              </dd>
            </div>
            <div>
              <dt>직접점수 입력</dt>
              <dd className="numeric">
                <strong>{row.enteredDirectScoreCount}</strong><span>/{row.totalDirectScoreCount}</span>
              </dd>
            </div>
          </dl>

          <div className="signal-pending-card-action">
            <PendingActionLink row={row} role={role} />
          </div>
        </li>
      ))}
    </ul>
  )
}
