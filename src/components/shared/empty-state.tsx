import type { ComponentType, ReactNode } from "react"
import { Inbox } from "lucide-react"

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { cn } from "@/lib/utils"

type EmptyStateProps = {
  title: string
  description: string
  icon?: ComponentType<{ className?: string; "aria-hidden"?: boolean }> | undefined
  action?: ReactNode | undefined
  className?: string | undefined
}

function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  className,
}: EmptyStateProps) {
  return (
    <Empty className={cn("min-h-64 border border-dashed border-border bg-card", className)}>
      <EmptyHeader>
        <EmptyMedia variant="icon" className="size-10 bg-muted text-muted-foreground">
          <Icon className="size-5" aria-hidden />
        </EmptyMedia>
        <EmptyTitle className="text-base font-semibold">{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {action ? <EmptyContent>{action}</EmptyContent> : null}
    </Empty>
  )
}

export { EmptyState }
export type { EmptyStateProps }
