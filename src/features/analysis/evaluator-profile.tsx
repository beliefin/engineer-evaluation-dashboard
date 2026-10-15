import type { EvaluatorDetailViewModel } from "@/view-models/evaluator-detail"

import { EvaluatorHistory } from "./evaluator-history"
import { EvaluatorItemProfile } from "./evaluator-item-profile"
import { EvaluatorProfileSummary } from "./evaluator-profile-summary"
import { EvaluatorTaskProfile } from "./evaluator-task-profile"

export function EvaluatorProfile({
  model,
}: Readonly<{ model: EvaluatorDetailViewModel }>) {
  return (
    <div className="signal-evaluator-profile">
      <EvaluatorProfileSummary model={model} />
      <EvaluatorTaskProfile data={model.taskTendencies} />
      <EvaluatorItemProfile key={model.evaluator.id} data={model.itemProfiles} />
      <EvaluatorHistory data={model.recentEvaluations} />
    </div>
  )
}
