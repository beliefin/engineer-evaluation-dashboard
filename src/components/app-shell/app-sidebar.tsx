import Link from "next/link"

import { Separator } from "@/components/ui/separator"
import { isSupabaseConfigured } from "@/backend/supabase-client"

import { AppNavigation } from "./app-navigation"
import {
  APP_SHELL_HOME_PATHS,
  APP_SHELL_ROLE_LABELS,
  type AppShellRole,
} from "./types"

interface BrandProps {
  readonly compact?: boolean
  readonly href: string
  readonly onNavigate?: () => void
}

export function AppBrand({ compact = false, href, onNavigate }: BrandProps) {
  const navigationProps = onNavigate === undefined ? {} : { onClick: onNavigate }

  return (
    <Link
      aria-label="엔지니어 역량평가 메인으로 이동"
      className="-mx-1 flex min-w-0 items-center gap-2.5 px-1 py-1 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
      href={href}
      {...navigationProps}
    >
      <span className="numeric flex size-8 shrink-0 items-center justify-center border border-primary text-[10px] font-bold tracking-[-0.06em] text-primary">
        EE
      </span>
      {!compact && (
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-foreground">
            엔지니어 역량평가
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            Evaluation Console
          </span>
        </span>
      )}
    </Link>
  )
}

interface AppSidebarProps {
  readonly role: AppShellRole
  readonly actorLabel?: string | undefined
}

export function AppSidebar({ role, actorLabel }: AppSidebarProps) {
  const currentActor = actorLabel ?? `데모 ${APP_SHELL_ROLE_LABELS[role]}`
  const authLabel = isSupabaseConfigured() ? "Supabase 인증" : "샘플 인증"

  return (
    <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar print:hidden lg:flex">
      <div className="flex h-[52px] shrink-0 items-center px-4">
        <AppBrand href={APP_SHELL_HOME_PATHS[role]} />
      </div>
      <Separator />
      <div className="flex-1 overflow-y-auto px-3 py-5 scrollbar-thin">
        <p className="mb-3 px-2 text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
          평가 운영
        </p>
        <AppNavigation role={role} />
      </div>
      <div className="border-t border-sidebar-border bg-card/40 px-4 py-4">
        <p className="truncate text-xs font-semibold text-foreground">
          {currentActor}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {APP_SHELL_ROLE_LABELS[role]} · {authLabel}
        </p>
      </div>
    </aside>
  )
}
