import { CheckCircle2, Flag, Target } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { SeasonTaskGuide } from "@/view-models/season-overview"

function TaskArticle({ index, task }: Readonly<{ index: number; task: SeasonTaskGuide }>) {
  return (
    <article className="border border-border bg-card" id={`task-${task.id}`}>
      <header className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 border-b border-border bg-muted/35 px-5 py-4">
        <span className="numeric mt-0.5 text-xs font-bold text-primary">{String(index + 1).padStart(2, "0")}</span>
        <div className="min-w-0">
          <h3 className="text-lg font-bold leading-6">{task.name}</h3>
          <Badge className="mt-2" variant="outline">{task.methodLabel}</Badge>
        </div>
        <span className="numeric text-xl font-bold text-primary">{task.weight}%</span>
      </header>

      <div className="p-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold tracking-wide text-primary">
              <Target aria-hidden className="size-4" /> 목적과 방향
            </p>
            <p className="mt-2 text-sm leading-6 text-foreground">{task.purpose}</p>
          </div>
          <div>
            <p className="flex items-center gap-2 text-xs font-bold tracking-wide text-primary">
              <Flag aria-hidden className="size-4" /> 기대 산출물
            </p>
            <p className="mt-2 text-sm leading-6 text-foreground">{task.output}</p>
          </div>
        </div>

        <div className="mt-6 border-t border-border pt-5">
          <p className="text-xs font-bold tracking-wide text-muted-foreground">수행 절차</p>
          <ol className="mt-3 grid gap-0 sm:grid-cols-2">
            {task.process.map((step, stepIndex) => (
              <li className="relative border-l border-border pb-4 pl-5 last:pb-0 sm:odd:pr-4" key={step.title}>
                <span className="numeric absolute -left-3 top-0 flex size-6 items-center justify-center border border-primary bg-card text-[10px] font-bold text-primary">
                  {stepIndex + 1}
                </span>
                <p className="text-sm font-bold">{step.title}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-6 grid gap-4 border-t border-border pt-5 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div>
            <p className="text-xs font-bold text-muted-foreground">성장 역량</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-primary">{task.capability}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground">평가 초점</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {task.focusItems.map((item) => (
                <li className="inline-flex items-center gap-1.5 border border-border bg-muted/35 px-2 py-1 text-xs leading-5" key={item}>
                  <CheckCircle2 aria-hidden className="size-3 text-success" /> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </article>
  )
}

export function SeasonTaskCatalog({ tasks }: Readonly<{ tasks: ReadonlyArray<SeasonTaskGuide> }>) {
  return (
    <section className="px-5 py-9 sm:px-8 lg:px-10 lg:py-12" id="season-tasks" aria-labelledby="season-task-title">
      <div className="max-w-4xl">
        <p className="numeric text-xs font-bold tracking-[0.16em] text-primary">02 · 과제 안내</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight" id="season-task-title">과제별 목적과 수행 절차</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          과제의 목적, 수행 순서, 제출할 결과물과 평가 기준을 한눈에 확인할 수 있습니다.
        </p>
      </div>
      <div className="mt-7 grid gap-5 xl:grid-cols-2">
        {tasks.map((task, index) => <TaskArticle index={index} key={task.id} task={task} />)}
      </div>
    </section>
  )
}

export function EducationTaskCatalog({
  tasks,
}: Readonly<{ tasks: ReadonlyArray<SeasonTaskGuide> }>) {
  if (tasks.length === 0) return null

  return (
    <section className="border-t border-border bg-muted/25 px-5 py-9 sm:px-8 lg:px-10" aria-labelledby="education-task-title">
      <div className="grid gap-6 lg:grid-cols-[minmax(14rem,0.7fr)_minmax(0,1.3fr)]">
        <div>
          <p className="numeric text-xs font-bold tracking-[0.16em] text-primary">별도 대상 · 교육 담당자</p>
          <h2 className="mt-2 text-xl font-bold tracking-tight" id="education-task-title">교육 담당자 전용 과제</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
            아래 과제는 OTS 교육을 맡은 인원에게만 적용합니다. 일반 엔지니어의 평가 구성 100%에는 포함하지 않습니다.
          </p>
        </div>
        <div className="space-y-4">
          {tasks.map((task) => (
            <article className="border border-border bg-card p-5" key={task.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold">{task.name}</h3>
                  <Badge className="mt-2" variant="outline">교육 담당자 대상</Badge>
                </div>
                <span className="text-xs font-semibold text-primary">일반 평가 합계 제외</span>
              </div>
              <p className="mt-4 text-sm leading-6">{task.purpose}</p>
              <ol className="mt-5 grid gap-3 sm:grid-cols-2" aria-label={`${task.name} 수행 절차`}>
                {task.process.map((step, index) => (
                  <li className="border-t border-border pt-3" key={step.title}>
                    <p className="text-sm font-bold"><span className="numeric mr-2 text-primary">{index + 1}</span>{step.title}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{step.description}</p>
                  </li>
                ))}
              </ol>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
