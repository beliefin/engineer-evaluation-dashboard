import { Suspense } from "react"

import { RoleGate } from "@/components/shared"
import { EngineerDetailQueryScreen } from "@/screens/engineer-detail-query-screen"

export default function EngineerDetailPage() {
  return (
    <RoleGate allowed={["operator", "approver"]}>
      <Suspense fallback={null}>
        <EngineerDetailQueryScreen />
      </Suspense>
    </RoleGate>
  )
}
