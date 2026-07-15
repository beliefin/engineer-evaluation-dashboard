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
