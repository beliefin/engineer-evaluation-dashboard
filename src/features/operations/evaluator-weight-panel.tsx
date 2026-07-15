"use client"

import { Search } from "lucide-react"
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
import type { EvaluatorWeightViewModel } from "./types"
import { WeightInput } from "./weight-input"

interface EvaluatorWeightPanelProps {
  readonly rows: readonly EvaluatorWeightViewModel[]
  readonly disabled: boolean
  readonly onWeightChange: (
    assignmentId: string,
    rawWeight: number
  ) => void
}

const ratioFormatter = new Intl.NumberFormat("ko-KR", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

export function EvaluatorWeightPanel({
  rows,
  disabled,
  onWeightChange,
}: EvaluatorWeightPanelProps) {
  const [query, setQuery] = useState("")
  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("ko-KR")
    if (normalizedQuery === "") return rows

    return rows.filter((row) =>
      [
        row.engineerName,
        row.employeeLabel,
        row.teamName,
        row.evaluatorName,
        row.categoryLabel,
      ]
        .join(" ")
        .toLocaleLowerCase("ko-KR")
        .includes(normalizedQuery),
    )
  }, [query, rows])

  return (
    <OperationPanel
      aside={<Badge variant="outline">자동 정규화</Badge>}
      description="각 엔지니어·평가 분야의 배정별 원시 가중치를 입력하면 같은 배정 그룹 안에서 실제 반영 비율을 자동 계산합니다."
      title="평가 배정별 가중치"
    >
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search
            aria-hidden="true"
            className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <label className="sr-only" htmlFor="weight-assignment-search">
            평가 배정 검색
          </label>
          <Input
            className="pl-9"
            id="weight-assignment-search"
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder="엔지니어, 사번, 팀, 평가자 또는 분야 검색"
            type="search"
            value={query}
          />
        </div>
        <p aria-live="polite" className="text-xs text-muted-foreground">
          {filteredRows.length}개 배정 표시
        </p>
      </div>

      <div
        aria-label="평가 배정별 가중치 목록"
        className="max-h-[42rem] divide-y overflow-y-auto rounded-md border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:hidden"
        role="region"
        tabIndex={0}
      >
        {filteredRows.map((row) => (
          <div
            className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 p-4"
            key={`${row.assignmentId}-mobile`}
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{row.engineerName}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {row.employeeLabel} · {row.teamName}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                {row.categoryLabel} · {row.evaluatorName}
              </p>
              <p className="numeric mt-3 text-xs text-muted-foreground">
                실제 반영 비율{" "}
                <strong className="text-foreground">
                  {ratioFormatter.format(row.normalizedRatio)}
                </strong>
              </p>
            </div>
            <WeightInput
              categoryLabel={row.categoryLabel}
              disabled={disabled}
              engineerName={row.engineerName}
              evaluatorName={row.evaluatorName}
              onChange={(rawWeight) =>
                onWeightChange(row.assignmentId, rawWeight)
              }
              value={row.rawWeight}
            />
          </div>
        ))}
      </div>
      <div
        aria-label="평가 배정별 가중치 표"
        className="hidden max-h-[42rem] overflow-auto rounded-md border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:block"
        role="region"
        tabIndex={0}
      >
        <Table className="min-w-[56rem]">
          <TableHeader>
            <TableRow>
              <TableHead>엔지니어</TableHead>
              <TableHead>팀</TableHead>
              <TableHead>평가 분야</TableHead>
              <TableHead>평가자</TableHead>
              <TableHead className="w-40 text-right">원시 가중치</TableHead>
              <TableHead className="w-40 text-right">실제 반영 비율</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.map((row) => (
              <TableRow key={row.assignmentId}>
                <TableCell>
                  <span className="block font-medium">{row.engineerName}</span>
                  <span className="text-xs text-muted-foreground">
                    {row.employeeLabel}
                  </span>
                </TableCell>
                <TableCell>{row.teamName}</TableCell>
                <TableCell className="font-medium">{row.categoryLabel}</TableCell>
                <TableCell>{row.evaluatorName}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end">
                    <WeightInput
                      categoryLabel={row.categoryLabel}
                      disabled={disabled}
                      engineerName={row.engineerName}
                      evaluatorName={row.evaluatorName}
                      onChange={(rawWeight) =>
                        onWeightChange(row.assignmentId, rawWeight)
                      }
                      value={row.rawWeight}
                    />
                  </div>
                </TableCell>
                <TableCell className="numeric text-right font-semibold">
                  {ratioFormatter.format(row.normalizedRatio)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {filteredRows.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          검색 조건에 맞는 평가 배정이 없습니다.
        </p>
      ) : null}
    </OperationPanel>
  )
}
