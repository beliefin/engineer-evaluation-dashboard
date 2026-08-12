import { Suspense } from "react"

import { LoadingPageSkeleton } from "@/components/shared"
import { SeasonOverviewScreen } from "@/screens/season-overview-screen"

export default function SeasonOverviewPage() {
  return (
    <Suspense fallback={<LoadingPageSkeleton showTable={false} />}>
      <SeasonOverviewScreen />
    </Suspense>
  )
}
