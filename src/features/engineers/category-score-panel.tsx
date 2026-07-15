import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { DetailStatusBadge } from "./detail-status-badge"
import type { CategoryScoreViewModel } from "./engineer-detail.types"

interface CategoryScorePanelProps {
  readonly categories: readonly CategoryScoreViewModel[]
}

function formatRawScore(score: number | null) {
  return score === null ? "—" : score.toFixed(1)
}

function formatContribution(category: CategoryScoreViewModel) {
  const value =
    category.contribution === null
      ? "—"
      : category.contribution.toFixed(2)

  return `${value} / ${category.maxContribution}`
}

function scoreProgress(category: CategoryScoreViewModel) {
  return Math.min(100, Math.max(0, category.rawScore ?? 0))
}

export function CategoryScorePanel({ categories }: CategoryScorePanelProps) {
  return (
    <section aria-labelledby="category-score-title" className="rounded-lg border bg-card">
      <div className="border-b px-5 py-4 sm:px-6">
        <h2 id="category-score-title" className="text-base font-semibold">
          분야별 점수
        </h2>
        <p className="mt-1 text-pretty text-sm leading-6 text-muted-foreground">
          원점수·반영 비율·환산점수를 표시합니다. 미완료는 미확정입니다.
        </p>
      </div>

      <div className="hidden overflow-x-auto md:block">
        <Table>
          <caption className="sr-only">
            평가 분야별 원점수, 반영 비율, 환산점수와 진행 상태
          </caption>
          <TableHeader>
            <TableRow>
              <TableHead>평가 분야</TableHead>
              <TableHead className="text-right">원점수</TableHead>
              <TableHead className="text-right">반영 비율</TableHead>
              <TableHead className="text-right">환산점수</TableHead>
              <TableHead className="min-w-36">점수 위치</TableHead>
              <TableHead>상태</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.key}>
                <TableCell className="font-medium">{category.label}</TableCell>
                <TableCell className="numeric text-right">
                  {formatRawScore(category.rawScore)}
                </TableCell>
                <TableCell className="numeric text-right">
                  {category.reflectionRatioPercent.toFixed(1)}%
                </TableCell>
                <TableCell className="numeric text-right font-semibold">
                  {formatContribution(category)}
                </TableCell>
                <TableCell>
                  <Progress
                    value={scoreProgress(category)}
                    aria-label={`${category.label} 원점수 ${formatRawScore(category.rawScore)}점`}
                    className="h-1.5"
                  />
                </TableCell>
                <TableCell>
                  <DetailStatusBadge status={category.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="divide-y md:hidden" aria-label="분야별 점수 목록">
        {categories.map((category) => (
          <li key={category.key} className="px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-sm font-semibold">{category.label}</h3>
              <DetailStatusBadge status={category.status} />
            </div>
            <dl className="mt-4 grid grid-cols-3 gap-3 text-xs">
              <div>
                <dt className="text-muted-foreground">원점수</dt>
                <dd className="numeric mt-1 font-semibold">
                  {formatRawScore(category.rawScore)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">반영 비율</dt>
                <dd className="numeric mt-1 font-semibold">
                  {category.reflectionRatioPercent.toFixed(1)}%
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">환산점수</dt>
                <dd className="numeric mt-1 font-semibold">
                  {formatContribution(category)}
                </dd>
              </div>
            </dl>
            <Progress
              value={scoreProgress(category)}
              aria-label={`${category.label} 원점수 ${formatRawScore(category.rawScore)}점`}
              className="mt-4 h-1.5"
            />
          </li>
        ))}
      </ul>
    </section>
  )
}
