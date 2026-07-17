import { RoleGate } from "@/components/shared"
import { OperatorMaintenanceScreen } from "@/screens/operator-maintenance-screen"

export default function MaintenancePage() {
  return <RoleGate allowed={["operator"]}><OperatorMaintenanceScreen /></RoleGate>
}
