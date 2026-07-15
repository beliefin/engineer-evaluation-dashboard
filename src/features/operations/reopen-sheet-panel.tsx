"use client"

import { LockKeyhole } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { OperationPanel } from "./operation-panel"
import { ReopenSheetDialog } from "./reopen-sheet-dialog"
import type { SubmittedSheetViewModel } from "./types"

interface ReopenSheetPanelProps {
  readonly sheets: readonly SubmittedSheetViewModel[]
  readonly disabled: boolean
  readonly onReopen: (sheetId: string, reason: string) => void
}

export function ReopenSheetPanel({
  sheets,
  disabled,
  onReopen,
}: ReopenSheetPanelProps) {
  return (
    <OperationPanel
      aside={<Badge variant="outline">{sheets.length}건 잠금</Badge>}
      description="제출된 평가지는 잠겨 있습니다. 수정이 필요한 경우 사유를 남기고 재오픈할 수 있습니다."
      title="제출 평가 재오픈"
    >
      {sheets.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <LockKeyhole className="mb-3 size-7 text-muted-foreground" />
          <p className="font-medium">재오픈할 제출 평가가 없습니다.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            평가자가 제출을 완료하면 여기에 표시됩니다.
          </p>
        </div>
      ) : (
        <>
          <div className="divide-y rounded-md border md:hidden">
            {sheets.map((sheet) => (
              <div
                className="flex items-center justify-between gap-4 p-4"
                key={`${sheet.sheetId}-mobile`}
              >
                <div className="min-w-0">
                  <p className="font-medium">{sheet.engineerName}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {sheet.categoryLabel} · {sheet.evaluatorName}
                  </p>
                  <p className="numeric mt-1 text-xs text-muted-foreground">
                    {sheet.submittedAtLabel}
                  </p>
                </div>
                <ReopenSheetDialog
                  disabled={disabled}
                  onReopen={onReopen}
                  sheet={sheet}
                />
              </div>
            ))}
          </div>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>엔지니어</TableHead>
                  <TableHead>평가 분야</TableHead>
                  <TableHead>평가자</TableHead>
                  <TableHead>제출 시각</TableHead>
                  <TableHead className="w-24 text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sheets.map((sheet) => (
                  <TableRow key={sheet.sheetId}>
                    <TableCell className="font-medium">
                      {sheet.engineerName}
                    </TableCell>
                    <TableCell>{sheet.categoryLabel}</TableCell>
                    <TableCell>{sheet.evaluatorName}</TableCell>
                    <TableCell className="numeric text-muted-foreground">
                      {sheet.submittedAtLabel}
                    </TableCell>
                    <TableCell className="text-right">
                      <ReopenSheetDialog
                        disabled={disabled}
                        onReopen={onReopen}
                        sheet={sheet}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </OperationPanel>
  )
}
