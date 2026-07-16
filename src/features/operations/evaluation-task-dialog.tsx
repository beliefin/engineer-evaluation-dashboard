"use client"

import { Plus } from "lucide-react"
import { useState, type FormEvent } from "react"

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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { EvaluationMethod } from "@/domain"

import type {
  EvaluationTaskDraft,
  EvaluationTaskViewModel,
  EvaluatorOptionViewModel,
  TaskEvaluatorDraft,
  TaskItemDraft,
} from "./types"
import { RubricItemEditor } from "./rubric-item-editor"

const METHOD_LABELS: Readonly<Record<EvaluationMethod, string>> = {
  evaluator_score: "평가자 점수형",
  evaluator_pass_fail: "평가자 P/F형",
  operator_score: "운영자 점수 입력",
  operator_pass_fail: "운영자 P/F 입력",
}

type Props = Readonly<{
  evaluators: readonly EvaluatorOptionViewModel[]
  initial?: EvaluationTaskViewModel
  disabled: boolean
  onSave: (task: EvaluationTaskDraft) => boolean
}>

function isEvaluatorMethod(method: EvaluationMethod): boolean {
  return method === "evaluator_score" || method === "evaluator_pass_fail"
}

function isEvaluationMethod(value: string): value is EvaluationMethod {
  return value === "evaluator_score"
    || value === "evaluator_pass_fail"
    || value === "operator_score"
    || value === "operator_pass_fail"
}

export function EvaluationTaskDialog({ evaluators, initial, disabled, onSave }: Props) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(initial?.name ?? "")
  const [description, setDescription] = useState(initial?.description ?? "")
  const [method, setMethod] = useState<EvaluationMethod>(initial?.method ?? "evaluator_score")
  const [weight, setWeight] = useState(String(initial?.weight ?? 10))
  const [items, setItems] = useState<ReadonlyArray<TaskItemDraft>>(
    initial?.items ?? [{ id: null, label: "평가 항목 1", section: null, criteria: [] }],
  )
  const [evaluatorWeights, setEvaluatorWeights] = useState<ReadonlyArray<TaskEvaluatorDraft>>(
    initial?.evaluatorWeights ?? [],
  )
  const [error, setError] = useState<string | null>(null)

  function changeMethod(next: EvaluationMethod) {
    setMethod(next)
    if (next !== "evaluator_score") setItems([])
    else if (items.length === 0) {
      setItems([{ id: null, label: "평가 항목 1", section: null, criteria: [] }])
    }
    if (!isEvaluatorMethod(next)) setEvaluatorWeights([])
  }

  function toggleEvaluator(evaluatorId: string, checked: boolean) {
    setEvaluatorWeights((current) => checked
      ? [...current, { evaluatorId, weight: 1 }]
      : current.filter((entry) => entry.evaluatorId !== evaluatorId))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsedWeight = Number(weight)
    if (name.trim().length === 0 || !Number.isFinite(parsedWeight) || parsedWeight <= 0) {
      setError("과제명과 0보다 큰 가중치를 입력해 주세요.")
      return
    }
    if (method === "evaluator_score" && items.some((item) => item.label.trim().length === 0)) {
      setError("모든 평가 항목의 내용을 입력해 주세요.")
      return
    }
    const criteriaInvalid = items.some((item) => {
      const scores = item.criteria.map((criterion) => criterion.score)
      return item.criteria.some((criterion) =>
        !Number.isInteger(criterion.score)
        || criterion.score < 0
        || criterion.score > 10
        || criterion.description.trim().length === 0
      ) || new Set(scores).size !== scores.length
    })
    if (method === "evaluator_score" && criteriaInvalid) {
      setError("평가기준은 0~10점의 중복 없는 정수와 설명을 입력해 주세요.")
      return
    }
    const saved = onSave({
      taskId: initial?.taskId ?? null,
      name: name.trim(),
      description: description.trim(),
      method,
      weight: parsedWeight,
      items: method === "evaluator_score"
        ? items.map((item) => ({
          ...item,
          label: item.label.trim(),
          section: item.section?.trim() || null,
          criteria: item.criteria
            .map((criterion) => ({ ...criterion, description: criterion.description.trim() }))
            .toSorted((left, right) => left.score - right.score),
        }))
        : [],
      evaluatorWeights: isEvaluatorMethod(method) ? evaluatorWeights : [],
    })
    if (saved) setOpen(false)
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button disabled={disabled} size={initial === undefined ? "default" : "sm"} variant={initial === undefined ? "default" : "outline"}>
          {initial === undefined ? <Plus aria-hidden="true" /> : null}
          {initial === undefined ? "과제 추가" : "설정 수정"}
        </Button>
      </DialogTrigger>
      <DialogContent className="block max-h-[90dvh] overflow-hidden p-0 sm:max-w-2xl">
        <form className="flex max-h-[90dvh] flex-col" onSubmit={handleSubmit}>
          <DialogHeader className="shrink-0 px-4 pt-5 pr-12 sm:px-6 sm:pt-6">
            <DialogTitle>{initial === undefined ? "새 평가 과제" : "평가 과제 수정"}</DialogTitle>
            <DialogDescription>평가방식, 반영 가중치, 문항과 평가자를 시즌별로 설정합니다.</DialogDescription>
          </DialogHeader>
          <div className="grid min-h-0 flex-1 gap-5 overflow-y-auto px-4 py-5 sm:grid-cols-2 sm:px-6">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="task-name">과제명</Label>
              <Input id="task-name" maxLength={100} onChange={(event) => setName(event.currentTarget.value)} placeholder="예: 성장탐구계획서" value={name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-method">평가방식</Label>
              <Select onValueChange={(value) => {
                if (isEvaluationMethod(value)) changeMethod(value)
              }} value={method}>
                <SelectTrigger className="w-full" id="task-method"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(METHOD_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-weight">최종 반영 가중치 (%)</Label>
              <Input id="task-weight" inputMode="decimal" max="100" min="0.1" onChange={(event) => setWeight(event.currentTarget.value)} step="0.1" type="number" value={weight} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="task-description">평가 안내</Label>
              <Textarea id="task-description" maxLength={1000} onChange={(event) => setDescription(event.currentTarget.value)} placeholder="평가자가 확인할 목적, 기준, 유의사항을 입력하세요." rows={3} value={description} />
            </div>
            {method === "evaluator_score" ? (
              <section className="space-y-3 border-t pt-5 sm:col-span-2" aria-labelledby="task-items-title">
                <div className="flex items-center justify-between gap-3"><div><h3 className="font-semibold" id="task-items-title">세부 평가 항목</h3><p className="mt-1 text-xs text-muted-foreground">각 항목을 0~10점으로 평가하고 100점 기준으로 자동 환산합니다.</p></div><Button disabled={items.length >= 20} onClick={() => setItems((current) => [...current, { id: null, label: `평가 항목 ${current.length + 1}`, section: null, criteria: [] }])} size="sm" type="button" variant="outline"><Plus aria-hidden="true" />항목</Button></div>
                <div className="space-y-2">{items.map((item, index) => (
                  <RubricItemEditor
                    index={index}
                    item={item}
                    itemCount={items.length}
                    key={`${item.id ?? "new"}-${index}`}
                    onChange={(nextItem) => setItems((current) => current.map(
                      (entry, itemIndex) => itemIndex === index ? nextItem : entry,
                    ))}
                    onDelete={() => setItems((current) => current.filter(
                      (_, itemIndex) => itemIndex !== index,
                    ))}
                  />
                ))}</div>
              </section>
            ) : null}
            {isEvaluatorMethod(method) ? (
              <section className="space-y-3 border-t pt-5 sm:col-span-2" aria-labelledby="task-evaluators-title">
                <div><h3 className="font-semibold" id="task-evaluators-title">평가자와 가중치</h3><p className="mt-1 text-xs text-muted-foreground">선택한 평가자의 양수 가중치를 자동 정규화해 반영합니다.</p></div>
                <div className="grid gap-2 sm:grid-cols-2">{evaluators.map((evaluator) => { const selected = evaluatorWeights.find((entry) => entry.evaluatorId === evaluator.id); return <label className="flex items-center gap-3 rounded-md border p-3" key={evaluator.id}><input aria-label={`${evaluator.name} 평가 참여`} checked={selected !== undefined} className="size-4 accent-primary" onChange={(event) => toggleEvaluator(evaluator.id, event.currentTarget.checked)} type="checkbox" /><span className="min-w-0 flex-1 text-sm"><span className="block truncate font-medium">{evaluator.name}</span><span className="text-xs text-muted-foreground">{evaluator.employeeCode}</span></span><Input aria-label={`${evaluator.name} 가중치`} className="w-20" disabled={selected === undefined} min="0.1" onChange={(event) => { const nextWeight = Number(event.currentTarget.value); setEvaluatorWeights((current) => current.map((entry) => entry.evaluatorId === evaluator.id ? { ...entry, weight: nextWeight } : entry)) }} step="0.1" type="number" value={selected?.weight ?? 1} /></label> })}</div>
              </section>
            ) : null}
            {error === null ? null : <p className="text-sm text-destructive sm:col-span-2" role="alert">{error}</p>}
          </div>
          <DialogFooter className="m-0 shrink-0 flex-row justify-end rounded-b-xl px-4 py-3 sm:px-6"><DialogClose asChild><Button type="button" variant="outline">취소</Button></DialogClose><Button type="submit">과제 저장</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { METHOD_LABELS }
