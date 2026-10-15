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

import { DeleteEvaluatorDialog } from "./delete-evaluator-dialog"
import { DeleteEngineerDialog } from "./delete-engineer-dialog"
import { EngineerEditorDialog } from "./engineer-editor-dialog"
import { EvaluatorEditorDialog } from "./evaluator-editor-dialog"
import { RosterItemActions } from "./roster-item-actions"
import styles from "./roster-signal.module.css"
import type {
  EngineerRegistration,
  EngineerRosterItem,
  EvaluatorRegistration,
  EvaluatorRosterItem,
  RosterDepartmentOptions,
} from "./types"

interface RosterListProps {
  readonly kind: "engineer" | "evaluator"
  readonly rows: readonly (EngineerRosterItem | EvaluatorRosterItem)[]
  readonly disabled: boolean
  readonly departmentOptions: RosterDepartmentOptions
  readonly linkedEngineerIds: readonly string[]
  readonly linkedEvaluatorIds: readonly string[]
  readonly onUpdateEngineer: (engineerId: string, engineer: EngineerRegistration) => boolean
  readonly onDeleteEngineer: (engineerId: string) => boolean
  readonly onUpdateEvaluator: (evaluatorId: string, evaluator: EvaluatorRegistration) => boolean
  readonly onDeleteEvaluator: (evaluatorId: string) => boolean
}

function matchesQuery(row: EngineerRosterItem | EvaluatorRosterItem, query: string): boolean {
  return [
    row.employeeCode,
    row.displayName,
    row.division,
    row.team,
    row.department,
    row.organizationUnit ?? "",
    "position" in row ? row.position : row.rank ?? "",
    row.jobTitle ?? "",
  ]
    .join(" ")
    .toLocaleLowerCase("ko-KR")
    .includes(query.trim().toLocaleLowerCase("ko-KR"))
}

export function RosterList({
  kind,
  rows,
  disabled,
  departmentOptions,
  linkedEngineerIds,
  linkedEvaluatorIds,
  onUpdateEngineer,
  onDeleteEngineer,
  onUpdateEvaluator,
  onDeleteEvaluator,
}: RosterListProps) {
  const label = kind === "engineer" ? "엔지니어" : "평가자"
  const [query, setQuery] = useState("")
  const [editingEngineer, setEditingEngineer] = useState<EngineerRosterItem | null>(null)
  const [deletingEngineer, setDeletingEngineer] = useState<EngineerRosterItem | null>(null)
  const [editingEvaluator, setEditingEvaluator] = useState<EvaluatorRosterItem | null>(null)
  const [deletingEvaluator, setDeletingEvaluator] = useState<EvaluatorRosterItem | null>(null)
  const filteredRows = useMemo(
    () => rows.filter((row) => matchesQuery(row, query)),
    [query, rows],
  )
  const linkedIds = useMemo(() => new Set(linkedEngineerIds), [linkedEngineerIds])
  const linkedEvaluatorIdSet = useMemo(() => new Set(linkedEvaluatorIds), [linkedEvaluatorIds])

  return (
    <div className={styles.list}>
      <div className={styles.searchRow}>
        <div className={styles.searchField}>
          <SearchIcon
            aria-hidden="true"
            className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <label className="sr-only" htmlFor={`${kind}-roster-search`}>{label} 검색</label>
          <Input
            className="pl-9"
            id={`${kind}-roster-search`}
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder="이름, 사번, 팀 또는 담당 검색"
            type="search"
            value={query}
          />
        </div>
        <p aria-live="polite" className={styles.searchCount}>
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
          <ul className={styles.cards}>
            {filteredRows.map((row) => (
              <li className={styles.card} key={`${row.id}-mobile`}>
                <div className={styles.cardHeading}>
                  <h4>{row.displayName}</h4>
                  <span>사번 {row.employeeCode}</span>
                </div>
                <dl className={styles.details}>
                  <div><dt>부문</dt><dd>{row.division}</dd></div>
                  <div><dt>팀</dt><dd>{row.team}</dd></div>
                  <div><dt>부서</dt><dd>{row.organizationUnit ?? "-"}</dd></div>
                  <div><dt>담당</dt><dd>{row.department}</dd></div>
                  <div><dt>직급</dt><dd>{"position" in row ? row.position : row.rank ?? "-"}</dd></div>
                  <div><dt>직책</dt><dd>{row.jobTitle ?? "-"}</dd></div>
                </dl>
                {"position" in row ? (
                  <RosterItemActions
                    disabled={disabled}
                    item={row}
                    linkedAccount={linkedIds.has(row.id)}
                    onDelete={setDeletingEngineer}
                    onEdit={setEditingEngineer}
                    surface="mobile"
                  />
                ) : (
                  <RosterItemActions
                    disabled={disabled}
                    item={row}
                    linkedAccount={linkedEvaluatorIdSet.has(row.id)}
                    onDelete={setDeletingEvaluator}
                    onEdit={setEditingEvaluator}
                    surface="mobile"
                  />
                )}
              </li>
            ))}
          </ul>
          <div
            aria-label={`${label} 명단 표`}
            className={styles.tableFrame}
            role="region"
            tabIndex={0}
          >
            <Table className={styles.table}>
              <TableHeader>
                <TableRow>
                  <TableHead>이름</TableHead>
                  <TableHead>사번</TableHead>
                  <TableHead>부문</TableHead>
                  <TableHead>팀</TableHead>
                  <TableHead>부서</TableHead>
                  <TableHead>담당</TableHead>
                  <TableHead>직급</TableHead>
                  <TableHead>직책</TableHead>
                  <TableHead className="text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.displayName}</TableCell>
                    <TableCell className="numeric">{row.employeeCode}</TableCell>
                    <TableCell>{row.division}</TableCell>
                    <TableCell>{row.team}</TableCell>
                    <TableCell>{row.organizationUnit ?? "-"}</TableCell>
                    <TableCell>{row.department}</TableCell>
                    {"position" in row ? (
                      <>
                        <TableCell>{row.position}</TableCell>
                        <TableCell>{row.jobTitle ?? "-"}</TableCell>
                        <TableCell>
                          <RosterItemActions
                            disabled={disabled}
                            item={row}
                            linkedAccount={linkedIds.has(row.id)}
                            onDelete={setDeletingEngineer}
                            onEdit={setEditingEngineer}
                            surface="desktop"
                          />
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>{row.rank ?? "-"}</TableCell>
                        <TableCell>{row.jobTitle ?? "-"}</TableCell>
                        <TableCell>
                          <RosterItemActions
                            disabled={disabled}
                            item={row}
                            linkedAccount={linkedEvaluatorIdSet.has(row.id)}
                            onDelete={setDeletingEvaluator}
                            onEdit={setEditingEvaluator}
                            surface="desktop"
                          />
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {editingEngineer === null ? null : (
        <EngineerEditorDialog
          departmentOptions={departmentOptions}
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
      {editingEvaluator === null ? null : (
        <EvaluatorEditorDialog
          departmentOptions={departmentOptions}
          evaluator={editingEvaluator}
          existingEmployeeCodes={rows
            .filter((row) => row.id !== editingEvaluator.id)
            .map((row) => row.employeeCode)}
          key={editingEvaluator.id}
          onClose={() => setEditingEvaluator(null)}
          onSave={onUpdateEvaluator}
        />
      )}
      {deletingEvaluator === null ? null : (
        <DeleteEvaluatorDialog
          evaluator={deletingEvaluator}
          key={deletingEvaluator.id}
          onClose={() => setDeletingEvaluator(null)}
          onDelete={onDeleteEvaluator}
        />
      )}
    </div>
  )
}
