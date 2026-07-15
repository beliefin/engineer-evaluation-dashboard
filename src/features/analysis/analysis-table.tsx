import type { ReactNode } from "react"

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export type AnalysisTableColumn<Row> = Readonly<{
  key: string
  header: string
  align?: "start" | "end"
  render: (row: Row) => ReactNode
}>

type AnalysisTableProps<Row> = Readonly<{
  caption: string
  rows: readonly Row[]
  columns: readonly AnalysisTableColumn<Row>[]
  getRowKey: (row: Row) => string
}>

export function AnalysisTable<Row>({
  caption,
  rows,
  columns,
  getRowKey,
}: AnalysisTableProps<Row>) {
  return (
    <details className="group mt-4 border-t border-border-subtle pt-3">
      <summary className="w-fit rounded-sm text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
        표로 보기
      </summary>
      <div className="mt-3 rounded-md border border-border-subtle">
        <Table>
          <TableCaption className="sr-only">{caption}</TableCaption>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={column.align === "end" ? "text-right" : undefined}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={getRowKey(row)}>
                {columns.map((column) => (
                  <TableCell
                    key={column.key}
                    className={
                      column.align === "end" ? "numeric text-right" : undefined
                    }
                  >
                    {column.render(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </details>
  )
}

