"use client"

import { Search } from "lucide-react"
import { useMemo, useState } from "react"

import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { DirectScoreInput } from "./direct-score-input"
import { OperationPanel } from "./operation-panel"
import type {
  DirectTaskScoreViewModel,
  EngineerDirectScoreViewModel,
} from "./types"

interface DirectScoreEditorProps {
  readonly rows: readonly EngineerDirectScoreViewModel[]
  readonly disabled: boolean
  readonly initialQuery?: string
  readonly onScoreChange: (
    engineerId: string,
    taskId: string,
    score: number | null,
    passResult: boolean | null,
  ) => void
}

function DirectResultInput({
  engineerName,
  task,
  disabled,
  onChange,
}: Readonly<{
  engineerName: string
  task: DirectTaskScoreViewModel
  disabled: boolean
  onChange: (score: number | null, passResult: boolean | null) => void
}>) {
  if (task.method === "operator_score") {
    return (
      <DirectScoreInput
        disabled={disabled}
        engineerName={engineerName}
        fieldLabel={task.taskName}
        onChange={(score) => onChange(score, null)}
        value={task.score}
      />
    )
  }
  const value = task.passResult === null ? "unset" : task.passResult ? "pass" : "fail"
  return (
    <Select
      disabled={disabled}
      onValueChange={(next) => onChange(null, next === "unset" ? null : next === "pass")}
      value={value}
    >
      <SelectTrigger aria-label={`${engineerName} ${task.taskName} 결과`} className="w-24"><SelectValue /></SelectTrigger>
      <SelectContent><SelectItem value="unset">미입력</SelectItem><SelectItem value="pass">P</SelectItem><SelectItem value="fail">F</SelectItem></SelectContent>
    </Select>
  )
}

export function DirectScoreEditor({
  rows,
  disabled,
  initialQuery = "",
  onScoreChange,
}: DirectScoreEditorProps) {
  const [query, setQuery] = useState(initialQuery)
  const taskDefinitions = Array.from(
    new Map(
      rows.flatMap((row) => row.directTasks).map((task) => [task.taskId, task]),
    ).values(),
  )
  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("ko-KR")
    if (normalizedQuery === "") {
      return rows
    }

    return rows.filter((row) =>
      [row.engineerName, row.employeeLabel, row.teamName]
        .join(" ")
        .toLocaleLowerCase("ko-KR")
        .includes(normalizedQuery)
    )
  }, [query, rows])

  return (
    <OperationPanel
      description="운영자 입력형 과제의 0~100점 또는 P/F 결과를 입력합니다. 원천 실적과 자동 환산하지 않습니다."
      title="운영자 평가 결과 입력"
    >
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search
            aria-hidden="true"
            className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <label className="sr-only" htmlFor="direct-score-search">
            엔지니어 검색
          </label>
          <Input
            className="pl-9"
            id="direct-score-search"
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder="이름, 사번 또는 팀 검색"
            type="search"
            value={query}
          />
        </div>
        <p aria-live="polite" className="text-xs text-muted-foreground">
          {filteredRows.length}명 표시
        </p>
      </div>

      <div className="divide-y rounded-md border md:hidden">
        {filteredRows.map((row) => (
          <div className="p-4" key={`${row.engineerId}-mobile`}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{row.engineerName}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {row.employeeLabel}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">{row.teamName}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {row.directTasks.map((task) => (
                <div key={task.taskId}>
                  <p className="mb-1.5 text-xs font-medium">{task.taskName} <span className="text-muted-foreground">{task.weight}%</span></p>
                  <DirectResultInput disabled={disabled} engineerName={row.engineerName} onChange={(score, passResult) => onScoreChange(row.engineerId, task.taskId, score, passResult)} task={task} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>엔지니어</TableHead>
              <TableHead>팀</TableHead>
              {taskDefinitions.map((task) => (
                <TableHead className="min-w-32 text-right" key={task.taskId}>
                  {task.taskName}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.map((row) => (
              <TableRow key={row.engineerId}>
                <TableCell>
                  <span className="block font-medium">{row.engineerName}</span>
                  <span className="text-xs text-muted-foreground">
                    {row.employeeLabel}
                  </span>
                </TableCell>
                <TableCell>{row.teamName}</TableCell>
                {taskDefinitions.map((definition) => {
                  const task = row.directTasks.find((entry) => entry.taskId === definition.taskId)
                  return (
                    <TableCell className="text-right" key={definition.taskId}>
                      {task === undefined ? (
                        <span className="text-xs text-muted-foreground">평가 제외</span>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <span className="numeric text-xs text-muted-foreground">{task.weight}%</span>
                          <DirectResultInput disabled={disabled} engineerName={row.engineerName} onChange={(score, passResult) => onScoreChange(row.engineerId, task.taskId, score, passResult)} task={task} />
                        </div>
                      )}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredRows.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          검색 조건에 맞는 엔지니어가 없습니다.
        </p>
      ) : null}
    </OperationPanel>
  )
}
