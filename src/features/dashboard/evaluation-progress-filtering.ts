import type {
  DashboardEvaluationStatus,
  EngineerEvaluationProgressRow,
} from "./dashboard-view-models"

export type ProgressTaskFilter =
  | "all"
  | DashboardEvaluationStatus
  | "not_applicable"
  | "scored"

export type ProgressSort =
  | "default"
  | "name_asc"
  | "name_desc"
  | "overall_desc"
  | "overall_asc"
  | `task:${string}:status`
  | `task:${string}:score_desc`
  | `task:${string}:score_asc`

export type ProgressFilters = Readonly<{
  query: string
  overallStatus: "all" | DashboardEvaluationStatus
  taskFilters: Readonly<Record<string, ProgressTaskFilter>>
}>

const STATUS_ORDER: Record<DashboardEvaluationStatus, number> = {
  complete: 3,
  in_progress: 2,
  not_started: 1,
}

function byName(
  left: EngineerEvaluationProgressRow,
  right: EngineerEvaluationProgressRow,
) {
  return left.name.localeCompare(right.name, "ko")
}

function compareNullableScores(
  left: number | null | undefined,
  right: number | null | undefined,
  direction: "asc" | "desc",
) {
  if (left === null || left === undefined) return right === null || right === undefined ? 0 : 1
  if (right === null || right === undefined) return -1
  return direction === "asc" ? left - right : right - left
}

function matchesTaskFilter(
  row: EngineerEvaluationProgressRow,
  taskId: string,
  filter: ProgressTaskFilter,
) {
  if (filter === "all") return true
  const task = row.tasks.find((entry) => entry.taskId === taskId)
  if (filter === "not_applicable") return task === undefined
  if (filter === "scored") return task?.score !== null && task?.score !== undefined
  return task?.status === filter
}

export function filterAndSortProgressRows(
  rows: readonly EngineerEvaluationProgressRow[],
  filters: ProgressFilters,
  sort: ProgressSort,
) {
  const query = filters.query.trim().toLocaleLowerCase("ko")
  const filtered = rows.filter((row) => {
    const matchesQuery = query.length === 0 ||
      row.name.toLocaleLowerCase("ko").includes(query) ||
      row.employeeCode.toLocaleLowerCase("ko").includes(query)
    const matchesOverall = filters.overallStatus === "all" || row.status === filters.overallStatus
    const matchesTasks = Object.entries(filters.taskFilters).every(([taskId, filter]) =>
      matchesTaskFilter(row, taskId, filter))
    return matchesQuery && matchesOverall && matchesTasks
  })

  if (sort === "default") return filtered
  return [...filtered].sort((left, right) => {
    if (sort === "name_asc") return byName(left, right)
    if (sort === "name_desc") return byName(right, left)
    if (sort === "overall_desc" || sort === "overall_asc") {
      const difference = left.completedTaskCount - right.completedTaskCount
      return (sort === "overall_asc" ? difference : -difference) || byName(left, right)
    }

    const [, taskId, mode] = sort.split(":")
    const leftTask = left.tasks.find((task) => task.taskId === taskId)
    const rightTask = right.tasks.find((task) => task.taskId === taskId)
    if (mode === "status") {
      const difference = (STATUS_ORDER[rightTask?.status ?? "not_started"] ?? 0) -
        (STATUS_ORDER[leftTask?.status ?? "not_started"] ?? 0)
      return difference || compareNullableScores(leftTask?.score, rightTask?.score, "desc") || byName(left, right)
    }
    const direction = mode === "score_asc" ? "asc" : "desc"
    return compareNullableScores(leftTask?.score, rightTask?.score, direction) || byName(left, right)
  })
}
