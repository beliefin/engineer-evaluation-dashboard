import type { ReactNode } from "react"

import { ConnectedAppShell } from "@/components/app-shell"

export default function WorkspaceLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <ConnectedAppShell>{children}</ConnectedAppShell>
}
