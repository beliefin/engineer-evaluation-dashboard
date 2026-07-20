import type { ReactNode } from "react"

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface DashboardPanelProps {
  readonly title: string
  readonly description: string
  readonly action?: ReactNode
  readonly children: ReactNode
  readonly className?: string
  readonly contentClassName?: string
}

export function DashboardPanel({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
}: DashboardPanelProps) {
  return (
    <Card
      className={cn(
        "gap-0 rounded-md py-0",
        className
      )}
    >
      <CardHeader className="border-b border-border-subtle px-5 py-4">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        <CardDescription className="max-w-2xl text-xs leading-5">
          {description}
        </CardDescription>
        {action ? <CardAction>{action}</CardAction> : null}
      </CardHeader>
      <CardContent className={cn("px-5 py-4", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  )
}
