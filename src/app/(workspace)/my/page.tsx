import { RoleGate } from "@/components/shared"
import { EngineerPortalScreen } from "@/screens/engineer-portal-screen"

export default function MyEvaluationPage() {
  return (
    <RoleGate allowed={["engineer"]}>
      <EngineerPortalScreen />
    </RoleGate>
  )
}
