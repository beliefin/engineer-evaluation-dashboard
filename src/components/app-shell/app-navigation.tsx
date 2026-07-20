"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { SheetClose } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

import type { AppShellRole } from "./types"

interface NavItem {
  readonly href: string
  readonly label: string
  readonly description: string
  readonly roles: readonly AppShellRole[]
  readonly evaluatorInsights?: boolean
}

const NAV_ITEMS: readonly NavItem[] = [
  {
    href: "/my",
    label: "내 평가",
    description: "본인 점수와 실적 입력",
    roles: ["engineer"],
  },
  {
    href: "/dashboard",
    label: "전체 현황",
    description: "완료율과 순위",
    roles: ["operator", "approver"],
    evaluatorInsights: true,
  },
  {
    href: "/today",
    label: "오늘의 평가",
    description: "날짜별 평가 대상 바로가기",
    roles: ["evaluator"],
  },
  {
    href: "/evaluations",
    label: "평가하기",
    description: "배정 평가 입력",
    roles: ["evaluator"],
  },
  {
    href: "/evaluations",
    label: "평가 입력",
    description: "평가자별 점수 대리 입력",
    roles: ["operator"],
  },
  {
    href: "/pending",
    label: "미평가 현황",
    description: "누락 평가와 점수 확인",
    roles: ["operator", "approver"],
  },
  {
    href: "/calendar",
    label: "평가 일정",
    description: "발표일과 평가일 관리",
    roles: ["operator", "evaluator", "approver"],
  },
  {
    href: "/analysis",
    label: "분석",
    description: "분야와 팀 비교",
    roles: ["operator", "approver"],
    evaluatorInsights: true,
  },
  {
    href: "/reports/season",
    label: "운영 보고서",
    description: "시즌 결과 문서 출력",
    roles: ["operator", "approver"],
  },
  {
    href: "/operations",
    label: "운영 설정",
    description: "점수와 가중치 관리",
    roles: ["operator"],
  },
  {
    href: "/accounts",
    label: "계정 관리",
    description: "로그인과 역할 권한 관리",
    roles: ["operator"],
  },
  {
    href: "/maintenance",
    label: "백업 및 이력",
    description: "상태 복구와 변경 추적",
    roles: ["operator"],
  },
]

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

interface AppNavigationProps {
  readonly role: AppShellRole
  readonly canViewInsights?: boolean
  readonly closeOnNavigate?: boolean
}

export function AppNavigation({
  role,
  canViewInsights = false,
  closeOnNavigate = false,
}: AppNavigationProps) {
  const pathname = usePathname()
  const visibleItems = NAV_ITEMS.filter((item) =>
    item.roles.includes(role) ||
    (role === "evaluator" && canViewInsights && item.evaluatorInsights === true))

  return (
    <nav aria-label="주요 메뉴" className="flex flex-col border-t border-sidebar-border/80">
      {visibleItems.map((item, index) => {
        const active = isActivePath(pathname, item.href)
        const sequence = String(index + 1).padStart(2, "0")
        const link = (
          <Link
            aria-current={active ? "page" : undefined}
            className={cn(
              "group grid min-h-12 grid-cols-[1.75rem_minmax(0,1fr)_0.5rem] items-center gap-2 border-b border-sidebar-border/80 px-2 py-2 text-sm transition-colors",
              active
                ? "font-semibold text-primary"
                : "text-sidebar-foreground hover:bg-card/70 hover:text-foreground"
            )}
            href={item.href}
          >
            <span
              aria-hidden
              className={cn(
                "numeric text-[10px] font-semibold tracking-[0.12em]",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              {sequence}
            </span>
            <span className="min-w-0">
              <span className="block leading-5">{item.label}</span>
              <span className="block truncate text-xs font-normal text-muted-foreground">
                {item.description}
              </span>
            </span>
            <span
              aria-hidden
              className={cn(
                "size-1.5 justify-self-end bg-transparent",
                active && "bg-primary"
              )}
            />
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
