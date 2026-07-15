"use client"

import { PencilIcon, SearchIcon, Trash2Icon, UsersIcon } from "lucide-react"
import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { DeleteEngineerDialog } from "./delete-engineer-dialog"
import { EngineerEditorDialog } from "./engineer-editor-dialog"
import type {
  EngineerRegistration,
  EngineerRosterItem,
  EvaluatorRosterItem,
} from "./types"

interface RosterListProps {
  readonly kind: "engineer" | "evaluator"
  readonly rows: readonly (EngineerRosterItem | EvaluatorRosterItem)[]
  readonly disabled: boolean
  readonly linkedEngineerIds: readonly string[]
  readonly onUpdateEngineer: (engineerId: string, engineer: EngineerRegistration) => boolean
  readonly onDeleteEngineer: (engineerId: string) => boolean
}

function matchesQuery(row: EngineerRosterItem | EvaluatorRosterItem, query: string): boolean {
  return [row.employeeCode, row.displayName, row.team, "position" in row ? row.position : ""]
    .join(" ")
    .toLocaleLowerCase("ko-KR")
    .includes(query.trim().toLocaleLowerCase("ko-KR"))
}

export function RosterList({
  kind,
  rows,
  disabled,
  linkedEngineerIds,
  onUpdateEngineer,
  onDeleteEngineer,
}: RosterListProps) {
  const label = kind === "engineer" ? "엔지니어" : "평가자"
  const [query, setQuery] = useState("")
  const [editingEngineer, setEditingEngineer] = useState<EngineerRosterItem | null>(null)
  const [deletingEngineer, setDeletingEngineer] = useState<EngineerRosterItem | null>(null)
  const filteredRows = useMemo(
    () => rows.filter((row) => matchesQuery(row, query)),
    [query, rows],
  )
  const linkedIds = useMemo(() => new Set(linkedEngineerIds), [linkedEngineerIds])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <SearchIcon
            aria-hidden="true"
            className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <label className="sr-only" htmlFor={`${kind}-roster-search`}>{label} 검색</label>
          <Input
            className="pl-9"
            id={`${kind}-roster-search`}
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder="이름, 사번 또는 팀 검색"
            type="search"
            value={query}
          />
        </div>
        <p aria-live="polite" className="text-xs text-muted-foreground">
          전체 {rows.length}명 · {filteredRows.length}명 표시
        </p>
      </div>

      {filteredRows.length === 0 ? (
        <div className="py-12 text-center">
          <UsersIcon aria-hidden="true" className="mx-auto size-8 text-muted-foreground/60" />
          <p className="mt-3 font-medium">표시할 {label}가 없습니다</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {rows.length === 0 ? "위 등록 버튼으로 명단을 추가하세요." : "검색어를 변경해 보세요."}
          </p>
        </div>
      ) : (
        <>
          <ul className="divide-y rounded-md border md:hidden">
            {filteredRows.map((row) => (
              <li className="flex items-start justify-between gap-4 p-4" key={`${row.id}-mobile`}>
                <div className="min-w-0">
                  <p className="truncate font-medium">{row.displayName}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{row.employeeCode}</p>
                </div>
                <div className="shrink-0 text-right text-xs text-muted-foreground">
                  <p>{row.team}</p>
                  {kind === "engineer" && "position" in row ? (
                    <>
                      <p className="mt-1">{row.position}</p>
                      <EngineerActions
                        disabled={disabled}
                        engineer={row}
                        linkedAccount={linkedIds.has(row.id)}
                        onDelete={setDeletingEngineer}
                        onEdit={setEditingEngineer}
                        surface="mobile"
                      />
                    </>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
          <div
            aria-label={`${label} 명단 표`}
            className="hidden max-h-[32rem] overflow-auto rounded-md border md:block"
            role="region"
            tabIndex={0}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>이름</TableHead>
                  <TableHead>사번</TableHead>
                  <TableHead>팀</TableHead>
                  {kind === "engineer" ? <TableHead>직급</TableHead> : null}
                  {kind === "engineer" ? <TableHead className="text-right">관리</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.displayName}</TableCell>
                    <TableCell className="numeric">{row.employeeCode}</TableCell>
                    <TableCell>{row.team}</TableCell>
                    {kind === "engineer" && "position" in row ? (
                      <>
                        <TableCell>{row.position}</TableCell>
                        <TableCell>
                          <EngineerActions
                            disabled={disabled}
                            engineer={row}
                            linkedAccount={linkedIds.has(row.id)}
                            onDelete={setDeletingEngineer}
                            onEdit={setEditingEngineer}
                            surface="desktop"
                          />
                        </TableCell>
                      </>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {editingEngineer === null ? null : (
        <EngineerEditorDialog
          engineer={editingEngineer}
          existingEmployeeCodes={rows
            .filter((row) => row.id !== editingEngineer.id)
            .map((row) => row.employeeCode)}
          key={editingEngineer.id}
          onClose={() => setEditingEngineer(null)}
          onSave={onUpdateEngineer}
        />
      )}
      {deletingEngineer === null ? null : (
        <DeleteEngineerDialog
          engineer={deletingEngineer}
          key={deletingEngineer.id}
          onClose={() => setDeletingEngineer(null)}
          onDelete={onDeleteEngineer}
        />
      )}
    </div>
  )
}

function EngineerActions({
  engineer,
  disabled,
  linkedAccount,
  onEdit,
  onDelete,
  surface,
}: Readonly<{
  engineer: EngineerRosterItem
  disabled: boolean
  linkedAccount: boolean
  onEdit: (engineer: EngineerRosterItem) => void
  onDelete: (engineer: EngineerRosterItem) => void
  surface: "mobile" | "desktop"
}>) {
  const linkedDescriptionId = `${engineer.id}-${surface}-linked-account-description`
  return (
    <div className="mt-2 flex items-center justify-end gap-1 md:mt-0">
      {linkedAccount ? (
        <span
          className="mr-1 text-[11px] whitespace-nowrap text-muted-foreground"
          id={linkedDescriptionId}
        >
          계정 연결됨
        </span>
      ) : null}
      <Button
        aria-label={`${engineer.displayName} 수정`}
        disabled={disabled}
        onClick={() => onEdit(engineer)}
        size="icon-sm"
        type="button"
        variant="ghost"
      >
        <PencilIcon aria-hidden="true" />
      </Button>
      <Button
        aria-describedby={linkedAccount ? linkedDescriptionId : undefined}
        aria-label={`${engineer.displayName} 삭제`}
        disabled={disabled || linkedAccount}
        onClick={() => onDelete(engineer)}
        size="icon-sm"
        title={linkedAccount ? "연결된 로그인 계정을 먼저 변경하거나 삭제해 주세요." : undefined}
        type="button"
        variant="destructive"
      >
        <Trash2Icon aria-hidden="true" />
      </Button>
    </div>
  )
}
