"use client"

import { useEffect } from "react"
import { ShieldCheckIcon } from "lucide-react"
import { useRouter } from "next/navigation"

import { DEMO_LOGIN_ACCOUNTS, DEMO_PASSWORD } from "@/auth"
import { AppBrand } from "@/components/app-shell/app-sidebar"
import { Badge } from "@/components/ui/badge"
import { LoginForm } from "@/features/auth"
import { useAuth } from "@/providers"
import type { Role } from "@/domain"

const ROLE_HOME: Readonly<Record<Role, string>> = {
  operator: "/dashboard",
  evaluator: "/evaluations",
  approver: "/dashboard",
  engineer: "/my",
}

export function LoginScreen() {
  const router = useRouter()
  const { session, loadState, pending, login } = useAuth()

  useEffect(() => {
    if (loadState === "ready" && session !== null) router.replace(ROLE_HOME[session.role])
  }, [loadState, router, session])

  async function handleLogin(input: Parameters<typeof login>[0]) {
    const result = await login(input)
    if (result.ok) router.replace(ROLE_HOME[result.role])
    return result
  }

  return (
    <main className="flex min-h-dvh items-center bg-background px-4 py-8 sm:px-5 lg:px-6">
      <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-lg border border-border bg-card">
        <div className="border-b border-border px-5 py-4 sm:px-6">
          <AppBrand />
        </div>
        <div className="grid md:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
          <section className="px-5 py-8 sm:px-8 sm:py-10" aria-labelledby="login-heading">
            <Badge className="mb-4" variant="secondary">샘플 인증</Badge>
            <h1 className="text-[26px] leading-tight font-bold tracking-[-0.02em]" id="login-heading">
              역량평가 시스템 로그인
            </h1>
            <p className="mt-2 mb-7 text-sm leading-6 text-muted-foreground">
              발급받은 아이디와 비밀번호로 로그인하면 권한별 화면으로 이동합니다.
            </p>
            <LoginForm disabled={loadState !== "ready" || pending} onLogin={handleLogin} />
          </section>

          <aside className="border-t border-border bg-muted/40 px-5 py-7 sm:px-8 md:border-t-0 md:border-l">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-accent text-primary">
                <ShieldCheckIcon aria-hidden="true" className="size-4" />
              </span>
              <div>
                <h2 className="text-base font-semibold">샘플 계정</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  역할별 화면을 확인할 수 있는 초기 계정입니다.
                </p>
              </div>
            </div>
            <dl className="mt-5 divide-y divide-border rounded-md border border-border bg-card">
              {DEMO_LOGIN_ACCOUNTS.map((account) => (
                <div className="grid grid-cols-[72px_1fr] gap-3 px-3 py-3 text-sm" key={account.username}>
                  <dt className="font-medium text-muted-foreground">{account.roleLabel}</dt>
                  <dd>
                    <span className="block font-semibold">{account.username}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{account.displayName}</span>
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-sm">
              공통 비밀번호 <code className="rounded bg-muted px-1.5 py-1 font-mono text-xs">{DEMO_PASSWORD}</code>
            </p>
            <p className="mt-5 border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
              이 버전은 브라우저 LocalStorage 기반 샘플 인증입니다. 실제 운영 환경에서는 서버 세션, SSO, DB 권한 검증으로 교체해야 합니다.
            </p>
          </aside>
        </div>
      </div>
    </main>
  )
}
