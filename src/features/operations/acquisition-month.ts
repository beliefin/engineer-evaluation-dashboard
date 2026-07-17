export function displayAcquisitionMonth(value: string | null): string {
  return value === null ? "미입력" : value.slice(0, 7)
}

export function acquisitionMonthInputValue(value: string | null): string {
  return value?.slice(0, 7) ?? ""
}

export function acquisitionMonthToStoredDate(value: string): string | null {
  return value === "" ? null : `${value}-01`
}
