"use client"

import { useState, type FormEvent } from "react"
import { KeyRoundIcon, LoaderCircleIcon } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { LoginInput } from "@/auth"
import type { AuthLoginResult } from "@/providers/auth-provider"

type LoginFormProps = Readonly<{
  onLogin: (input: LoginInput) => Promise<AuthLoginResult>
  disabled?: boolean
}>

export function LoginForm({ onLogin, disabled = false }: LoginFormProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setErrorMessage(null)
    const result = await onLogin({ username, password })
    if (!result.ok) {
      setPassword("")
      setErrorMessage(result.message)
    }
    setSubmitting(false)
  }

  const busy = disabled || submitting

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="login-username">아이디</Label>
        <Input
          autoComplete="username"
          autoFocus
          disabled={busy}
          id="login-username"
          onChange={(event) => setUsername(event.currentTarget.value)}
          placeholder="아이디 입력"
          required
          value={username}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="login-password">비밀번호</Label>
        <Input
          autoComplete="current-password"
          disabled={busy}
          id="login-password"
          onChange={(event) => setPassword(event.currentTarget.value)}
          placeholder="비밀번호 입력"
          required
          type="password"
          value={password}
        />
      </div>
      {errorMessage ? (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}
      <Button className="w-full" disabled={busy} type="submit">
        {submitting ? (
          <>
            <LoaderCircleIcon aria-hidden="true" className="animate-spin" />
            로그인 중
          </>
        ) : (
          <>
            <KeyRoundIcon aria-hidden="true" />
            로그인
          </>
        )}
      </Button>
    </form>
  )
}
