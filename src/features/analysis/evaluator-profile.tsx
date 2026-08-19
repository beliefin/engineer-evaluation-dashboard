import type { EvaluatorDetailViewModel } from "@/view-models/evaluator-detail"

import { EvaluatorHistory } from "./evaluator-history"
import { EvaluatorItemProfile } from "./evaluator-item-profile"
import { EvaluatorProfileSummary } from "./evaluator-profile-summary"
import { EvaluatorTaskProfile } from "./evaluator-task-profile"

export function EvaluatorProfile({
  model,
}: Readonly<{ model: EvaluatorDetailViewModel }>) {
  return (
    <div className="space-y-6">
      <EvaluatorProfileSummary model={model} />
      <div className="grid min-w-0 gap-6 xl:grid-cols-2">
        <EvaluatorTaskProfile data={model.taskTendencies} />
        <EvaluatorItemProfile key={model.evaluator.id} data={model.itemProfiles} />
      </div>
      <EvaluatorHistory data={model.recentEvaluations} />
    </div>
  )
}
