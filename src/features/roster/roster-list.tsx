"use client"

import { SearchIcon, UsersIcon } from "lucide-react"
import { useMemo, useState } from "react"

import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import type { EngineerRosterItem, EvaluatorRosterItem } from "./types"

interface RosterListProps {
  readonly kind: "engineer" | "evaluator"
  readonly rows: readonly (EngineerRosterItem | EvaluatorRosterItem)[]
}

function matchesQuery(
  row: EngineerRosterItem | EvaluatorRosterItem,
  query: string,
): boolean {
  return [row.employeeCode, row.displayName, row.team, "position" in row ? row.position : ""]
    .join(" ")
    .toLocaleLowerCase("ko-KR")
    .includes(query.trim().toLocaleLowerCase("ko-KR"))
}

export function RosterList({ kind, rows }: RosterListProps) {
  const label = kind === "engineer" ? "엔지니어" : "평가자"
  const [query, setQuery] = useState("")
  const filteredRows = useMemo(
    () => rows.filter((row) => matchesQuery(row, query)),
    [query, rows],
  )

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
            {rows.length === 0 ? "위 등록 버튼으로 목록을 추가하세요." : "검색어를 변경해 보세요."}
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
                  {kind === "engineer" && "position" in row ? <p className="mt-1">{row.position}</p> : null}
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.displayName}</TableCell>
                    <TableCell className="numeric">{row.employeeCode}</TableCell>
                    <TableCell>{row.team}</TableCell>
                    {kind === "engineer" ? (
                      <TableCell>{"position" in row ? row.position : ""}</TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  )
}
