import { mkdir } from "node:fs/promises"

import { expect, test, type Page } from "@playwright/test"

import { clearDemoStorage } from "./helpers"

const OUTPUT_DIR = "C:/llmwiki/engineer-evaluation-dashboard/.omo/evidence/progress-status-colors"
const VIEWPORTS = [
  { name: "desktop-1280", width: 1280, height: 900 },
  { name: "tablet-768", width: 768, height: 1000 },
  { name: "mobile-390", width: 390, height: 844 },
] as const

async function progressSection(page: Page) {
  const section = page.getByRole("heading", { name: "엔지니어별 평가 현황" }).locator("xpath=ancestor::section")
  await section.scrollIntoViewIfNeeded()
  return section
}

async function hideGlobalChromeForSectionCapture(page: Page): Promise<void> {
  await page.addStyleTag({
    content: 'header, a[href="#main-content"] { visibility: hidden !important; }',
  })
}

async function openDashboard(page: Page): Promise<void> {
  await page.goto("/dashboard")

  const loginButton = page.getByRole("button", { name: "로그인" })
  const sampleBadge = page.getByText("샘플 데이터", { exact: true }).first()
  await Promise.race([loginButton.waitFor(), sampleBadge.waitFor()])
  if (await loginButton.isVisible()) {
    await page.getByLabel("아이디").fill("operator")
    await page.getByLabel("비밀번호").fill("Demo!2026")
    await loginButton.click()
  }

  await sampleBadge.waitFor()
  const postponePasswordChange = page.getByRole("button", { name: "나중에 변경" })
  if (await postponePasswordChange.isVisible()) {
    await postponePasswordChange.click({ force: true }).catch(() => undefined)
  }
}

test.beforeAll(async () => {
  await mkdir(OUTPUT_DIR, { recursive: true })
})

test.beforeEach(async ({ page }) => {
  await clearDemoStorage(page)
})

test("평가 상태 타일을 세 가지 폭에서 분명하게 구분한다", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "single visual verification pass")

  for (const viewport of VIEWPORTS) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await openDashboard(page)

    const section = await progressSection(page)
    await expect(section.getByText("평가 완료", { exact: true }).first()).toBeVisible()
    await expect(section.getByText("진행 중", { exact: true }).first()).toBeVisible()
    await expect(section.getByText("미진행", { exact: true }).first()).toBeVisible()
    await expect(section.getByText("해당 없음", { exact: true }).first()).toBeVisible()
    await expect(
      page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth),
    ).resolves.toBe(false)
    await page.evaluate(() => {
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    })
    await hideGlobalChromeForSectionCapture(page)
    await section.screenshot({
      animations: "disabled",
      path: `${OUTPUT_DIR}/${viewport.name}.png`,
    })
  }

  await page.setViewportSize({ width: 1280, height: 900 })
  await openDashboard(page)
  const desktopSection = await progressSection(page)
  const tileColors = await desktopSection.locator("tbody td").evaluateAll(
    (cells) => cells.map((cell) => getComputedStyle(cell).backgroundColor),
  )

  expect(tileColors).toContain("rgb(217, 236, 223)")
  expect(tileColors).toContain("rgb(246, 229, 197)")
  expect(tileColors).toContain("rgb(245, 222, 221)")
  expect(tileColors).toContain("rgb(225, 231, 235)")
})
