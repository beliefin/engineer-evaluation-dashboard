import "./operations-signal.css"

import type { ReactNode } from "react"

interface OperationPanelProps {
  readonly title: string
  readonly description: ReactNode
  readonly children: ReactNode
  readonly aside?: ReactNode
}

export function OperationPanel({
  title,
  description,
  children,
  aside,
}: OperationPanelProps) {
  return (
    <section className="signal-operation-panel overflow-hidden rounded-md border bg-card">
      <div className="signal-operation-panel-heading flex flex-col gap-3 border-b border-border-subtle px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
        <div className="signal-operation-heading-copy min-w-0">
          <h2 className="text-base font-semibold tracking-[-0.01em]">{title}</h2>
          <p className="mt-1 max-w-3xl break-keep text-pretty text-sm text-muted-foreground">
            {description}
          </p>
        </div>
        {aside}
      </div>
      <div className="signal-operation-panel-content p-4 sm:p-5">{children}</div>
    </section>
  )
}
