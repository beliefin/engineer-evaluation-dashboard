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
