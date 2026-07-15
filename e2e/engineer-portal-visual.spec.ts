import { expect, test, type Page } from "@playwright/test"

import { AUTH_SESSION_KEY, clearDemoStorage, loginAs, waitForApp } from "./helpers"

const OUTPUT_DIR = "C:/llmwiki/outputs/engineer-evaluation-dashboard/engineer-portal-visual-qa"
const VIEWPORTS = [
  { name: "desktop-1280", width: 1280, height: 900 },
  { name: "tablet-768", width: 768, height: 1000 },
  { name: "mobile-375", width: 375, height: 812 },
] as const

async function capture(page: Page, name: string, viewport: string, fullPage = false) {
  await page.screenshot({
    animations: "disabled",
    fullPage,
    path: `${OUTPUT_DIR}/${name}-${viewport}.png`,
  })
}

test.beforeEach(async ({ page }) => {
  await clearDemoStorage(page)
})

test("엔지니어 인증과 개인 포털의 핵심 상태를 세 가지 폭에서 캡처한다", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "single visual capture pass")
  test.setTimeout(120_000)

  for (const viewport of VIEWPORTS) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    if (page.url() !== "about:blank") {
      await page.evaluate((key) => window.localStorage.removeItem(key), AUTH_SESSION_KEY)
    }
    await page.goto("/login")
    await expect(page.getByText("engineer01", { exact: true })).toBeVisible()
    await capture(page, "login-engineer-account", viewport.name, true)

    await loginAs(page, "운영자")
    await page.goto("/accounts")
    await waitForApp(page)
    await page.getByRole("button", { name: "계정 추가" }).click()
    await page.getByLabel("역할").selectOption("engineer")
    await expect(page.getByLabel("연결 엔지니어")).toBeVisible()
    await capture(page, "account-create-engineer", viewport.name)
    await page.keyboard.press("Escape")

    await loginAs(page, "엔지니어")
    await expect(page).toHaveURL(/\/my$/)
    await expect(page.getByRole("heading", { name: "샘플 엔지니어 01" })).toBeVisible()
    await capture(page, "engineer-portal", viewport.name, true)

    await page.getByRole("button", { name: "어학 성적 추가" }).click()
    await expect(page.getByRole("dialog", { name: "어학 성적 추가" })).toBeVisible()
    await capture(page, "engineer-language-dialog", viewport.name)
    await page.keyboard.press("Escape")

    await page.getByRole("button", { name: "자격증 추가" }).click()
    await expect(page.getByRole("dialog", { name: "자격증 추가" })).toBeVisible()
    await capture(page, "engineer-certification-dialog", viewport.name)
    await page.keyboard.press("Escape")
  }
})
