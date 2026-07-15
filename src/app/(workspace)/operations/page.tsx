import { Suspense } from "react"

import { LoadingPageSkeleton, RoleGate } from "@/components/shared"
import { OperationsScreen } from "@/screens/operations-screen"

export default function OperationsPage() {
  return (
    <RoleGate allowed={["operator"]}>
      <Suspense fallback={<LoadingPageSkeleton />}>
        <OperationsScreen />
      </Suspense>
    </RoleGate>
  )
}
