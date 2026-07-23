import type { EvaluationSnapshot } from "@/domain"

export type ScheduledEvaluationView = Readonly<{
  eventId: string
  assignmentId: string
  parallelAssignmentId: string | null
  presentationGroupId: string | null
  engineerId: string
  engineerName: string
  team: string
  taskId: string
  taskName: string
  title: string
  date: string
  startTime: string | null
  note: string | null
  status: "not_started" | "in_progress" | "submitted"
  completedItems: number
  totalItems: number
}>

export function selectScheduledEvaluations(
  snapshot: EvaluationSnapshot,
  cycleId: string,
  evaluatorId: string,
  date: string,
): ReadonlyArray<ScheduledEvaluationView> {
  const assignmentByKey = new Map(
    snapshot.assignments
      .filter((assignment) => assignment.cycleId === cycleId && assignment.evaluatorId === evaluatorId)
      .map((assignment) => [
        `${assignment.engineerId}:${assignment.taskId}`,
        assignment,
      ]),
  )

  const evaluations: readonly ScheduledEvaluationView[] = snapshot.scheduleEvents
    .filter((event) => event.cycleId === cycleId && event.date === date && event.taskId !== null)
    .flatMap((event) => {
      if (event.taskId === null) return []
      const assignment = assignmentByKey.get(`${event.engineerId}:${event.taskId}`)
      const engineer = snapshot.engineers.find((entry) => entry.id === event.engineerId)
      const task = snapshot.tasks.find((entry) => entry.id === event.taskId)
      if (assignment === undefined || engineer === undefined || task === undefined) return []
      const sheet = snapshot.scoreSheets.find((entry) => entry.assignmentId === assignment.id)
      const completedItems = sheet?.scores.filter((entry) => entry.score !== null).length ?? 0
      const hasResponse = completedItems > 0 || sheet?.passResult !== null && sheet?.passResult !== undefined
      const view: ScheduledEvaluationView = {
        eventId: event.id,
        assignmentId: assignment.id,
        parallelAssignmentId: null,
        presentationGroupId: event.presentationGroupId ?? null,
        engineerId: engineer.id,
        engineerName: engineer.displayName,
        team: engineer.team,
        taskId: task.id,
        taskName: task.name,
        title: event.title,
        date: event.date,
        startTime: event.startTime,
        note: event.note,
        status: sheet?.status === "submitted" ? "submitted" : hasResponse ? "in_progress" : "not_started",
        completedItems,
        totalItems: task.items.length,
      }
      return [view]
    })

  const seenGroups = new Set<string>()
  return evaluations
    .flatMap((evaluation) => {
      const groupId = evaluation.presentationGroupId
      if (groupId === null) return [evaluation]
      if (seenGroups.has(groupId)) return []
      seenGroups.add(groupId)
      const group = evaluations.filter((candidate) => candidate.presentationGroupId === groupId)
      const first = group[0]
      const second = group[1]
      if (first === undefined) return []
      if (second === undefined) return [first]
      const status = group.every((candidate) => candidate.status === "submitted")
        ? "submitted"
        : group.some((candidate) => candidate.status !== "not_started")
          ? "in_progress"
          : "not_started"
      return [{
        ...first,
        engineerName: `${first.engineerName} · ${second.engineerName}`,
        parallelAssignmentId: second.assignmentId,
        status,
        completedItems: group.reduce((total, candidate) => total + candidate.completedItems, 0),
        totalItems: group.reduce((total, candidate) => total + candidate.totalItems, 0),
      } satisfies ScheduledEvaluationView]
    })
    .sort((left, right) =>
      (left.startTime ?? "99:99").localeCompare(right.startTime ?? "99:99") ||
      left.engineerName.localeCompare(right.engineerName, "ko"),
    )
}
