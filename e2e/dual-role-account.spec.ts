import { expect, test, type Page } from "@playwright/test"

import { AUTH_SESSION_KEY, clearDemoStorage, loginAs, waitForApp } from "./helpers"

const OUTPUT_DIR = "C:/llmwiki/outputs/engineer-evaluation-dashboard/dual-role-visual-qa"

async function createDualRoleAccount(page: Page): Promise<void> {
  await page.goto("/login")
  await loginAs(page, "운영자")
  await page.goto("/accounts")
  await waitForApp(page)
  await page.getByRole("button", { name: "계정 추가" }).click()
  await page.getByLabel("아이디").fill("dual-evaluator")
  await page.getByLabel("표시 이름").fill("평가받는 평가자")
  await page.getByLabel("역할").selectOption("evaluator_engineer")
  await page.getByLabel("연결 평가자").selectOption("evaluator-01")
  await page.getByLabel("연결 엔지니어").selectOption("engineer-01")
  await page.getByLabel("초기 비밀번호").fill("31019467")
  await page.getByRole("button", { name: "계정 저장" }).click()
  await expect(page.getByRole("dialog", { name: "계정 추가" })).toBeHidden()
}

async function loginDualRoleAccount(page: Page): Promise<void> {
  await page.evaluate((sessionKey) => window.localStorage.removeItem(sessionKey), AUTH_SESSION_KEY)
  await page.goto("/login")
  await page.getByLabel("아이디").fill("dual-evaluator")
  await page.getByLabel("비밀번호").fill("31019467")
  await page.getByRole("button", { name: "로그인" }).click()
  await expect(page).toHaveURL(/\/today$/)
  await waitForApp(page)
}

test.beforeEach(async ({ page }) => {
  await clearDemoStorage(page)
})

test("복합 계정을 만들고 평가자와 엔지니어 모드를 전환한다", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "single responsive capture pass")
  test.setTimeout(120_000)

  await page.setViewportSize({ width: 1440, height: 1000 })
  await createDualRoleAccount(page)
  await page.getByRole("button", { name: "계정 추가" }).click()
  await page.getByLabel("역할").selectOption("evaluator_engineer")
  await page.screenshot({ animations: "disabled", path: `${OUTPUT_DIR}/01-account-dual-desktop.png` })
  await page.keyboard.press("Escape")

  await loginDualRoleAccount(page)
  const desktopMode = page.getByLabel("사용 모드")
  await expect(desktopMode).toHaveValue("evaluator")
  await page.screenshot({ animations: "disabled", path: `${OUTPUT_DIR}/02-evaluator-mode-desktop.png` })
  await desktopMode.selectOption("engineer")
  await expect(page).toHaveURL(/\/my$/)
  await expect(page.getByRole("heading", { name: "샘플 엔지니어 01" })).toBeVisible()
  await page.screenshot({ animations: "disabled", path: `${OUTPUT_DIR}/03-engineer-mode-desktop.png` })

  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole("button", { name: "메뉴 열기" }).click()
  const mobileMode = page.locator("#mobile-shell-role")
  await expect(mobileMode).toHaveValue("engineer")
  await page.screenshot({ animations: "disabled", path: `${OUTPUT_DIR}/04-engineer-mode-mobile-menu.png` })
  await mobileMode.selectOption("evaluator")
  await expect(page).toHaveURL(/\/today$/)
  await page.getByRole("button", { name: "메뉴 열기" }).click()
  await expect(page.locator("#mobile-shell-role")).toHaveValue("evaluator")
  await page.screenshot({ animations: "disabled", path: `${OUTPUT_DIR}/05-evaluator-mode-mobile-menu.png` })
})
