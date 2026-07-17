"use client"

import { useState, type FormEvent } from "react"

import { passwordSchema } from "@/auth"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { AuthActionResult } from "@/providers/auth-provider"

type InitialPasswordChangeDialogProps = Readonly<{
  open: boolean
  pending: boolean
  onPostpone: () => void
  onChangePassword: (input: Readonly<{ password: string }>) => Promise<AuthActionResult>
}>

export function InitialPasswordChangeDialog({
  open,
  pending,
  onPostpone,
  onChangePassword,
}: InitialPasswordChangeDialogProps) {
  const [password, setPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsed = passwordSchema.safeParse(password)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "비밀번호를 확인해 주세요.")
      return
    }
    if (password !== confirmation) {
      setError("비밀번호 확인이 일치하지 않습니다.")
      return
    }
    const result = await onChangePassword({ password })
    if (!result.ok) setError(result.message)
  }

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <form noValidate onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>초기 비밀번호를 변경해 주세요</DialogTitle>
            <DialogDescription>
              현재 비밀번호는 최초 발급 비밀번호입니다. 숫자 또는 문자를 사용해 4자 이상으로 변경할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-5">
            <div className="space-y-2">
              <Label htmlFor="initial-new-password">새 비밀번호</Label>
              <Input autoComplete="new-password" disabled={pending} id="initial-new-password" onChange={(event) => { setPassword(event.currentTarget.value); setError(null) }} type="password" value={password} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="initial-new-password-confirmation">새 비밀번호 확인</Label>
              <Input autoComplete="new-password" disabled={pending} id="initial-new-password-confirmation" onChange={(event) => { setConfirmation(event.currentTarget.value); setError(null) }} type="password" value={confirmation} />
            </div>
            {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
          </div>
          <DialogFooter>
            <Button disabled={pending} onClick={onPostpone} type="button" variant="outline">나중에 변경</Button>
            <Button disabled={pending} type="submit">비밀번호 변경</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
