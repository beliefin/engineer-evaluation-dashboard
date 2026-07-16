"use client"

import { LockKeyhole, SearchIcon } from "lucide-react"
import { useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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
  const [query, setQuery] = useState("")
  const filteredSheets = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("ko-KR")
    if (normalizedQuery === "") return sheets
    return sheets.filter((sheet) => [
      sheet.engineerName,
      sheet.taskLabel ?? sheet.categoryLabel,
      sheet.evaluatorName,
    ].join(" ").toLocaleLowerCase("ko-KR").includes(normalizedQuery))
  }, [query, sheets])

  return (
    <OperationPanel
      aside={<Badge variant="outline">{sheets.length}건 잠금</Badge>}
      description="제출된 평가는 수정 방지를 위해 잠깁니다. 수정이 필요하면 사유를 남기고 잠금을 해제하세요."
      title="제출 평가 잠금 해제"
    >
      {sheets.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <LockKeyhole className="mb-3 size-7 text-muted-foreground" />
          <p className="font-medium">잠금을 해제할 제출 평가가 없습니다.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            평가자가 제출을 완료하면 여기에 표시됩니다.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <SearchIcon
                aria-hidden="true"
                className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <label className="sr-only" htmlFor="submitted-sheet-search">잠금 평가 검색</label>
              <Input
                className="pl-9"
                id="submitted-sheet-search"
                onChange={(event) => setQuery(event.currentTarget.value)}
                placeholder="엔지니어, 과제 또는 평가자 검색"
                type="search"
                value={query}
              />
            </div>
            <p aria-live="polite" className="text-xs text-muted-foreground">
              전체 {sheets.length}건 · {filteredSheets.length}건 표시
            </p>
          </div>
          {filteredSheets.length === 0 ? (
            <div className="rounded-md border py-10 text-center">
              <p className="font-medium">검색 결과가 없습니다.</p>
              <p className="mt-1 text-sm text-muted-foreground">검색어를 변경해 보세요.</p>
            </div>
          ) : (
            <>
          <div className="divide-y rounded-md border md:hidden">
            {filteredSheets.map((sheet) => (
              <div
                className="flex items-center justify-between gap-4 p-4"
                key={`${sheet.sheetId}-mobile`}
              >
                <div className="min-w-0">
                  <p className="font-medium">{sheet.engineerName}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {sheet.taskLabel ?? sheet.categoryLabel} · {sheet.evaluatorName}
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
                {filteredSheets.map((sheet) => (
                  <TableRow key={sheet.sheetId}>
                    <TableCell className="font-medium">
                      {sheet.engineerName}
                    </TableCell>
                    <TableCell>{sheet.taskLabel ?? sheet.categoryLabel}</TableCell>
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
        </>
      )}
    </OperationPanel>
  )
}
