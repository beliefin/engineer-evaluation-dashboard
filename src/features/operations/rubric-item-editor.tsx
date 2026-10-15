"use client"

import { ChevronDownIcon, PlusIcon, Trash2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

import type { TaskItemDraft } from "./types"
import styles from "./rubric-item-signal.module.css"

type Props = Readonly<{
  item: TaskItemDraft
  index: number
  itemCount: number
  onChange: (item: TaskItemDraft) => void
  onDelete: () => void
}>

function availableCriterionScore(item: TaskItemDraft): number {
  const usedScores = new Set(item.criteria.map((criterion) => criterion.score))
  return [3, 5, 7, 9, 0, 1, 2, 4, 6, 8, 10]
    .find((score) => !usedScores.has(score)) ?? 0
}

export function RubricItemEditor({ item, index, itemCount, onChange, onDelete }: Props) {
  const itemNumber = index + 1

  return (
    <div className={styles.editor}>
      <div className={styles.itemFields}>
        <span className={styles.itemNumber}>
          {itemNumber}
        </span>
        <Input
          aria-label={`평가 항목 ${itemNumber} 구분`}
          className={styles.sectionInput}
          maxLength={50}
          onChange={(event) => onChange({ ...item, section: event.currentTarget.value || null })}
          placeholder="구분"
          value={item.section ?? ""}
        />
        <Input
          aria-label={`평가 항목 ${itemNumber}`}
          className={styles.labelInput}
          maxLength={200}
          onChange={(event) => onChange({ ...item, label: event.currentTarget.value })}
          value={item.label}
        />
        <Button
          aria-label={`평가 항목 ${itemNumber} 삭제`}
          className={`${styles.deleteButton} ${styles.itemDelete}`}
          disabled={itemCount <= 1}
          onClick={onDelete}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <Trash2Icon aria-hidden="true" />
        </Button>
      </div>

      <details className={`${styles.criteriaDetails} group`}>
        <summary className={styles.criteriaSummary}>
          <ChevronDownIcon className="size-4 transition-transform group-open:rotate-180" aria-hidden="true" />
          평가기준 {item.criteria.length}개 편집
        </summary>
        <div className={styles.criteriaList}>
          {item.criteria.map((criterion, criterionIndex) => (
            <div
              className={styles.criterionRow}
              key={`criterion-${criterionIndex}`}
            >
              <Input
                aria-label={`평가 항목 ${itemNumber} 기준 ${criterionIndex + 1} 점수`}
                className={styles.scoreInput}
                max={10}
                min={0}
                onChange={(event) => {
                  const score = Number(event.currentTarget.value)
                  onChange({
                    ...item,
                    criteria: item.criteria.map((entry, currentIndex) =>
                      currentIndex === criterionIndex ? { ...entry, score } : entry
                    ),
                  })
                }}
                step={1}
                type="number"
                value={criterion.score}
              />
              <Textarea
                aria-label={`평가 항목 ${itemNumber} 기준 ${criterionIndex + 1} 설명`}
                className={styles.descriptionInput}
                maxLength={500}
                onChange={(event) => {
                  const description = event.currentTarget.value
                  onChange({
                    ...item,
                    criteria: item.criteria.map((entry, currentIndex) =>
                      currentIndex === criterionIndex ? { ...entry, description } : entry
                    ),
                  })
                }}
                placeholder="이 점수에 해당하는 관찰 기준을 입력하세요."
                rows={2}
                value={criterion.description}
              />
              <Button
                aria-label={`평가 항목 ${itemNumber} 기준 ${criterionIndex + 1} 삭제`}
                className={`${styles.deleteButton} ${styles.criterionDelete}`}
                onClick={() => onChange({
                  ...item,
                  criteria: item.criteria.filter((_, currentIndex) => currentIndex !== criterionIndex),
                })}
                size="icon-sm"
                type="button"
                variant="ghost"
              >
                <Trash2Icon aria-hidden="true" />
              </Button>
            </div>
          ))}
          <Button
            aria-label={`평가 항목 ${itemNumber} 평가기준 추가`}
            disabled={item.criteria.length >= 11}
            onClick={() => onChange({
              ...item,
              criteria: [
                ...item.criteria,
                { score: availableCriterionScore(item), description: "" },
              ],
            })}
            size="sm"
            type="button"
            variant="outline"
          >
            <PlusIcon aria-hidden="true" />
            평가기준 추가
          </Button>
        </div>
      </details>
    </div>
  )
}
