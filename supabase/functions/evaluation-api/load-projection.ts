import { ApiError } from "./api-error.ts"
import type { Profile, Snapshot } from "./model.ts"
import { projectInsightsSnapshot, projectSnapshot } from "./projection.ts"

export type EvaluationView = "default" | "insights"

export function projectRequestedSnapshot(
  snapshot: Snapshot,
  profile: Profile,
  view: EvaluationView,
): Snapshot {
  if (view === "default") return projectSnapshot(snapshot, profile)
  const allowed = profile.role === "operator" || profile.role === "approver" ||
    (profile.role === "evaluator" && profile.can_view_insights)
  if (!allowed) {
    throw new ApiError(403, "FORBIDDEN", "현황·분석 열람 권한이 필요합니다.")
  }
  return projectInsightsSnapshot(snapshot)
}
