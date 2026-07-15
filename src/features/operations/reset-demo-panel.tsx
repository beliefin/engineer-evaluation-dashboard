"use client"

import { RotateCcw, TriangleAlert } from "lucide-react"
import { useState } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { OperationPanel } from "./operation-panel"

interface ResetDemoPanelProps {
  readonly disabled: boolean
  readonly onReset: () => void
}

export function ResetDemoPanel({ disabled, onReset }: ResetDemoPanelProps) {
  const [open, setOpen] = useState(false)

  function handleReset() {
    onReset()
    setOpen(false)
  }

  return (
    <OperationPanel
      description="브라우저에 저장된 모든 변경을 지우고 최초 고정 샘플 상태로 되돌립니다."
      title="샘플 데이터 초기화"
    >
      <Alert className="border-destructive/30 bg-danger-soft text-destructive">
        <TriangleAlert />
        <AlertTitle>현재 브라우저의 데모 변경 내용이 모두 삭제됩니다.</AlertTitle>
        <AlertDescription>
          입력한 평가 점수, 직접점수, 가중치, 분야 설정과 재오픈 기록은 복구할
          수 없습니다.
        </AlertDescription>
      </Alert>

      <div className="mt-5 flex justify-end">
        <Dialog onOpenChange={setOpen} open={open}>
          <DialogTrigger asChild>
            <Button disabled={disabled} variant="destructive">
              <RotateCcw />
              샘플 데이터 초기화
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>샘플 데이터를 초기화할까요?</DialogTitle>
              <DialogDescription>
                이 브라우저에서 변경한 평가 데이터가 즉시 최초 샘플로
                돌아갑니다.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  취소
                </Button>
              </DialogClose>
              <Button onClick={handleReset} type="button" variant="destructive">
                초기화 실행
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </OperationPanel>
  )
}
