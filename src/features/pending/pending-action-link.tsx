import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { Role } from "@/domain"
import type { PendingEvaluationRow } from "@/view-models/pending"

type PendingActionLinkProps = Readonly<{
  row: PendingEvaluationRow
  role: Role
}>

function assertNeverRole(role: never): never {
  throw new RangeError(`지원하지 않는 역할입니다: ${String(role)}`)
}

export function PendingActionLink({ row, role }: PendingActionLinkProps) {
  switch (role) {
    case "evaluator":
    case "engineer":
      return null
    case "approver":
      return (
        <Button asChild variant="outline" size="sm">
          <Link
            href={`/engineers/${row.engineerId}`}
            aria-label={`${row.engineerName} 상세 보기`}
          >
            상세 보기
            <ArrowRight aria-hidden="true" data-icon="inline-end" />
          </Link>
        </Button>
      )
    case "operator": {
      const hasPendingSheet = row.firstPendingAssignmentId !== null
      const label = hasPendingSheet ? "평가 입력" : "직접점수 입력"
      const href = hasPendingSheet
        ? `/evaluations/${row.firstPendingAssignmentId}`
        : `/operations?tab=scores&q=${encodeURIComponent(row.engineerName)}`
      return (
        <Button asChild size="sm">
          <Link href={href} aria-label={`${row.engineerName} ${label}`}>
            {label}
            <ArrowRight aria-hidden="true" data-icon="inline-end" />
          </Link>
        </Button>
      )
    }
    default:
      return assertNeverRole(role)
  }
}
