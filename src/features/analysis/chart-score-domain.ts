/** Presentation-only shared axis. Original allowed scores can exceed 100. */
export function scoreAxisMaximum(values: readonly number[]): number {
  return Math.ceil(values.reduce((maximum, value) => Number.isFinite(value) ? Math.max(maximum, value) : maximum, 100) / 20) * 20
}

export function scoreAxisTicks(maximum: number): readonly number[] {
  return Array.from({ length: 6 }, (_, index) => maximum * index / 5)
}
