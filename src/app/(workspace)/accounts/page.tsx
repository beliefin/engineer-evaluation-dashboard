import { RoleGate } from "@/components/shared"
import { AccountManagementScreen } from "@/screens/account-management-screen"

export default function AccountsPage() {
  return (
    <RoleGate allowed={["operator"]}>
      <AccountManagementScreen />
    </RoleGate>
  )
}
