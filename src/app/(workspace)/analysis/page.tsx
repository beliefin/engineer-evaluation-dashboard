import { Suspense } from "react"

import { LoadingPageSkeleton, RoleGate } from "@/components/shared"
import { AnalysisScreen } from "@/screens/analysis-screen"

export default function AnalysisPage() {
  return (
    <RoleGate allowEvaluatorInsights allowed={["operator", "approver"]}>
      <Suspense fallback={<LoadingPageSkeleton />}>
        <AnalysisScreen />
      </Suspense>
    </RoleGate>
  )
}
