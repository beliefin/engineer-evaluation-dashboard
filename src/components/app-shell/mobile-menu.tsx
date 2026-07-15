"use client"

import { useState } from "react"
import { LogOutIcon, MenuIcon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { isSupabaseConfigured } from "@/backend/supabase-client"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

import { AppNavigation } from "./app-navigation"
import { AppBrand } from "./app-sidebar"
import { ShellControls } from "./shell-controls"
import {
  APP_SHELL_HOME_PATHS,
  APP_SHELL_ROLE_LABELS,
  type AppShellCycleOption,
  type AppShellEvaluatorOption,
  type AppShellRole,
} from "./types"

interface MobileMenuProps {
  readonly role: AppShellRole
  readonly cycles: readonly AppShellCycleOption[]
  readonly evaluatorOptions: readonly AppShellEvaluatorOption[]
  readonly activeCycleId: string
  readonly activeEvaluatorId: string
  readonly onCycleChange: (cycleId: string) => void
  readonly onEvaluatorChange: (evaluatorId: string) => void
  readonly onLogout: () => void
  readonly actorLabel?: string | undefined
}

export function MobileMenu({
  role,
  cycles,
  evaluatorOptions,
  activeCycleId,
  activeEvaluatorId,
  onCycleChange,
  onEvaluatorChange,
  onLogout,
  actorLabel,
}: MobileMenuProps) {
  const [open, setOpen] = useState(false)
  const currentActor = actorLabel ?? `데모 ${APP_SHELL_ROLE_LABELS[role]}`
  const authLabel = isSupabaseConfigured() ? "Supabase 인증" : "샘플 인증"

  return (
    <Sheet onOpenChange={setOpen} open={open}>
      <SheetTrigger asChild>
        <Button aria-label="메뉴 열기" size="icon" variant="ghost">
          <MenuIcon aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent
        className="w-[min(88vw,320px)] gap-0 p-0"
        showCloseButton={false}
        side="left"
      >
        <SheetHeader className="relative border-b border-sidebar-border px-4 py-3 text-left">
          <SheetTitle className="pr-10">
            <span className="sr-only">엔지니어 역량평가 메뉴</span>
            <AppBrand
              href={APP_SHELL_HOME_PATHS[role]}
              onNavigate={() => setOpen(false)}
            />
          </SheetTitle>
          <SheetDescription className="sr-only">
            평가 화면 이동과 평가 시즌을 변경하고 현재 계정에서 로그아웃합니다.
          </SheetDescription>
          <SheetClose asChild>
            <Button
              aria-label="메뉴 닫기"
              className="absolute top-3 right-3"
              size="icon"
              variant="ghost"
            >
              <XIcon aria-hidden="true" />
            </Button>
          </SheetClose>
        </SheetHeader>

        <div className="border-b border-sidebar-border p-4">
          <ShellControls
            activeCycleId={activeCycleId}
            activeEvaluatorId={activeEvaluatorId}
            cycles={cycles}
            evaluatorOptions={evaluatorOptions}
            idPrefix="mobile-shell"
            onCycleChange={onCycleChange}
            onEvaluatorChange={onEvaluatorChange}
            orientation="vertical"
            role={role}
          />
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-5 scrollbar-thin">
          <p className="mb-2 px-3 text-xs font-medium text-muted-foreground">
            평가 운영
          </p>
          <AppNavigation closeOnNavigate role={role} />
        </div>

        <div className="border-t border-sidebar-border px-4 py-4">
          <p className="truncate text-xs font-semibold text-foreground">
            {currentActor}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {APP_SHELL_ROLE_LABELS[role]} · {authLabel}
          </p>
          <Button
            className="mt-3 w-full justify-start"
            onClick={() => {
              setOpen(false)
              onLogout()
            }}
            size="sm"
            type="button"
            variant="outline"
          >
            <LogOutIcon aria-hidden="true" />
            로그아웃
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
