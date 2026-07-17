"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3Icon,
  CalendarDaysIcon,
  ClipboardCheckIcon,
  DatabaseBackupIcon,
  GaugeIcon,
  FileTextIcon,
  ListChecksIcon,
  Settings2Icon,
  UsersRoundIcon,
  UserRoundCheckIcon,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { SheetClose } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

import type { AppShellRole } from "./types"

interface NavItem {
  readonly href: string
  readonly label: string
  readonly description: string
  readonly Icon: LucideIcon
  readonly roles: readonly AppShellRole[]
}

const NAV_ITEMS: readonly NavItem[] = [
  {
    href: "/my",
    label: "내 평가",
    description: "본인 점수와 실적 입력",
    Icon: UserRoundCheckIcon,
    roles: ["engineer"],
  },
  {
    href: "/dashboard",
    label: "전체 현황",
    description: "완료율과 순위",
    Icon: GaugeIcon,
    roles: ["operator", "approver"],
  },
  {
    href: "/today",
    label: "오늘의 평가",
    description: "날짜별 평가 대상 바로가기",
    Icon: CalendarDaysIcon,
    roles: ["evaluator"],
  },
  {
    href: "/evaluations",
    label: "평가하기",
    description: "배정 평가 입력",
    Icon: ClipboardCheckIcon,
    roles: ["evaluator"],
  },
  {
    href: "/evaluations",
    label: "평가 입력",
    description: "평가자별 점수 대리 입력",
    Icon: ClipboardCheckIcon,
    roles: ["operator"],
  },
  {
    href: "/pending",
    label: "미평가 현황",
    description: "누락 평가와 점수 확인",
    Icon: ListChecksIcon,
    roles: ["operator", "approver"],
  },
  {
    href: "/calendar",
    label: "평가 일정",
    description: "발표일과 평가일 관리",
    Icon: CalendarDaysIcon,
    roles: ["operator", "evaluator", "approver"],
  },
  {
    href: "/analysis",
    label: "분석",
    description: "분야와 팀 비교",
    Icon: BarChart3Icon,
    roles: ["operator", "approver"],
  },
  {
    href: "/reports/season",
    label: "운영 보고서",
    description: "시즌 결과 문서 출력",
    Icon: FileTextIcon,
    roles: ["operator", "approver"],
  },
  {
    href: "/operations",
    label: "운영 설정",
    description: "점수와 가중치 관리",
    Icon: Settings2Icon,
    roles: ["operator"],
  },
  {
    href: "/accounts",
    label: "계정 관리",
    description: "로그인과 역할 권한 관리",
    Icon: UsersRoundIcon,
    roles: ["operator"],
  },
  {
    href: "/maintenance",
    label: "백업 및 이력",
    description: "상태 복구와 변경 추적",
    Icon: DatabaseBackupIcon,
    roles: ["operator"],
  },
]

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

interface AppNavigationProps {
  readonly role: AppShellRole
  readonly closeOnNavigate?: boolean
}

export function AppNavigation({
  role,
  closeOnNavigate = false,
}: AppNavigationProps) {
  const pathname = usePathname()
  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role))

  return (
    <nav aria-label="주요 메뉴" className="flex flex-col gap-1">
      {visibleItems.map((item) => {
        const active = isActivePath(pathname, item.href)
        const { Icon } = item
        const link = (
          <Link
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              active
                ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:bg-primary"
                : "text-sidebar-foreground hover:bg-muted hover:text-foreground"
            )}
            href={item.href}
          >
            <Icon
              aria-hidden="true"
              className={cn(
                "size-4 shrink-0",
                active ? "text-primary" : "text-muted-foreground"
              )}
            />
            <span className="min-w-0">
              <span className="block leading-5">{item.label}</span>
              <span className="block truncate text-xs font-normal text-muted-foreground">
                {item.description}
              </span>
            </span>
          </Link>
        )

        if (closeOnNavigate) {
          return (
            <SheetClose asChild key={item.href}>
              {link}
            </SheetClose>
          )
        }

        return <div key={item.href}>{link}</div>
      })}
    </nav>
  )
}
