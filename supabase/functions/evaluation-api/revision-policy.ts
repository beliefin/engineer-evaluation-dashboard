export function expectedRevisionForRequest(
  request: Readonly<{ operation: string; baseRevision: number }>,
  currentRevision: number,
): number {
  return request.operation === "operator_commit" ? request.baseRevision : currentRevision
}
