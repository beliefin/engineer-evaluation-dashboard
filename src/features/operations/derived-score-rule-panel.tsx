"use client"

import { Pencil, Plus, Trash2 } from "lucide-react"
import { useMemo, useState, type FormEvent } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { OperationPanel } from "./operation-panel"
import type { DerivedScoreRuleDraft, DerivedScoreRuleViewModel } from "./types"
import styles from "./derived-rule-signal.module.css"

type Option = Readonly<{ taskId: string; taskName: string }>
type EngineerOption = Readonly<{
  engineerId: string
  engineerName: string
  teamName: string
}>

type Props = Readonly<{
  rules: ReadonlyArray<DerivedScoreRuleViewModel>
  derivedTasks: ReadonlyArray<Option>
  sourceTasks: ReadonlyArray<Option>
  engineers: ReadonlyArray<EngineerOption>
  disabled: boolean
  onSave?: ((rule: DerivedScoreRuleDraft) => boolean) | undefined
  onDelete?: ((ruleId: string) => boolean) | undefined
}>

const EMPTY: DerivedScoreRuleDraft = {
  ruleId: null,
  taskId: "",
  targetEngineerId: "",
  sourceTaskId: "",
  sourceEngineerIds: [],
}

export function DerivedScoreRulePanel({
  rules,
  derivedTasks,
  sourceTasks,
  engineers,
  disabled,
  onSave,
  onDelete,
}: Props) {
  const [form, setForm] = useState<DerivedScoreRuleDraft>(EMPTY)
  const [query, setQuery] = useState("")
  const [error, setError] = useState<string | null>(null)
  const visibleEngineers = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("ko-KR")
    return engineers.filter((engineer) =>
      engineer.engineerId !== form.targetEngineerId &&
      (normalized === "" || `${engineer.engineerName} ${engineer.teamName}`
        .toLocaleLowerCase("ko-KR").includes(normalized)))
  }, [engineers, form.targetEngineerId, query])

  function reset() {
    setForm(EMPTY)
    setQuery("")
    setError(null)
  }

  function edit(rule: DerivedScoreRuleViewModel) {
    setForm(rule)
    setQuery("")
    setError(null)
  }

  function toggleSource(engineerId: string, checked: boolean) {
    setForm((current) => ({
      ...current,
      sourceEngineerIds: checked
        ? [...current.sourceEngineerIds, engineerId]
        : current.sourceEngineerIds.filter((id) => id !== engineerId),
    }))
  }

  function selectTargetEngineer(targetEngineerId: string) {
    setForm((current) => ({
      ...current,
      targetEngineerId,
      sourceEngineerIds: current.sourceEngineerIds.filter((id) => id !== targetEngineerId),
    }))
  }

  function selectDerivedTask(taskId: string) {
    setForm((current) => ({ ...current, taskId }))
  }

  function selectSourceTask(sourceTaskId: string) {
    setForm((current) => ({ ...current, sourceTaskId }))
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (form.taskId === "" || form.targetEngineerId === "" || form.sourceTaskId === "") {
      setError("대상 엔지니어, 파생 과제와 원천 과제를 선택해 주세요.")
      return
    }
    if (form.sourceEngineerIds.length === 0) {
      setError("평균에 반영할 원천 엔지니어를 한 명 이상 선택해 주세요.")
      return
    }
    if (onSave?.(form) ?? false) reset()
  }

  const nameOf = (engineerId: string) =>
    engineers.find((engineer) => engineer.engineerId === engineerId)?.engineerName ?? "삭제된 엔지니어"
  const taskNameOf = (taskId: string) =>
    [...derivedTasks, ...sourceTasks].find((task) => task.taskId === taskId)?.taskName ?? "삭제된 과제"

  return (
    <OperationPanel
      description="선택 인원의 확정 평가점수 평균을 다른 엔지니어 과제 점수로 연결. 원천 점수 1건 이상 미확정 시 파생 점수도 미확정"
      title="연계·파생 점수"
    >
      {derivedTasks.length === 0 ? (
        <p className="signal-derived-empty rounded-md border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          과제 구성에서 평가방식을 ‘연계 점수 평균’으로 한 과제를 먼저 추가해 주세요.
        </p>
      ) : (
        <div className={styles.canvas}>
          <form className={styles.form} onSubmit={submit}>
            <div className={styles.formHeading}>
              <h3 className="font-semibold">{form.ruleId === null ? "연계 규칙 추가" : "연계 규칙 수정"}</h3>
              {form.ruleId !== null ? <Button onClick={reset} size="sm" type="button" variant="ghost">새 규칙</Button> : null}
            </div>
            <div className={styles.fields}>
              <label className={styles.field}><span className="font-medium">점수를 받을 엔지니어</span><select className={styles.select} disabled={disabled} onChange={(event) => selectTargetEngineer(event.currentTarget.value)} value={form.targetEngineerId}><option value="">선택</option>{engineers.map((engineer) => <option key={engineer.engineerId} value={engineer.engineerId}>{engineer.engineerName} · {engineer.teamName}</option>)}</select></label>
              <label className={styles.field}><span className="font-medium">파생 점수 과제</span><select className={styles.select} disabled={disabled} onChange={(event) => selectDerivedTask(event.currentTarget.value)} value={form.taskId}><option value="">선택</option>{derivedTasks.map((task) => <option key={task.taskId} value={task.taskId}>{task.taskName}</option>)}</select></label>
              <label className={`${styles.field} ${styles.sourceTaskField}`}><span className="font-medium">평균 원천 과제</span><select className={styles.select} disabled={disabled} onChange={(event) => selectSourceTask(event.currentTarget.value)} value={form.sourceTaskId}><option value="">평가자 과제 선택</option>{sourceTasks.map((task) => <option key={task.taskId} value={task.taskId}>{task.taskName}</option>)}</select></label>
            </div>
            <div className={styles.sourceBlock}>
              <div className={styles.sourceHeading}><div><p className={styles.sourceTitle}>원천 엔지니어</p><p className={styles.sourceCount}>선택 {form.sourceEngineerIds.length}명</p></div><Input aria-label="원천 엔지니어 검색" className={styles.search} onChange={(event) => setQuery(event.currentTarget.value)} placeholder="이름 또는 팀 검색" value={query} /></div>
              <div className={styles.sourceList}>
                {visibleEngineers.map((engineer) => (
                  <label className={styles.sourceOption} key={engineer.engineerId}>
                    <input checked={form.sourceEngineerIds.includes(engineer.engineerId)} className={styles.sourceCheckbox} disabled={disabled} onChange={(event) => toggleSource(engineer.engineerId, event.currentTarget.checked)} type="checkbox" />
                    <span className={styles.sourceIdentity}>{engineer.engineerName} <span className={styles.sourceTeam}>· {engineer.teamName}</span></span>
                  </label>
                ))}
              </div>
            </div>
            {error !== null ? <p className={styles.error} role="alert">{error}</p> : null}
            <Button className={styles.save} disabled={disabled} type="submit"><Plus aria-hidden="true" />연계 규칙 저장</Button>
          </form>

          <div className={styles.current}>
            <div className={styles.currentHeading}><h3 className="font-semibold">현재 시즌 연결</h3><Badge variant="secondary">{rules.length}개</Badge></div>
            {rules.length === 0 ? <p className={styles.emptyRule}>저장된 연계 규칙이 없습니다.</p> : rules.map((rule) => (
              <article className={styles.rule} key={rule.ruleId}>
                <div className={styles.ruleHeading}><div className={styles.ruleCopy}><p className="font-medium">{nameOf(rule.targetEngineerId)} · {taskNameOf(rule.taskId)}</p><p className={styles.ruleMeta}>{taskNameOf(rule.sourceTaskId)} · {rule.sourceEngineerIds.map(nameOf).join(", ")} 평균</p></div><div className={styles.ruleActions}><Button aria-label={`${nameOf(rule.targetEngineerId)} 연계 규칙 수정`} disabled={disabled} onClick={() => edit(rule)} size="icon" type="button" variant="ghost"><Pencil aria-hidden="true" /></Button><Button aria-label={`${nameOf(rule.targetEngineerId)} 연계 규칙 삭제`} disabled={disabled} onClick={() => { if (window.confirm("이 연계 규칙을 삭제할까요?")) onDelete?.(rule.ruleId) }} size="icon" type="button" variant="ghost"><Trash2 aria-hidden="true" /></Button></div></div>
              </article>
            ))}
          </div>
        </div>
      )}
    </OperationPanel>
  )
}
