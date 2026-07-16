import { Suspense } from "react"

import { LoadingPageSkeleton, RoleGate } from "@/components/shared"
import { CalendarScreen } from "@/screens/calendar-screen"

export default function CalendarPage() {
  return (
    <RoleGate allowed={["operator", "evaluator", "approver"]}>
      <Suspense fallback={<LoadingPageSkeleton />}>
        <CalendarScreen />
      </Suspense>
    </RoleGate>
  )
}
