import { expect, test } from "@playwright/test"

import { clearDemoStorage, waitForApp } from "./helpers"

const OUTPUT_DIR = "C:/llmwiki/engineer-evaluation-dashboard/.omo/evidence/evaluator-residual-matrix"
const VIEWPORTS = [
  { name: "desktop-1280", width: 1280, height: 900 },
  { name: "tablet-768", width: 768, height: 1000 },
  { name: "mobile-375", width: 375, height: 812 },
] as const
const PRIORITY_EVALUATORS = ["박경철", "박상홍", "박주현"] as const

test.beforeEach(async ({ page }) => {
  await clearDemoStorage(page)
})

test("편차 매트릭스는 평균과 평가자 우선순서를 모든 검토 폭에서 유지한다", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "single responsive visual pass")
  test.setTimeout(90_000)

  for (const viewport of VIEWPORTS) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto("/analysis")
    await waitForApp(page)

    const matrix = page.getByRole("region", { name: "평가자×엔지니어 편차 매트릭스" })
    await matrix.scrollIntoViewIfNeeded()
    const table = matrix.getByRole("table")
    const headers = await table.getByRole("columnheader").allTextContents()
    const evaluatorHeaders = headers.slice(2)
    const presentPriorityEvaluators = PRIORITY_EVALUATORS.filter((name) => (
      evaluatorHeaders.includes(name)
    ))
    const remainingEvaluators = evaluatorHeaders.slice(presentPriorityEvaluators.length)

    expect(headers.slice(0, 2)).toEqual(["엔지니어", "엔지니어 평균"])
    expect(evaluatorHeaders.slice(0, presentPriorityEvaluators.length)).toEqual(
      presentPriorityEvaluators,
    )
    expect(remainingEvaluators).toEqual(
      remainingEvaluators.toSorted((left, right) => left.localeCompare(right, "ko")),
    )
    await expect(table.getByRole("cell", { name: /평균 점수 \d/ }).first()).toBeVisible()
    expect(await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    )).toBe(true)

    await page.addStyleTag({
      content: 'header.sticky, a[href="#main-content"] { visibility: hidden !important; }',
    })
    await matrix.screenshot({
      animations: "disabled",
      path: `${OUTPUT_DIR}/${viewport.name}.png`,
    })
  }
})
