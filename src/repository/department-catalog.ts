import type { DepartmentCatalogEntry, EvaluationSnapshot } from "@/domain"

export function mergeDepartmentCatalog(
  snapshot: EvaluationSnapshot,
  additions: readonly DepartmentCatalogEntry[] = [],
): readonly DepartmentCatalogEntry[] {
  const candidates = [
    ...(snapshot.departmentCatalog ?? []),
    ...snapshot.engineers.map((engineer) => ({ team: engineer.team, name: engineer.department })),
    ...snapshot.evaluators.map((evaluator) => ({ team: evaluator.team, name: evaluator.department })),
    ...additions,
  ]
  const seen = new Set<string>()

  return candidates.flatMap((candidate) => {
    const name = candidate.name.trim()
    const key = `${candidate.team}:${name.toLocaleLowerCase("ko-KR")}`
    if (name === "" || seen.has(key)) return []
    seen.add(key)
    return [{ team: candidate.team, name }]
  })
}
