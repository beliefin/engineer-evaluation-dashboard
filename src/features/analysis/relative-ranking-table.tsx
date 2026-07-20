"use client"

import { Button } from "@/components/ui/button"
import type { RelativeRankingPoint } from "@/view-models/relative-ranking"

type RelativeRankingTableProps = Readonly<{
  points: readonly RelativeRankingPoint[]
  selectedEngineerId: string | null
  onSelectEngineer: (engineerId: string) => void
}>

function gradeLabel(point: RelativeRankingPoint): string {
  if (point.grade === "SA") return "S/A"
  if (point.grade === "unavailable") return "분석 불가"
  return point.grade
}

export function RelativeRankingTable({
  points,
  selectedEngineerId,
  onSelectEngineer,
}: RelativeRankingTableProps) {
  if (points.length === 0) return null
  return (
    <details className="border-t pt-4">
      <summary className="cursor-pointer text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        선택 집단 순위표 보기
      </summary>
      <ul className="mt-3 space-y-2 md:hidden" aria-label="선택 집단 모바일 순위 목록">
        {points.toSorted((left, right) => right.score - left.score).map((point) => (
          <li
            key={point.engineerId}
            className={`rounded-md border p-3 ${point.engineerId === selectedEngineerId ? "border-primary bg-accent" : ""}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold">
                  <span className="mr-2 whitespace-nowrap tabular-nums">{point.standardRank}위</span>
                  {point.engineerName}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {point.employeeCode} · {point.team} · {point.department}
                </p>
              </div>
              <p className="shrink-0 text-right font-semibold tabular-nums">{point.score.toFixed(1)}점</p>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              <span>상위 백분위 {point.topPercentile.toFixed(1)}%</span>
              <span className="whitespace-nowrap">{gradeLabel(point)}{point.isBoundaryTie ? " · 경계 동점" : ""}</span>
              <span className={`whitespace-nowrap ${point.scoreStatus === "partial" ? "text-warning" : "text-success"}`}>
                {point.scoreStatus === "partial" ? "부분점수" : "확정"}
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 w-full"
              onClick={() => onSelectEngineer(point.engineerId)}
            >
              {point.engineerName} 상세 보기
            </Button>
          </li>
        ))}
      </ul>
      <div className="mt-3 hidden overflow-x-auto rounded-md border md:block">
        <table className="w-full min-w-[780px] border-collapse text-sm">
          <caption className="sr-only">선택 집단의 현재 점수, 상대 순위와 명목 등급</caption>
          <thead className="bg-muted/70 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2.5 text-right font-medium">순위</th>
              <th className="px-3 py-2.5 font-medium">엔지니어</th>
              <th className="px-3 py-2.5 font-medium">조직</th>
              <th className="px-3 py-2.5 text-right font-medium">현재 점수</th>
              <th className="px-3 py-2.5 text-right font-medium">상위 백분위</th>
              <th className="px-3 py-2.5 font-medium">명목 구간</th>
              <th className="px-3 py-2.5 font-medium">상태</th>
              <th className="px-3 py-2.5 text-right font-medium">상세</th>
            </tr>
          </thead>
          <tbody>
            {points.toSorted((left, right) => right.score - left.score).map((point) => (
              <tr
                key={point.engineerId}
                className={`border-t ${point.engineerId === selectedEngineerId ? "bg-accent" : ""}`}
              >
                <td className="whitespace-nowrap px-3 py-2.5 text-right font-medium tabular-nums">{point.standardRank}위</td>
                <td className="px-3 py-2.5">
                  <span className="font-medium">{point.engineerName}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{point.employeeCode}</span>
                </td>
                <td className="px-3 py-2.5 text-muted-foreground">{point.team} · {point.department}</td>
                <td className="px-3 py-2.5 text-right font-semibold tabular-nums">{point.score.toFixed(1)}점</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{point.topPercentile.toFixed(1)}%</td>
                <td className="whitespace-nowrap px-3 py-2.5">{gradeLabel(point)}{point.isBoundaryTie ? " · 경계 동점" : ""}</td>
                <td className={`whitespace-nowrap px-3 py-2.5 ${point.scoreStatus === "partial" ? "text-warning" : "text-success"}`}>
                  {point.scoreStatus === "partial" ? "부분점수" : "확정"}
                </td>
                <td className="px-3 py-2.5 text-right">
                  <Button type="button" variant="ghost" size="sm" onClick={() => onSelectEngineer(point.engineerId)}>
                    {point.engineerName} 상세
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  )
}
