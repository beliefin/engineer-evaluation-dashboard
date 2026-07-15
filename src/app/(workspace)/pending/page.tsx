import { RoleGate } from "@/components/shared"
import { PendingScreen } from "@/screens/pending-screen"

export default function PendingPage() {
  return (
    <RoleGate allowed={["operator", "approver"]}>
      <PendingScreen />
    </RoleGate>
  )
}
