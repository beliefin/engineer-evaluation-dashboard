"use client"

import { useMemo, useState, type ReactNode } from "react"
import { Columns2Icon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import type { AssignedEvaluationViewModel } from "./types"

interface ParallelAssignmentGroup {
  readonly taskId: string
  readonly taskLabel: string
  readonly assignments: readonly AssignedEvaluationViewModel[]
}

interface EvaluatorParallelWorkspaceProps {
  readonly assignments: readonly AssignedEvaluationViewModel[]
  readonly renderParallelForm: (leftAssignmentId: string, rightAssignmentId: string) => ReactNode
}

function buildParallelGroups(
  assignments: readonly AssignedEvaluationViewModel[],
): readonly ParallelAssignmentGroup[] {
  const groups = new Map<string, AssignedEvaluationViewModel[]>()
  for (const assignment of assignments) {
    const current = groups.get(assignment.taskId) ?? []
    current.push(assignment)
    groups.set(assignment.taskId, current)
  }

  return Array.from(groups, ([taskId, taskAssignments]) => ({
    taskId,
    taskLabel: taskAssignments[0]?.categoryLabel ?? taskId,
    assignments: taskAssignments.toSorted((left, right) =>
      left.engineerName.localeCompare(right.engineerName, "ko"),
    ),
  }))
    .filter((group) => group.assignments.length >= 2)
    .toSorted((left, right) => {
      const leftIsOts = left.taskLabel.toLocaleUpperCase().includes("OTS")
      const rightIsOts = right.taskLabel.toLocaleUpperCase().includes("OTS")
      if (leftIsOts !== rightIsOts) return leftIsOts ? -1 : 1
      return left.taskLabel.localeCompare(right.taskLabel, "ko")
    })
}

export function EvaluatorParallelWorkspace({
  assignments,
  renderParallelForm,
}: EvaluatorParallelWorkspaceProps) {
  const groups = useMemo(() => buildParallelGroups(assignments), [assignments])
  const [open, setOpen] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState(groups[0]?.taskId ?? "")
  const [leftAssignmentId, setLeftAssignmentId] = useState(
    groups[0]?.assignments[0]?.id ?? "",
  )
  const [rightAssignmentId, setRightAssignmentId] = useState(
    groups[0]?.assignments[1]?.id ?? "",
  )

  if (groups.length === 0) return null

  const fallbackGroup = groups[0]
  if (fallbackGroup === undefined) return null
  const activeGroup = groups.find((group) => group.taskId === selectedTaskId) ?? fallbackGroup
  const firstAssignment = activeGroup.assignments[0]
  const secondAssignment = activeGroup.assignments[1]
  if (firstAssignment === undefined || secondAssignment === undefined) return null

  const leftAssignment =
    activeGroup.assignments.find((assignment) => assignment.id === leftAssignmentId) ??
    firstAssignment
  const rightAssignment =
    activeGroup.assignments.find((assignment) => assignment.id === rightAssignmentId) ??
    secondAssignment

  function handleTaskChange(taskId: string) {
    const nextGroup = groups.find((group) => group.taskId === taskId)
    const nextLeft = nextGroup?.assignments[0]
    const nextRight = nextGroup?.assignments[1]
    if (nextGroup === undefined || nextLeft === undefined || nextRight === undefined) return
    setSelectedTaskId(taskId)
    setLeftAssignmentId(nextLeft.id)
    setRightAssignmentId(nextRight.id)
  }

  function handleLeftChange(assignmentId: string) {
    if (assignmentId === rightAssignment.id) setRightAssignmentId(leftAssignment.id)
    setLeftAssignmentId(assignmentId)
  }

  function handleRightChange(assignmentId: string) {
    if (assignmentId === leftAssignment.id) setLeftAssignmentId(rightAssignment.id)
    setRightAssignmentId(assignmentId)
  }

  return (
    <section
      aria-labelledby="parallel-evaluation-title"
      className="overflow-hidden rounded-md border border-border bg-card"
    >
      <header className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-1 text-[10px] font-semibold tracking-[0.14em] text-primary uppercase">
            Paired score sheet
          </p>
          <h2 id="parallel-evaluation-title" className="text-xl font-semibold tracking-tight">
            두 발표자 동시 평가
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            공통 문항의 좌우 점수 열에 두 발표자를 함께 입력합니다. 저장과 제출은 발표자별로 분리됩니다.
          </p>
        </div>
        <Button
          aria-expanded={open}
          aria-controls="parallel-evaluation-content"
          onClick={() => setOpen((current) => !current)}
          type="button"
          variant={open ? "outline" : "default"}
        >
          {open ? <XIcon aria-hidden="true" /> : <Columns2Icon aria-hidden="true" />}
          {open ? "동시 평가 닫기" : "2명 동시 평가"}
        </Button>
      </header>

      {open ? (
        <div id="parallel-evaluation-content" className="border-t border-border-subtle bg-muted/20 p-4 md:p-5">
          <div className="grid gap-4 rounded-md border border-border-subtle bg-card p-4 lg:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="parallel-task">평가 과제</Label>
              <Select value={activeGroup.taskId} onValueChange={handleTaskChange}>
                <SelectTrigger id="parallel-task" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectItem key={group.taskId} value={group.taskId}>
                      {group.taskLabel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="parallel-left-presenter">왼쪽 발표자</Label>
              <Select value={leftAssignment.id} onValueChange={handleLeftChange}>
                <SelectTrigger id="parallel-left-presenter" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {activeGroup.assignments.map((assignment) => (
                    <SelectItem key={assignment.id} value={assignment.id}>
                      {assignment.engineerName} · {assignment.teamName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="parallel-right-presenter">오른쪽 발표자</Label>
              <Select value={rightAssignment.id} onValueChange={handleRightChange}>
                <SelectTrigger id="parallel-right-presenter" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {activeGroup.assignments.map((assignment) => (
                    <SelectItem key={assignment.id} value={assignment.id}>
                      {assignment.engineerName} · {assignment.teamName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            발표자를 바꾸면 각 발표자의 저장된 점수를 해당 열에 불러옵니다. 같은 발표자를 양쪽에 고르면 두 위치가 서로 바뀝니다.
          </p>
          <div className="mt-4 min-w-0">
            {renderParallelForm(leftAssignment.id, rightAssignment.id)}
          </div>
        </div>
      ) : null}
    </section>
  )
}
