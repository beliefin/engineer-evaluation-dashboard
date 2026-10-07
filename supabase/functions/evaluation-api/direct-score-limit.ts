export function directScoreLimit(task: { name: string; method: string }): number {
  return task.method === "operator_score" && task.name.replaceAll(/\s/g, "").includes("고등급제안") ? 120 : 100
}
