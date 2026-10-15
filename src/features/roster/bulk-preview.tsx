import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import type { EngineerRegistration, EvaluatorRegistration } from "./types"
import styles from "./bulk-registration-signal.module.css"

interface BulkPreviewProps {
  readonly kind: "engineer" | "evaluator"
  readonly rows: readonly (EngineerRegistration | EvaluatorRegistration)[]
}

export function BulkPreview({ kind, rows }: BulkPreviewProps) {
  return (
    <div aria-label="일괄 등록 미리보기" className={styles.previewFrame} role="region" tabIndex={0}>
      <Table className={`${styles.previewTable} ${kind === "engineer" ? styles.engineerPreview : styles.evaluatorPreview}`}>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">사번</TableHead>
            <TableHead scope="col">이름</TableHead>
            <TableHead scope="col">부문</TableHead>
            <TableHead scope="col">팀</TableHead>
            <TableHead scope="col">담당</TableHead>
            {kind === "engineer" ? <TableHead scope="col">직급</TableHead> : null}
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
