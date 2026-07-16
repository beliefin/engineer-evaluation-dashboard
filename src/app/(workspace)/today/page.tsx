import { RoleGate } from "@/components/shared"
import { TodayEvaluationsScreen } from "@/screens/today-evaluations-screen"

export default function TodayEvaluationsPage() {
  return (
    <RoleGate allowed={["evaluator"]}>
      <TodayEvaluationsScreen />
    </RoleGate>
  )
}
