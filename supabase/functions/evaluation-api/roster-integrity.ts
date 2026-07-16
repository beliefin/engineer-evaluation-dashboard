export type LinkedRosterProfile = Readonly<{
  evaluator_id: string | null
  engineer_id: string | null
}>

type RosterSnapshot = Readonly<{
  evaluators: ReadonlyArray<Readonly<{ id: string }>>
  engineers: ReadonlyArray<Readonly<{ id: string }>>
}>

export function findMissingLinkedRosterIds(
  snapshot: RosterSnapshot,
  profiles: ReadonlyArray<LinkedRosterProfile>,
): Readonly<{ evaluatorIds: readonly string[]; engineerIds: readonly string[] }> {
  const evaluatorIds = new Set(snapshot.evaluators.map((evaluator) => evaluator.id))
  const engineerIds = new Set(snapshot.engineers.map((engineer) => engineer.id))

  return {
    evaluatorIds: [...new Set(profiles.flatMap((profile) =>
      profile.evaluator_id !== null && !evaluatorIds.has(profile.evaluator_id)
        ? [profile.evaluator_id]
        : []))],
    engineerIds: [...new Set(profiles.flatMap((profile) =>
      profile.engineer_id !== null && !engineerIds.has(profile.engineer_id)
        ? [profile.engineer_id]
        : []))],
  }
}
