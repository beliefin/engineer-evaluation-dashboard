import Link from "next/link"

import type { CompletedRankingRow } from "./dashboard-view-models"
import { RankingStatusBadge } from "./ranking-status-badge"

interface RankingMobileListProps {
  readonly rows: readonly CompletedRankingRow[]
}

export function RankingMobileList({ rows }: RankingMobileListProps) {
  return (
    <ol className="grid gap-3 p-4 md:hidden">
      {rows.map((row) => (
        <li
          key={row.id}
          className="rounded-lg border border-border bg-card p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="numeric flex size-8 shrink-0 items-center justify-center rounded-md bg-accent text-sm font-bold text-accent-foreground">
                {row.rank ?? "—"}
              </span>
              <div className="min-w-0">
                <Link
                  href={row.href}
                  className="block truncate font-semibold underline-offset-4 hover:text-primary hover:underline"
                >
                  {row.name}
                </Link>
                <p className="mt-1 text-xs text-muted-foreground">{row.team}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="numeric text-xl font-bold text-primary">
                {row.totalScore === null ? "—" : row.totalScore.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">현재 종합 점수</p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-end border-t border-border-subtle pt-3">
            {row.taskCount !== undefined ? (
              <p className="numeric mr-auto text-xs text-muted-foreground">
                {row.completedTaskCount ?? 0}/{row.taskCount}개 과제 반영
              </p>
            ) : null}
            <RankingStatusBadge status={row.status} isTied={row.isTied ?? false} />
          </div>
        </li>
      ))}
    </ol>
  )
}
