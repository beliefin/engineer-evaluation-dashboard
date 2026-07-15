import type { Role } from "@/domain"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { PendingEvaluationRow } from "@/view-models/pending"

import { PendingActionLink } from "./pending-action-link"
import { getPendingReason, PendingStatusBadge } from "./pending-status"

type PendingDesktopTableProps = Readonly<{
  rows: ReadonlyArray<PendingEvaluationRow>
  role: Role
}>

export function PendingDesktopTable({ rows, role }: PendingDesktopTableProps) {
  return (
    <div className="hidden md:block">
      <Table>
        <TableCaption className="sr-only">미평가 엔지니어 목록</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="px-5">엔지니어</TableHead>
            <TableHead>미완료 사유</TableHead>
            <TableHead className="text-center">평가지 제출</TableHead>
            <TableHead className="text-center">직접점수</TableHead>
            <TableHead className="w-32 text-right"><span className="sr-only">작업</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.engineerId}>
              <TableCell className="px-5 py-3">
                <p className="font-semibold text-foreground">{row.engineerName}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {row.employeeCode} · {row.team}
                </p>
              </TableCell>
              <TableCell className="max-w-80 whitespace-normal py-3">
                <PendingStatusBadge status={row.status} />
                <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                  {getPendingReason(row)}
                </p>
              </TableCell>
              <TableCell className="numeric text-center font-medium">
                {row.submittedSheetCount}/{row.totalSheetCount}
              </TableCell>
              <TableCell className="numeric text-center font-medium">
                {row.enteredDirectScoreCount}/{row.totalDirectScoreCount}
              </TableCell>
              <TableCell className="pr-5 text-right">
                <PendingActionLink row={row} role={role} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
