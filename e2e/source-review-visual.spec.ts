import { expect, test, type Page } from "@playwright/test"

import { clearDemoStorage, loginAs, waitForApp } from "./helpers"

const OUTPUT_DIR = "C:/llmwiki/outputs/engineer-evaluation-dashboard/source-review-visual-qa"
const VIEWPORTS = [
  { name: "desktop-1280", width: 1280, height: 900 },
  { name: "tablet-768", width: 768, height: 1000 },
  { name: "mobile-375", width: 375, height: 812 },
] as const

async function captureRelevantViewport(page: Page, name: string, viewport: string) {
  await page.screenshot({
    animations: "disabled",
    path: `${OUTPUT_DIR}/${name}-${viewport}.png`,
  })
}

test.beforeEach(async ({ page }) => {
  await clearDemoStorage(page)
})

test("엔지니어 입력 검토 대기 흐름을 두 역할과 세 가지 폭에서 캡처한다", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "single visual capture pass")
  test.setTimeout(120_000)

  await page.goto("/login")
  await loginAs(page, "엔지니어")
  await page.getByRole("button", { name: "어학 성적 추가" }).click()
  await page.getByLabel("시험명").fill("TEPS")
  await page.getByLabel("점수 또는 등급").fill("410")
  await page.getByLabel("취득일").fill("2026-07-02")
  await page.getByRole("button", { name: "저장" }).click()

  for (const viewport of VIEWPORTS) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await loginAs(page, "엔지니어")
    const personalRecords = page.getByRole("heading", { name: "내 어학·자격증 실적" })
    await personalRecords.scrollIntoViewIfNeeded()
    const engineerPendingBadge = page.getByText("운영자 검토 대기", { exact: true }).last()
    await expect(engineerPendingBadge).toBeVisible()
    await engineerPendingBadge.scrollIntoViewIfNeeded()
    await captureRelevantViewport(page, "engineer-review-pending", viewport.name)

    await loginAs(page, "운영자")
    await page.goto("/operations?tab=scores")
    await waitForApp(page)
    const sourceRecords = page.getByRole("heading", { name: "어학·자격증 원천 실적" })
    await sourceRecords.scrollIntoViewIfNeeded()
    await expect(page.getByText("검토 대기 1건")).toBeVisible()
    await page.getByText("운영자 검토 대기", { exact: true }).last().scrollIntoViewIfNeeded()
    await captureRelevantViewport(page, "operator-review-queue", viewport.name)
  }
})
