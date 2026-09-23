"use client"

import { useState } from "react"
import { Download } from "lucide-react"

import { Button } from "@/components/ui/button"

type Props = Readonly<{
  label: string
  pendingLabel: string
  onDownload: () => Promise<void>
}>

export function RankingExportButton({ label, pendingLabel, onDownload }: Props) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDownload() {
    setPending(true)
    setError(null)
    try {
      await onDownload()
    } catch {
      setError("Excel 파일을 만들지 못했습니다. 잠시 후 다시 시도해 주세요.")
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <Button disabled={pending} onClick={handleDownload} size="sm" type="button" variant="outline">
        <Download aria-hidden="true" />
        {pending ? pendingLabel : label}
      </Button>
      {error === null ? null : (
        <p className="max-w-64 text-right text-xs text-destructive" role="alert">{error}</p>
      )}
    </div>
  )
}
