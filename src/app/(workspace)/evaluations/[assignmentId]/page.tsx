import { RoleGate } from "@/components/shared"
import { createSeedSnapshot } from "@/data/seed"
import { EvaluationFormScreen } from "@/screens/evaluation-form-screen"

export function generateStaticParams() {
  return createSeedSnapshot().assignments.map((assignment) => ({ assignmentId: assignment.id }))
}

export default async function EvaluationPage({
  params,
}: Readonly<{ params: Promise<{ assignmentId: string }> }>) {
  const { assignmentId } = await params
  return (
    <RoleGate allowed={["operator", "evaluator"]}>
      <EvaluationFormScreen assignmentId={assignmentId} />
    </RoleGate>
  )
}
