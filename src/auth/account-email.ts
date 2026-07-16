export function accountEmailForUsername(username: string, accountDomain: string): string {
  if (/^[a-z0-9._-]+$/.test(username)) return `${username}@${accountDomain}`

  const encoded = Array.from(
    new TextEncoder().encode(username),
    (byte) => byte.toString(16).padStart(2, "0"),
  ).join("-")
  return `u-${encoded}@${accountDomain}`
}
