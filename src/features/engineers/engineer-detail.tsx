import { cn } from "@/lib/utils"

import { CategoryScorePanel } from "./category-score-panel"
import { EngineerSummary } from "./engineer-summary"
import { EvaluatorDetailPanel } from "./evaluator-detail-panel"
import type { EngineerDetailProps } from "./engineer-detail.types"

export function EngineerDetail({
  role,
  model,
  className,
}: EngineerDetailProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <EngineerSummary
        contextLabel={role === "engineer" ? "내 평가" : undefined}
        engineer={model.engineer}
        result={model.result}
      />
      <CategoryScorePanel categories={model.categories} />
      {role === "operator" ? (
        <EvaluatorDetailPanel evaluatorScores={model.evaluatorScores} />
      ) : null}
    </div>
  )
}
