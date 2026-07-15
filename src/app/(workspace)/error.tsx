"use client"

import { ErrorState } from "@/components/shared"
import { Button } from "@/components/ui/button"

export default function WorkspaceError({
  error,
  reset,
}: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  return (
    <div data-error-digest={error.digest}>
      <ErrorState
        action={<Button onClick={reset}>다시 시도</Button>}
        description="화면 상태를 복구하지 못했습니다. 다시 시도하거나 샘플 데이터를 초기화해 주세요."
      />
    </div>
  )
}
