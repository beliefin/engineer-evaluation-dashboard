import { Suspense } from "react"

import { LoadingPageSkeleton, RoleGate } from "@/components/shared"
import { DashboardScreen } from "@/screens/dashboard-screen"

export default function DashboardPage() {
  return (
    <RoleGate allowed={["operator", "approver"]}>
      <Suspense fallback={<LoadingPageSkeleton />}>
        <DashboardScreen />
      </Suspense>
    </RoleGate>
  )
}
