"use client"

import { useEffect } from "react"
import { ShieldCheckIcon } from "lucide-react"
import { useRouter } from "next/navigation"

import { DEMO_LOGIN_ACCOUNTS, DEMO_PASSWORD } from "@/auth"
import { isSupabaseConfigured } from "@/backend/supabase-client"
import { AppBrand } from "@/components/app-shell/app-sidebar"
import { APP_SHELL_HOME_PATHS } from "@/components/app-shell/types"
import { Badge } from "@/components/ui/badge"
import { LoginForm } from "@/features/auth"
import { useAuth } from "@/providers"

export function LoginScreen() {
  const router = useRouter()
  const { session, loadState, pending, login } = useAuth()
  const remoteMode = isSupabaseConfigured()

  useEffect(() => {
    if (loadState === "ready" && session !== null) router.replace(APP_SHELL_HOME_PATHS[session.role])
  }, [loadState, router, session])

  async function handleLogin(input: Parameters<typeof login>[0]) {
    const result = await login(input)
    if (result.ok) router.replace(APP_SHELL_HOME_PATHS[result.role])
    return result
  }

  return (
    <main className="flex min-h-dvh items-center bg-background px-4 py-8 sm:px-5 lg:px-6">
      <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-lg border border-border bg-card">
        <div className="border-b border-border px-5 py-4 sm:px-6">
          <AppBrand href="/" />
        </div>
        <div className="grid md:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
          <section className="px-5 py-8 sm:px-8 sm:py-10" aria-labelledby="login-heading">
            <Badge className="mb-4" variant="secondary">
              {remoteMode ? "운영 인증" : "샘플 인증"}
            </Badge>
            <h1 className="text-[26px] leading-tight font-bold tracking-[-0.02em]" id="login-heading">
              역량평가 시스템 로그인
            </h1>
            <p className="mt-2 mb-7 text-sm leading-6 text-muted-foreground">
              발급받은 아이디와 비밀번호로 로그인하면 권한별 화면으로 이동합니다. 복합 권한 계정은 로그인 후 사용 모드를 전환할 수 있습니다.
            </p>
            <LoginForm disabled={loadState !== "ready" || pending} onLogin={handleLogin} />
          </section>

          <aside className="border-t border-border bg-muted/40 px-5 py-7 sm:px-8 md:border-t-0 md:border-l">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-accent text-primary">
                <ShieldCheckIcon aria-hidden="true" className="size-4" />
              </span>
              <div>
                <h2 className="text-base font-semibold">
                  {remoteMode ? "권한 기반 보안" : "샘플 계정"}
                </h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {remoteMode
                    ? "로그인 계정에 연결된 역할과 대상 범위만 조회할 수 있습니다."
                    : "역할별 화면을 확인할 수 있는 초기 계정입니다."}
                </p>
              </div>
            </div>
            {remoteMode ? (
              <ul className="mt-5 space-y-3 rounded-md border border-border bg-card px-4 py-4 text-sm leading-6">
                <li>운영자 · 전체 설정과 계정 관리</li>
                <li>평가자 · 본인에게 배정된 평가지만 입력</li>
                <li>승인자 · 집계 결과와 순위 읽기 전용</li>
                <li>엔지니어 · 본인 결과와 증빙 자료 관리</li>
              </ul>
            ) : (
              <>
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
              </>
            )}
            <p className="mt-5 border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
              {remoteMode
                ? "인증 세션과 평가 데이터는 Supabase에 저장되며 서버에서 역할별 접근 범위를 검증합니다."
                : "이 버전은 브라우저 LocalStorage 기반 샘플 인증입니다."}
            </p>
          </aside>
        </div>
      </div>
    </main>
  )
}
