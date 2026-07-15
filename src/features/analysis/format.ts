const scoreFormatter = new Intl.NumberFormat("ko-KR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

const countFormatter = new Intl.NumberFormat("ko-KR")

export function formatScore(value: number): string {
  return `${formatDecimal(value)}점`
}

export function formatDecimal(value: number): string {
  return scoreFormatter.format(value)
}

export function formatCount(value: number, unit: string): string {
  return `${countFormatter.format(value)}${unit}`
}
