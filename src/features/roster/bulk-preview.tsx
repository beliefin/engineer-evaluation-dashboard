import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import type { EngineerRegistration, EvaluatorRegistration } from "./types"

interface BulkPreviewProps {
  readonly kind: "engineer" | "evaluator"
  readonly rows: readonly (EngineerRegistration | EvaluatorRegistration)[]
}

export function BulkPreview({ kind, rows }: BulkPreviewProps) {
  return (
    <div aria-label="일괄 등록 미리보기" className="max-h-56 overflow-auto rounded-md border" role="region" tabIndex={0}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>사번</TableHead>
            <TableHead>이름</TableHead>
            <TableHead>부문</TableHead>
            <TableHead>팀</TableHead>
            <TableHead>담당</TableHead>
            {kind === "engineer" ? <TableHead>직급</TableHead> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.employeeCode}>
              <TableCell className="font-medium">{row.employeeCode}</TableCell>
              <TableCell>{row.displayName}</TableCell>
              <TableCell>{row.division}</TableCell>
              <TableCell>{row.team}</TableCell>
              <TableCell>{row.department}</TableCell>
              {kind === "engineer" ? (
                <TableCell>{"position" in row ? row.position : ""}</TableCell>
              ) : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
