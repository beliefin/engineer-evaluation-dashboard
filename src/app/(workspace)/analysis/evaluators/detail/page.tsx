import { Suspense } from "react"

import { LoadingPageSkeleton, RoleGate } from "@/components/shared"
import { EvaluatorDetailQueryScreen } from "@/screens/evaluator-detail-query-screen"

export default function EvaluatorDetailPage() {
  return (
    <RoleGate allowed={["operator", "approver"]}>
      <Suspense fallback={<LoadingPageSkeleton />}>
        <EvaluatorDetailQueryScreen />
      </Suspense>
    </RoleGate>
  )
}
