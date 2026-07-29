import { expect, test } from "@playwright/test"

import { clearDemoStorage, waitForApp } from "./helpers"

const OUTPUT_DIR = "C:/llmwiki/outputs/engineer-evaluation-dashboard/visual-qa"
const VIEWPORTS = [
  { name: "desktop-1280", width: 1280, height: 900 },
  { name: "tablet-768", width: 768, height: 1000 },
  { name: "mobile-375", width: 375, height: 812 },
] as const

test.describe.configure({ mode: "serial" })

test.beforeEach(async ({ page }) => {
  await clearDemoStorage(page)
})

test("분석 인사이트 전체 화면을 검토 폭에서 캡처한다", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "single visual capture pass")
  test.setTimeout(90_000)

  for (const viewport of VIEWPORTS) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto("/analysis")
    await waitForApp(page)
    await expect(page.getByRole("heading", { name: "핵심 인사이트" })).toBeVisible()
    await expect(page.getByRole("heading", { name: "과제별 점수 분포와 변별 폭" })).toBeVisible()
    await expect(page.getByRole("heading", { name: "과제별 완료율 병목" })).toBeVisible()
    await expect(page.getByRole("heading", { name: "팀별 과제 성과 매트릭스" })).toBeVisible()
    await expect(page.getByRole("heading", { name: "개인별 평가자 점수 비교" })).toBeVisible()
    await expect(page.getByRole("heading", { name: "평가자 보정 진단" })).toBeVisible()
    await expect(page.getByRole("heading", { name: "평가 신뢰도 진단" })).toBeVisible()
    await expect(page.getByRole("heading", { name: "평가 신뢰도 사분면" })).toBeVisible()
    await expect(page.getByRole("heading", { name: "평가자×엔지니어 편차 매트릭스" })).toBeVisible()
    await expect(page.getByRole("heading", { name: "평가자 제외 시 순위 안정성" })).toBeVisible()

    const hasPageOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    )
    expect(hasPageOverflow).toBe(false)

    await page.screenshot({
      animations: "disabled",
      fullPage: true,
      path: `${OUTPUT_DIR}/analysis-insights-${viewport.name}.png`,
    })
  }
})

test("평가 신뢰도 진단은 과제를 바꿔도 세 분석을 유지한다", async ({ page }, testInfo) => {
  const isDesktop = testInfo.project.name === "desktop-chromium"
  await page.setViewportSize(isDesktop ? { width: 1280, height: 900 } : { width: 375, height: 812 })
  await page.goto("/analysis")
  await waitForApp(page)

  const reliability = page.getByRole("region", { name: "평가 신뢰도 진단" })
  await reliability.scrollIntoViewIfNeeded()
  const taskSelect = reliability.getByRole("combobox", { name: "분석할 평가 과제" })
  await taskSelect.click()
  const options = page.getByRole("option")
  await options.nth(1).click()

  await expect(reliability.getByRole("heading", { name: "평가 신뢰도 사분면" })).toBeVisible()
  await expect(reliability.getByRole("heading", { name: "평가자×엔지니어 편차 매트릭스" })).toBeVisible()
  await expect(reliability.getByRole("heading", { name: "평가자 제외 시 순위 안정성" })).toBeVisible()
  const rankRail = reliability.getByRole("list", { name: "평가자 제외 순위 변화" })
  expect(await rankRail.evaluate((element) => element.scrollHeight <= element.clientHeight)).toBe(true)
  await reliability.screenshot({
    animations: "disabled",
    path: `${OUTPUT_DIR}/evaluation-reliability-${isDesktop ? "desktop" : "mobile"}.png`,
  })
})

test("분석 필터가 URL과 팀 매트릭스를 함께 갱신한다", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "single interaction pass")
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto("/analysis")
  await waitForApp(page)

  await page.getByRole("button", { name: /^필터/ }).click()
  await page.getByRole("combobox", { name: "팀" }).click()
  await page.getByRole("option", { name: "생산 2팀" }).click()
  await page.getByRole("button", { name: /^결과 보기/ }).click()

  await expect(page).toHaveURL(/team=/)
  await expect(page.getByRole("rowheader", { name: "생산 2팀" })).toBeVisible()
  await expect(page.getByRole("rowheader", { name: "생산 1팀" })).toHaveCount(0)

  const distribution = page.getByRole("region", { name: "과제별 점수 분포와 변별 폭" })
  await distribution.getByText("표로 보기", { exact: true }).click()
  await expect(
    distribution.getByRole("table", {
      name: "과제별 최소, 사분위, 중앙값, 최대 점수와 확정 인원",
    }),
  ).toBeVisible()
})

test("선택 인원 비교에서 체크 해제가 점수 레일을 즉시 갱신한다", async ({ page }, testInfo) => {
  const isDesktop = testInfo.project.name === "desktop-chromium"
  await page.setViewportSize(isDesktop ? { width: 1280, height: 900 } : { width: 375, height: 812 })
  await page.goto("/analysis")
  await waitForApp(page)

  const comparison = page.getByRole("region", { name: "개인별 평가자 점수 비교" })
  await comparison.scrollIntoViewIfNeeded()
  await expect(
    comparison.getByText("비교할 엔지니어를 하나 이상 선택해 주세요."),
  ).toBeVisible()
  const engineers = comparison.getByRole("checkbox", { name: /선택$/ })
  await engineers.nth(0).check()
  await engineers.nth(1).check()
  if (isDesktop) {
    await comparison.screenshot({
      animations: "disabled",
      path: `${OUTPUT_DIR}/evaluator-score-comparison-desktop.png`,
    })
  }
  await comparison.getByRole("button", { name: "전체 해제" }).click()
  await expect(
    comparison.getByText("비교할 엔지니어를 하나 이상 선택해 주세요."),
  ).toBeVisible()

  await engineers.first().check()
  await expect(
    comparison.getByText("비교할 엔지니어를 하나 이상 선택해 주세요."),
  ).toHaveCount(0)
  await expect(comparison.getByRole("img", { name: /평가자 원점수 범위/ })).toHaveCount(1)

  const hasPageOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )
  expect(hasPageOverflow).toBe(false)
})
