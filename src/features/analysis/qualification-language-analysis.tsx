import type { AchievementSourceAnalysisDatum } from "./types"

type QualificationLanguageAnalysisProps = Readonly<{
  data: AchievementSourceAnalysisDatum
}>

export function QualificationLanguageAnalysis(
  { data }: QualificationLanguageAnalysisProps,
) {
  const certificationMaximum = Math.max(
    1,
    ...data.certificationHoldings.map((entry) => entry.holderCount),
  )
  const languageMaximum = Math.max(
    1,
    ...data.languageResults.map((entry) => entry.holderCount),
  )

  return (
    <section aria-labelledby="qualification-language-heading" className="space-y-4">
      <header>
        <h2
          className="text-xl font-semibold tracking-tight"
          id="qualification-language-heading"
        >
          자격·어학 원천 내역
        </h2>
        <p className="mt-1 max-w-4xl text-pretty text-sm text-muted-foreground">
          환산점수가 아닌 실제 자격증명과 어학 시험·성적 집계. 팀·진행 상태
          필터는 적용되며 과제 필터는 이 원천 내역에 적용되지 않습니다.
        </p>
      </header>

      <dl className="grid overflow-hidden border-y border-border bg-card sm:grid-cols-2 lg:grid-cols-6 lg:divide-x lg:divide-border-subtle">
        <Metric
          detail={`${data.eligibleEngineerCount}명 중 실제 기록`}
          label="자격증 기록 인원"
          value={`${data.certificationRecordedEngineerCount}명`}
        />
        <Metric
          detail="중복 명칭 제외"
          label="보유 자격증 종류"
          value={`${data.certificationTypeCount}종`}
        />
        <Metric
          detail="고유 엔지니어 기준"
          label={`${data.evaluationYear}년 신규 취득`}
          value={`${data.certificationAcquiredThisYearEngineerCount}명`}
        />
        <Metric
          detail={`${data.eligibleEngineerCount}명 중 실제 기록`}
          label="어학 기록 인원"
          value={`${data.languageRecordedEngineerCount}명`}
        />
        <Metric
          detail="언어와 시험 조합"
          label="어학 시험 종류"
          value={`${data.languageExamCount}종`}
        />
        <Metric
          detail="취득 년월 기준"
          label={`${data.evaluationYear}년 성적 취득`}
          value={`${data.languageAcquiredThisYearEngineerCount}명`}
        />
      </dl>

      <div className="grid min-w-0 gap-6 lg:grid-cols-2">
        <article className="min-w-0 rounded-md border border-border bg-card">
          <header className="border-b border-border-subtle px-4 py-4 sm:px-5">
            <h3 className="text-base font-semibold tracking-tight">보유 자격증 분포</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              보유 인원이 많은 순서입니다. 없음 응답 {data.certificationNoScoreEngineerCount}명
              · 미입력 {data.certificationUnreportedEngineerCount}명
            </p>
          </header>
          <div className="p-4 sm:p-5">
            {data.certificationHoldings.length === 0 ? (
              <p className="border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
                현재 필터에 실제 자격증 기록이 없습니다.
              </p>
            ) : (
              <table className="w-full table-fixed" aria-label="자격증별 보유 및 평가연도 신규 취득 인원">
                <colgroup>
                  <col />
                  <col className="w-14" />
                  <col className="w-16" />
                </colgroup>
                <thead>
                  <tr className="border-b border-border-subtle text-xs font-medium text-muted-foreground">
                    <th className="pb-2 text-left font-medium" scope="col">자격증</th>
                    <th className="pb-2 text-right font-medium" scope="col">보유</th>
                    <th className="pb-2 text-right font-medium" scope="col">비율</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {data.certificationHoldings.map((entry) => (
                    <tr
                      key={entry.certificateName}
                    >
                      <td className="min-w-0 py-3 pr-3 align-middle">
                        <p className="break-keep text-sm font-medium text-foreground">
                          {entry.certificateName}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {data.evaluationYear}년 신규 {entry.acquiredThisYearCount}명
                        </p>
                        <div aria-hidden="true" className="mt-2 h-1.5 overflow-hidden rounded-sm bg-muted">
                          <div
                            className="h-full rounded-sm bg-[var(--chart-1)]"
                            style={{ width: `${(entry.holderCount / certificationMaximum) * 100}%` }}
                          />
                        </div>
                      </td>
                      <td className="numeric py-3 text-right align-middle text-sm font-semibold">
                        {entry.holderCount}명
                      </td>
                      <td className="numeric py-3 text-right align-middle text-xs text-muted-foreground">
                        {entry.shareOfRecordedEngineers.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </article>

        <article className="min-w-0 rounded-md border border-border bg-card">
          <header className="border-b border-border-subtle px-4 py-4 sm:px-5">
            <h3 className="text-base font-semibold tracking-tight">어학 시험·성적 분포</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              시험과 실제 성적 조합별 인원입니다. 없음 응답 {data.languageNoScoreEngineerCount}명
              · 미입력 {data.languageUnreportedEngineerCount}명
            </p>
          </header>
          <div className="p-4 sm:p-5">
            {data.languageResults.length === 0 ? (
              <p className="border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
                현재 필터에 실제 어학 성적 기록이 없습니다.
              </p>
            ) : (
              <table className="w-full table-fixed" aria-label="어학 시험과 성적별 보유 인원">
                <colgroup>
                  <col />
                  <col className="w-12" />
                  <col className="w-14" />
                  <col className="w-16" />
                </colgroup>
                <thead>
                  <tr className="border-b border-border-subtle text-xs font-medium text-muted-foreground">
                    <th className="pb-2 text-left font-medium" scope="col">언어·시험</th>
                    <th className="pb-2 text-right font-medium" scope="col">성적</th>
                    <th className="pb-2 text-right font-medium" scope="col">인원</th>
                    <th className="pb-2 text-right font-medium" scope="col">비율</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {data.languageResults.map((entry) => (
                    <tr
                      key={entry.key}
                    >
                      <td className="min-w-0 py-3 pr-3 align-middle">
                        <p className="break-keep text-sm font-medium text-foreground">
                          {entry.scopeLabel} · {entry.examName}
                        </p>
                        <div aria-hidden="true" className="mt-2 h-1.5 overflow-hidden rounded-sm bg-muted">
                          <div
                            className="h-full rounded-sm bg-[var(--chart-2)]"
                            style={{ width: `${(entry.holderCount / languageMaximum) * 100}%` }}
                          />
                        </div>
                      </td>
                      <td className="numeric py-3 text-right align-middle text-sm font-semibold">
                        {entry.result}
                      </td>
                      <td className="numeric py-3 text-right align-middle text-sm font-semibold">
                        {entry.holderCount}명
                      </td>
                      <td className="numeric py-3 text-right align-middle text-xs text-muted-foreground">
                        {entry.shareOfRecordedEngineers.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </article>
      </div>

      <p className="text-xs text-muted-foreground">
        보유 인원과 비율은 중복 기록이 아닌 고유 엔지니어 기준입니다. 취득 연도는 현재
        평가 시즌 시작 연도인 {data.evaluationYear}년 기준. 비율은 자격증 또는
        어학 기록 보유 인원을 각각 분모로 계산
      </p>
    </section>
  )
}

type MetricProps = Readonly<{
  label: string
  value: string
  detail: string
}>

function Metric({ label, value, detail }: MetricProps) {
  return (
    <div className="border-b border-border-subtle px-4 py-4 last:border-b-0 sm:px-5 lg:border-b-0">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-2">
        <span className="numeric text-xl font-semibold tracking-tight">{value}</span>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      </dd>
    </div>
  )
}
