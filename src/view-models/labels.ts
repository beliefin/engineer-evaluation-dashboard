const timestampFormatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
})

export function formatTimestamp(timestamp: string | null): string | null {
  if (timestamp === null) return null

  const date = new Date(timestamp)
  return Number.isNaN(date.getTime()) ? timestamp : timestampFormatter.format(date)
}

/**
 * Keeps the legacy task identifier and persisted task data intact while using
 * the approved AX terminology wherever the task is presented to a person.
 */
export function displayEvaluationTaskName(name: string): string {
  return name.replace("DX 툴 활용", "AX 전환")
}
