"use client"

import { HorizontalScroll } from "@/components/ui/horizontal-scroll"

import "./dashboard-ranking-signal.css"

import { useState } from "react"
import Link from "next/link"

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
import { RankingExportButton } from "./ranking-export-button"

function RankingState({ row }: Readonly<{ row: TaskRankingRow }>) {
  return (
    <div className={`signal-task-rank-status is-${row.status}`}>
      <span>{row.status === "complete" ? "평가 완료" : row.status === "in_progress" ? "진행 중" : "미진행"}</span>
      {row.isTied ? <span className="signal-task-tied">공동 순위</span> : null}
    </div>
  )
}

export function TaskRankingPanel({ title, description, rankings, onDownload }: TaskRankingPanelProps) {
  const [selectedTaskId, setSelectedTaskId] = useState(rankings[0]?.taskId ?? "")
  const activeRanking = rankings.find((ranking) => ranking.taskId === selectedTaskId)
    ?? rankings[0]

  return (
    <section className="signal-task-ranking">
      <h2 className="signal-dashboard-panel-title">{title}</h2>
      <div className="signal-task-ranking-intro">
        <div>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">{description}</p>
        </div>
        <div className="signal-task-ranking-actions">
          {activeRanking ? (
            <Badge variant="outline" className="numeric w-fit">
              완료 {activeRanking.completedCount}/{activeRanking.targetCount}명
            </Badge>
          ) : null}
          {onDownload === undefined ? null : (
            <RankingExportButton
              label="전체 과제 순위 Excel"
              pendingLabel="파일 생성 중"
              onDownload={onDownload}
            />
          )}
        </div>
      </div>

      {activeRanking ? (
        <>
          <div className="signal-task-ranking-select">
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
              <SelectContent className="signal-ranking-select-popup">
                {rankings.map((ranking) => (
                  <SelectItem key={ranking.taskId} value={ranking.taskId}>
                    {ranking.label} 순위
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <HorizontalScroll className="signal-task-ranking-scroll" role="region" aria-label="과제별 순위표, 스크롤할 수 있습니다" tabIndex={0}>
            <Table scrollable={false}>
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
                  <TableRow key={row.id} data-ranking-status={row.status}>
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
          </HorizontalScroll>
        </>
      ) : (
        <div role="status" className="px-5 py-12 text-center text-sm text-muted-foreground">
          순위를 계산할 평가 과제가 없습니다.
        </div>
      )}
    </section>
  )
}
