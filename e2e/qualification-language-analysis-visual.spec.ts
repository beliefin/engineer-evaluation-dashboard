import { expect, test } from "@playwright/test"

import { clearDemoStorage, waitForApp } from "./helpers"

const OUTPUT_DIR =
  "C:/llmwiki/engineer-evaluation-dashboard/.omo/evidence/qualification-language-analysis"
const VIEWPORTS = [
  { name: "desktop-1280", width: 1280, height: 900 },
  { name: "desktop-1024", width: 1024, height: 900 },
  { name: "tablet-768", width: 768, height: 1000 },
  { name: "mobile-375", width: 375, height: 812 },
] as const

test.describe.configure({ mode: "serial" })

test.beforeEach(async ({ page }) => {
  await clearDemoStorage(page)
})

test("자격증과 어학 원천 내역을 세 화면 폭에서 읽을 수 있다", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "single responsive capture pass")
  test.setTimeout(90_000)

  for (const viewport of VIEWPORTS) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto("/analysis")
    await waitForApp(page)

    const section = page.getByRole("region", { name: "자격·어학 원천 내역" })
    await section.scrollIntoViewIfNeeded()
    await expect(section.getByRole("heading", { name: "보유 자격증 분포" })).toBeVisible()
    await expect(section.getByRole("heading", { name: "어학 시험·성적 분포" })).toBeVisible()
    await expect(section.getByRole("table", { name: "자격증별 보유 및 평가연도 신규 취득 인원" })).toBeVisible()
    await expect(section.getByRole("table", { name: "어학 시험과 성적별 보유 인원" })).toBeVisible()

    const hasPageOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    )
    expect(hasPageOverflow).toBe(false)

    await page.locator("header.sticky").evaluate((element) => {
      element.setAttribute("style", "display: none")
    })
    await page.locator('a[href="#main-content"]').evaluate((element) => {
      element.setAttribute("style", "display: none")
    })
    await section.screenshot({
      animations: "disabled",
      path: `${OUTPUT_DIR}/${viewport.name}.png`,
    })
  }
})
