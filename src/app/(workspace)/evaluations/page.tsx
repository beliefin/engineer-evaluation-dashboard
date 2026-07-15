import { RoleGate } from "@/components/shared"
import { EvaluationsScreen } from "@/screens/evaluations-screen"

export default function EvaluationsPage() {
  return (
    <RoleGate allowed={["operator", "evaluator"]}>
      <EvaluationsScreen />
    </RoleGate>
  )
}
