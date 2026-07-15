import { DatabaseIcon, FlaskConicalIcon } from "lucide-react"

import { isSupabaseConfigured } from "@/backend/supabase-client"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface SampleDataBadgeProps {
  readonly className?: string
}

export function SampleDataBadge({ className }: SampleDataBadgeProps) {
  const remoteMode = isSupabaseConfigured()
  return (
    <Badge
      aria-label={remoteMode ? "Supabase 운영 데이터에 연결됨" : "현재 화면은 샘플 데이터로 구성됨"}
      className={cn(
        remoteMode
          ? "h-6 rounded-md border-success/30 bg-success-soft px-2 text-success"
          : "h-6 rounded-md border-warning/30 bg-warning-soft px-2 text-warning",
        className
      )}
      variant="outline"
    >
      {remoteMode
        ? <DatabaseIcon aria-hidden="true" data-icon="inline-start" />
        : <FlaskConicalIcon aria-hidden="true" data-icon="inline-start" />}
      {remoteMode ? "운영 데이터" : "샘플 데이터"}
    </Badge>
  )
}
