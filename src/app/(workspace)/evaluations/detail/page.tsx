import { Suspense } from "react"

import { RoleGate } from "@/components/shared"
import { EvaluationFormQueryScreen } from "@/screens/evaluation-form-query-screen"

export default function EvaluationDetailPage() {
  return (
    <RoleGate allowed={["operator", "evaluator"]}>
      <Suspense fallback={null}>
        <EvaluationFormQueryScreen />
      </Suspense>
    </RoleGate>
  )
}
