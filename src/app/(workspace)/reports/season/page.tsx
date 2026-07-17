import { Suspense } from "react"

import { LoadingPageSkeleton, RoleGate } from "@/components/shared"
import { SeasonReportScreen } from "@/screens/season-report-screen"

export default function SeasonReportPage() {
  return (
    <RoleGate allowed={["operator", "approver"]}>
      <Suspense fallback={<LoadingPageSkeleton />}>
        <SeasonReportScreen />
      </Suspense>
    </RoleGate>
  )
}
