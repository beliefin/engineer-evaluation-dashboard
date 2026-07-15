import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { DetailStatusBadge } from "./detail-status-badge"
import type { EvaluatorScoreViewModel } from "./engineer-detail.types"

interface EvaluatorDetailPanelProps {
  readonly evaluatorScores: readonly EvaluatorScoreViewModel[]
}

function formatScore(score: number | null) {
  return score === null ? "—" : score.toFixed(1)
}

export function EvaluatorDetailPanel({
  evaluatorScores,
}: EvaluatorDetailPanelProps) {
  return (
    <section aria-labelledby="evaluator-detail-title" className="rounded-lg border bg-card">
      <div className="border-b px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="evaluator-detail-title" className="text-base font-semibold">
            평가자별 상세
          </h2>
          <span className="text-xs font-medium text-muted-foreground">
            운영자 전용 · 샘플 데이터
          </span>
        </div>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          설정 가중치는 양수 원값이며, 실제 반영 비율은 평가 분야별 합계로 정규화한 값입니다.
        </p>
      </div>

      {evaluatorScores.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-muted-foreground">
          등록된 평가자 배정 내역이 없습니다.
        </p>
      ) : (
        <>
          <ul className="divide-y md:hidden" aria-label="평가자별 상세 목록">
            {evaluatorScores.map((score) => (
              <li className="space-y-4 px-5 py-4" key={score.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{score.evaluatorName}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{score.categoryLabel}</p>
                  </div>
                  <DetailStatusBadge status={score.status} />
                </div>
                <dl className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <dt className="text-muted-foreground">원점수</dt>
                    <dd className="numeric mt-1 font-semibold">{formatScore(score.rawScore)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">설정 가중치</dt>
                    <dd className="numeric mt-1 font-semibold">{score.configuredWeight.toFixed(2)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">실제 반영</dt>
                    <dd className="numeric mt-1 font-semibold">{score.normalizedRatioPercent.toFixed(1)}%</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
          <div className="hidden md:block">
            <Table>
            <caption className="sr-only">
              평가자별 원점수, 설정 가중치, 실제 반영 비율과 제출 상태
            </caption>
            <TableHeader>
              <TableRow>
                <TableHead>평가자</TableHead>
                <TableHead>평가 분야</TableHead>
                <TableHead className="text-right">원점수</TableHead>
                <TableHead className="text-right">설정 가중치</TableHead>
                <TableHead className="text-right">실제 반영 비율</TableHead>
                <TableHead>제출 상태</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {evaluatorScores.map((score) => (
                <TableRow key={score.id}>
                  <TableCell className="font-medium">
                    {score.evaluatorName}
                  </TableCell>
                  <TableCell>{score.categoryLabel}</TableCell>
                  <TableCell className="numeric text-right">
                    {formatScore(score.rawScore)}
                  </TableCell>
                  <TableCell className="numeric text-right">
                    {score.configuredWeight.toFixed(2)}
                  </TableCell>
                  <TableCell className="numeric text-right font-semibold">
                    {score.normalizedRatioPercent.toFixed(1)}%
                  </TableCell>
                  <TableCell>
                    <DetailStatusBadge status={score.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            </Table>
          </div>
        </>
      )}
    </section>
  )
}
