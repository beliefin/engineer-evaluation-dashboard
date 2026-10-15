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

import { directScoreLimit } from "@/domain/direct-score-limit"

import { DirectScoreInput } from "./direct-score-input"
import styles from "./direct-score-signal.module.css"
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
        disabled={disabled || task.formulaDriven === true}
        engineerName={engineerName}
        fieldLabel={task.taskName}
        maxScore={directScoreLimit({ name: task.taskName, method: task.method })}
        onChange={(score) => onChange(score, null)}
        value={task.score}
      />
    )
  }
  const value = task.passResult === null ? "unset" : task.passResult ? "pass" : "fail"
  return (
    <Select
      disabled={disabled || task.formulaDriven === true}
      onValueChange={(next) => onChange(null, next === "unset" ? null : next === "pass")}
      value={value}
    >
      <SelectTrigger aria-label={`${engineerName} ${task.taskName} 결과`} className={styles.passFail}><SelectValue /></SelectTrigger>
      <SelectContent className={styles.passFailMenu}><SelectItem value="unset">미입력</SelectItem><SelectItem value="pass">P</SelectItem><SelectItem value="fail">F</SelectItem></SelectContent>
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
    <div className={styles.editor}>
      <OperationPanel
        description="고등급 제안 0~120점, 다른 운영자 과제 0~100점·P/F 직접 입력. 환산식 연결 과제는 원천 실적 기준 자동 계산"
        title="직접 점수 확인"
      >
        <div className={styles.toolbar}>
          <div className={styles.searchField}>
            <Search
              aria-hidden="true"
              className={styles.searchIcon}
            />
            <label className="sr-only" htmlFor="direct-score-search">
              엔지니어 검색
            </label>
            <Input
              className={styles.searchInput}
              id="direct-score-search"
              onChange={(event) => setQuery(event.currentTarget.value)}
              placeholder="이름, 사번 또는 팀 검색"
              type="search"
              value={query}
            />
          </div>
          <p aria-live="polite" className={styles.secondary}>
            {filteredRows.length}명 표시
          </p>
        </div>

        <div className={styles.mobileCards}>
          {filteredRows.map((row) => (
            <div className={styles.mobileCard} key={`${row.engineerId}-mobile`}>
              <div className={styles.mobileHeading}>
                <div>
                  <p className={styles.engineerName}>{row.engineerName}</p>
                  <p className={styles.secondary}>
                    {row.employeeLabel}
                  </p>
                </div>
                <p className={styles.secondary}>{row.teamName}</p>
              </div>
              <div className={styles.mobileTasks}>
                {row.directTasks.map((task) => (
                  <div className={styles.mobileTask} key={task.taskId}>
                    <p className={styles.taskLabel}>{task.taskName} <span className={styles.weight}>{task.weight}%</span>{task.formulaDriven ? <span className={styles.formula}>환산식 적용</span> : null}</p>
                    <DirectResultInput disabled={disabled} engineerName={row.engineerName} onChange={(score, passResult) => onScoreChange(row.engineerId, task.taskId, score, passResult)} task={task} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className={styles.desktopTable}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>엔지니어</TableHead>
                <TableHead>팀</TableHead>
                {taskDefinitions.map((task) => (
                  <TableHead className={styles.taskHeading} key={task.taskId}>
                    {task.taskName}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.map((row) => (
                <TableRow key={row.engineerId}>
                  <TableCell>
                    <span className={styles.engineerName}>{row.engineerName}</span>
                    <span className={styles.secondary}>
                      {row.employeeLabel}
                    </span>
                  </TableCell>
                  <TableCell>{row.teamName}</TableCell>
                  {taskDefinitions.map((definition) => {
                    const task = row.directTasks.find((entry) => entry.taskId === definition.taskId)
                    return (
                      <TableCell className={styles.resultCell} key={definition.taskId}>
                        {task === undefined ? (
                          <span className={styles.excluded}>평가 제외</span>
                        ) : (
                          <div className={styles.resultGroup}>
                            <span className={styles.weight}>{task.weight}%</span>{task.formulaDriven ? <span className={styles.formula}>환산식</span> : null}
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
          <p className={styles.empty}>
            검색 조건에 맞는 엔지니어가 없습니다.
          </p>
        ) : null}
      </OperationPanel>
    </div>
  )
}
