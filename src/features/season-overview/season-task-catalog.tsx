import { Badge } from "@/components/ui/badge"
import type { SeasonTaskGuide } from "@/view-models/season-overview"

import "./season-catalog-signal.css"

function TaskArticle({ index, task }: Readonly<{ index: number; task: SeasonTaskGuide }>) {
  return (
    <article className="signal-task-card" id={`task-${task.id}`}>
      <header className="signal-task-card-heading">
        <span className="signal-task-card-number numeric">{String(index + 1).padStart(2, "0")}</span>
        <h3>{task.name}</h3>
        <span className="signal-task-card-weight numeric">{task.weight}%</span>
        <span className="signal-task-card-method">{task.methodLabel}</span>
      </header>
      <dl className="signal-task-guide">
        <div className="signal-task-guide-row"><dt>목적과 방향</dt><dd>{task.purpose}</dd></div>
        <div className="signal-task-guide-row"><dt>기대 산출물</dt><dd>{task.output}</dd></div>
        <div className="signal-task-guide-row signal-task-process-row">
          <dt>수행 절차</dt>
          <dd>
            <ol className="signal-task-process" aria-label={`${task.name} 수행 절차`}>
              {task.process.map((step, stepIndex) => (
                <li key={step.title}>
                  <span className="signal-task-process-number numeric">{String(stepIndex + 1).padStart(2, "0")}</span>
                  <div><p className="signal-task-process-title">{step.title}</p><p>{step.description}</p></div>
                </li>
              ))}
            </ol>
          </dd>
        </div>
        <div className="signal-task-guide-row"><dt>성장 역량</dt><dd>{task.capability}</dd></div>
        <div className="signal-task-guide-row">
          <dt>평가 초점</dt>
          <dd><ul className="signal-task-focus">{task.focusItems.map((item, index) => (
            <li key={item}><span className="numeric" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><span>{item}</span></li>
          ))}</ul></dd>
        </div>
      </dl>
    </article>
  )
}

export function SeasonTaskCatalog({ tasks }: Readonly<{ tasks: ReadonlyArray<SeasonTaskGuide> }>) {
  return (
    <section className="signal-task-catalog" id="season-tasks" aria-labelledby="season-task-title">
      <header className="signal-task-catalog-heading">
        <p className="numeric">02 · 과제 안내</p>
        <h2 id="season-task-title">과제별 목적과 수행 절차</h2>
        <p>목적·수행 순서·산출물·평가 기준 통합 안내</p>
      </header>
      <div className="signal-task-catalog-grid">{tasks.map((task, index) => <TaskArticle index={index} key={task.id} task={task} />)}</div>
    </section>
  )
}

export function EducationTaskCatalog({ tasks }: Readonly<{ tasks: ReadonlyArray<SeasonTaskGuide> }>) {
  if (tasks.length === 0) return null

  return (
    <section className="signal-education-catalog" aria-labelledby="education-task-title">
      <div className="signal-task-catalog-heading">
        <p className="numeric">별도 대상 · 교육 담당자</p>
        <h2 id="education-task-title">교육 담당자 전용 과제</h2>
        <p>OTS 교육 담당자에게만 적용되는 별도 과제. 일반 엔지니어 평가 구성 100%에서 제외</p>
      </div>
      <div className="signal-task-catalog-grid">
        {tasks.map((task) => (
          <article className="signal-education-card" key={task.id}>
            <header>
              <h3>{task.name}</h3>
              <Badge variant="outline">교육 담당자 대상</Badge>
              <span>일반 평가 합계 제외</span>
            </header>
            <p>{task.purpose}</p>
            <ol className="signal-task-process" aria-label={`${task.name} 수행 절차`}>
              {task.process.map((step, index) => (
                <li key={step.title}>
                  <span className="signal-task-process-number numeric">{index + 1}</span>
                  <div><p className="signal-task-process-title">{step.title}</p><p>{step.description}</p></div>
                </li>
              ))}
            </ol>
          </article>
        ))}
      </div>
    </section>
  )
}
