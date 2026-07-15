import { RoleGate } from "@/components/shared"
import { createSeedSnapshot } from "@/data/seed"
import { EngineerDetailScreen } from "@/screens/engineer-detail-screen"

export function generateStaticParams() {
  return createSeedSnapshot().engineers.map((engineer) => ({ engineerId: engineer.id }))
}

export default async function EngineerPage({
  params,
}: Readonly<{ params: Promise<{ engineerId: string }> }>) {
  const { engineerId } = await params
  return (
    <RoleGate allowed={["operator", "approver"]}>
      <EngineerDetailScreen engineerId={engineerId} />
    </RoleGate>
  )
}
