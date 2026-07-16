import { CircleAlert } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { isSupabaseConfigured } from "@/backend/supabase-client"

import { DetailStatusBadge } from "./detail-status-badge"
import type {
  EngineerFinalResultViewModel,
  EngineerIdentityViewModel,
} from "./engineer-detail.types"

interface EngineerSummaryProps {
  readonly engineer: EngineerIdentityViewModel
  readonly result: EngineerFinalResultViewModel
  readonly contextLabel?: string | undefined
}

export function EngineerSummary({ engineer, result, contextLabel = "엔지니어 상세" }: EngineerSummaryProps) {
  const completionPercent = Math.min(
    100,
    Math.max(0, result.totalCategoryCount === 0 ? 0 : (result.completedCategoryCount / result.totalCategoryCount) * 100)
  )

  return (
    <section
      aria-labelledby="engineer-detail-title"
      className="overflow-hidden rounded-lg border bg-card"
    >
      <div className="grid lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">
              {contextLabel}
            </span>
            <Badge variant="outline" className="bg-muted text-muted-foreground">
              {isSupabaseConfigured() ? "운영 데이터" : "샘플 데이터"}
            </Badge>
            <DetailStatusBadge status={result.status} />
          </div>

          <h1
            id="engineer-detail-title"
            className="text-[1.625rem] leading-[1.3] font-bold tracking-[-0.02em]"
          >
            {engineer.displayName}
          </h1>

          <dl className="mt-5 grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-xs font-medium text-muted-foreground">
                엔지니어 코드
              </dt>
              <dd className="numeric mt-1 text-sm font-semibold">
                {engineer.engineerCode}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">
                소속 팀
              </dt>
              <dd className="mt-1 text-sm font-semibold">
                {engineer.teamName}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">
                평가 시즌
              </dt>
              <dd className="mt-1 text-sm font-semibold">
                {engineer.seasonLabel}
              </dd>
            </div>
          </dl>
        </div>

        <div className="border-t bg-muted/30 p-5 sm:p-6 lg:border-t-0 lg:border-l">
          <p className="text-xs font-medium text-muted-foreground">최종 점수</p>
          {result.status === "complete" ? (
            <>
              <p className="numeric mt-2 flex items-baseline gap-1">
                <span className="text-[2rem] leading-none font-bold tracking-[-0.025em]">
                  {result.finalScore.toFixed(2)}
                </span>
                <span className="text-sm font-medium text-muted-foreground">
                  / 100
                </span>
              </p>
              {result.adjustmentTotal === 0 ? null : (
                <dl className="mt-4 grid grid-cols-2 gap-3 border-t pt-3 text-xs">
                  <div>
                    <dt className="text-muted-foreground">기본 가중 총점</dt>
                    <dd className="numeric mt-1 font-semibold">{result.baseScore?.toFixed(2) ?? "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">가·감점 합계</dt>
                    <dd className={`numeric mt-1 font-semibold ${result.adjustmentTotal > 0 ? "text-emerald-700" : "text-destructive"}`}>
                      {result.adjustmentTotal > 0 ? "+" : ""}{result.adjustmentTotal.toFixed(2)}
                    </dd>
                  </div>
                </dl>
              )}
            </>
          ) : (
            <div className="mt-2 flex items-center gap-2 text-destructive">
              <CircleAlert className="size-5" aria-hidden="true" />
              <span className="text-xl font-bold">미확정</span>
            </div>
          )}
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            모든 필수 평가와 직접점수가 완료되면 최종 점수를 확정합니다.
          </p>
          {result.adjustments.length === 0 ? null : (
            <details className="mt-3 border-t pt-3 text-xs">
              <summary className="cursor-pointer font-semibold">가·감점 내역 {result.adjustments.length}건</summary>
              <ul className="mt-2 space-y-2 text-muted-foreground">
                {result.adjustments.map((adjustment) => (
                  <li className="leading-5" key={adjustment.id}>
                    <span className={`numeric mr-1 font-semibold ${adjustment.amount > 0 ? "text-emerald-700" : "text-destructive"}`}>
                      {adjustment.amount > 0 ? "+" : ""}{adjustment.amount.toFixed(2)}
                    </span>
                    {adjustment.reason}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </div>

      <div className="border-t px-5 py-4 sm:px-6">
        <div className="mb-2 flex items-center justify-between gap-4 text-xs">
          <span className="font-medium">분야별 평가 완료도</span>
          <span className="numeric text-muted-foreground">
            {result.completedCategoryCount} / {result.totalCategoryCount}개
          </span>
        </div>
        <Progress
          value={completionPercent}
          aria-label={`과제별 평가 ${result.totalCategoryCount}개 중 ${result.completedCategoryCount}개 완료`}
          className="h-1.5"
        />
      </div>
    </section>
  )
}
