"use client"

import { useMemo, useState, type ReactNode } from "react"
import { Search, UserRound } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import type { AssignedEvaluationViewModel } from "./types"

export type OperatorEngineerOption = Readonly<{
  id: string
  name: string
  employeeCode: string
  teamName: string
}>

export function OperatorEvaluationWorkspace({
  engineers,
  assignments,
  renderForm,
}: Readonly<{
  engineers: readonly OperatorEngineerOption[]
  assignments: readonly AssignedEvaluationViewModel[]
  renderForm: (assignmentId: string) => ReactNode
}>) {
  const [query, setQuery] = useState("")
  const [engineerId, setEngineerId] = useState(engineers[0]?.id ?? "")
  const engineerAssignments = assignments.filter((entry) => entry.engineerId === engineerId)
  const firstTaskId = engineerAssignments[0]?.taskId ?? ""
  const [taskId, setTaskId] = useState(firstTaskId)
  const taskAssignments = engineerAssignments.filter((entry) =>
    entry.taskId === (engineerAssignments.some((candidate) => candidate.taskId === taskId) ? taskId : firstTaskId))
  const [evaluatorId, setEvaluatorId] = useState(taskAssignments[0]?.evaluatorId ?? "")
  const selectedAssignment = taskAssignments.find((entry) => entry.evaluatorId === evaluatorId) ?? taskAssignments[0]
  const visibleEngineers = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("ko-KR")
    if (normalized.length === 0) return engineers
    return engineers.filter((engineer) =>
      [engineer.name, engineer.employeeCode, engineer.teamName]
        .join(" ")
        .toLocaleLowerCase("ko-KR")
        .includes(normalized))
  }, [engineers, query])

  function selectEngineer(nextEngineerId: string) {
    setEngineerId(nextEngineerId)
    const first = assignments.find((entry) => entry.engineerId === nextEngineerId)
    setTaskId(first?.taskId ?? "")
    setEvaluatorId(first?.evaluatorId ?? "")
  }

  function selectTask(nextTaskId: string) {
    setTaskId(nextTaskId)
    setEvaluatorId(engineerAssignments.find((entry) => entry.taskId === nextTaskId)?.evaluatorId ?? "")
  }

  const taskOptions = Array.from(
    new Map(engineerAssignments.map((entry) => [entry.taskId, entry.categoryLabel])).entries(),
    ([id, label]) => ({ id, label }),
  )
  const selectedEngineer = engineers.find((engineer) => engineer.id === engineerId)

  return (
    <section className="overflow-hidden rounded-lg border bg-card" aria-labelledby="operator-entry-title">
      <header className="border-b px-4 py-4 sm:px-5">
        <h2 className="text-lg font-semibold" id="operator-entry-title">엔지니어별 평가 입력</h2>
        <p className="mt-1 text-sm text-muted-foreground">엔지니어를 선택한 뒤 실제 배정된 과제와 평가자를 골라 점수를 바로 입력합니다.</p>
      </header>
      <div className="grid lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="border-b lg:border-r lg:border-b-0" aria-label="엔지니어 목록">
          <div className="border-b p-3">
            <div className="relative">
              <Search aria-hidden="true" className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <label className="sr-only" htmlFor="operator-engineer-search">엔지니어 검색</label>
              <Input
                className="pl-9"
                id="operator-engineer-search"
                onChange={(event) => setQuery(event.currentTarget.value)}
                placeholder="이름, 사번, 팀 검색"
                type="search"
                value={query}
              />
            </div>
          </div>
          <div className="max-h-72 overflow-y-auto lg:max-h-[70dvh]">
            {visibleEngineers.map((engineer) => {
              const count = assignments.filter((entry) => entry.engineerId === engineer.id).length
              const selected = engineer.id === engineerId
              return (
                <button
                  aria-pressed={selected}
                  className={`flex w-full items-center gap-3 border-l-2 px-4 py-3 text-left transition-colors ${selected ? "border-l-primary bg-primary/5" : "border-l-transparent hover:bg-muted/45"}`}
                  key={engineer.id}
                  onClick={() => selectEngineer(engineer.id)}
                  type="button"
                >
                  <UserRound aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{engineer.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{engineer.employeeCode} · {engineer.teamName}</span>
                  </span>
                  <Badge variant={count > 0 ? "secondary" : "outline"}>{count}</Badge>
                </button>
              )
            })}
          </div>
        </aside>
        <div className="min-w-0 p-4 sm:p-5">
          {selectedEngineer === undefined ? null : engineerAssignments.length === 0 ? (
            <div className="rounded-md border border-dashed py-14 text-center">
              <p className="font-semibold">{selectedEngineer.name}에게 배정된 평가가 없습니다.</p>
              <p className="mt-1 text-sm text-muted-foreground">평가 운영 관리의 평가자 배정 탭에서 과제별 평가자를 먼저 지정해 주세요.</p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid gap-4 rounded-md border bg-muted/20 p-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="operator-task-select">과제</Label>
                  <Select onValueChange={selectTask} value={selectedAssignment?.taskId ?? firstTaskId}>
                    <SelectTrigger className="w-full" id="operator-task-select"><SelectValue /></SelectTrigger>
                    <SelectContent>{taskOptions.map((task) => <SelectItem key={task.id} value={task.id}>{task.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="operator-evaluator-select">평가자</Label>
                  <Select onValueChange={setEvaluatorId} value={selectedAssignment?.evaluatorId ?? ""}>
                    <SelectTrigger className="w-full" id="operator-evaluator-select"><SelectValue /></SelectTrigger>
                    <SelectContent>{taskAssignments.map((assignment) => <SelectItem key={assignment.evaluatorId} value={assignment.evaluatorId}>{assignment.evaluatorName}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              {selectedAssignment === undefined ? null : renderForm(selectedAssignment.id)}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
