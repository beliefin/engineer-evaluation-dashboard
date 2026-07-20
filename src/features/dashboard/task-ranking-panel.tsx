"use client"

import { useState } from "react"
import Link from "next/link"

import { StatusBadge } from "@/components/shared"
import { Badge } from "@/components/ui/badge"
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

import type { TaskRankingPanelProps, TaskRankingRow } from "./dashboard-view-models"

function RankingState({ row }: Readonly<{ row: TaskRankingRow }>) {
  if (row.status === "complete") {
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <StatusBadge status="completed" label="평가 완료" />
        {row.isTied ? <Badge variant="outline">공동 순위</Badge> : null}
      </div>
    )
  }

  return (
    <StatusBadge
      status={row.status === "in_progress" ? "in_progress" : "pending"}
      label={row.status === "in_progress" ? "진행 중" : "미진행"}
    />
  )
}

export function TaskRankingPanel({ title, description, rankings }: TaskRankingPanelProps) {
  const [selectedTaskId, setSelectedTaskId] = useState(rankings[0]?.taskId ?? "")
  const activeRanking = rankings.find((ranking) => ranking.taskId === selectedTaskId)
    ?? rankings[0]

  return (
    <section className="overflow-hidden rounded-md border border-border bg-card">
      <div className="flex flex-col gap-4 border-b border-border-subtle px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">{description}</p>
        </div>
        {activeRanking ? (
          <Badge variant="outline" className="numeric w-fit">
            완료 {activeRanking.completedCount}/{activeRanking.targetCount}명
          </Badge>
        ) : null}
      </div>

      {activeRanking ? (
        <>
          <div className="flex flex-col gap-2 border-b border-border bg-muted/45 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="dashboard-task-ranking-select">
              순위 과제
            </label>
            <Select value={activeRanking.taskId} onValueChange={setSelectedTaskId}>
              <SelectTrigger
                id="dashboard-task-ranking-select"
                className="w-full sm:w-72"
                aria-label="순위 과제 선택"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {rankings.map((ranking) => (
                  <SelectItem key={ranking.taskId} value={ranking.taskId}>
                    {ranking.label} 순위
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="max-h-[32rem] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow>
                  <TableHead className="w-20 px-5">순위</TableHead>
                  <TableHead>엔지니어</TableHead>
                  <TableHead className="text-right">과제 평균</TableHead>
                  <TableHead className="w-40">상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeRanking.rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="numeric px-5 font-bold">
                      {row.rank === null ? "—" : `${row.rank}위`}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={row.href}
                        className="font-semibold text-foreground underline-offset-4 hover:text-primary hover:underline"
                      >
                        {row.name}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted-foreground">{row.team}</p>
                    </TableCell>
                    <TableCell className="numeric text-right font-bold text-primary">
                      {row.score === null ? "—" : row.score.toFixed(2)}
                    </TableCell>
                    <TableCell><RankingState row={row} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      ) : (
        <div role="status" className="px-5 py-12 text-center text-sm text-muted-foreground">
          순위를 계산할 평가 과제가 없습니다.
        </div>
      )}
    </section>
  )
}
