import { expect, test, type Page } from "@playwright/test"

import { AUTH_SESSION_KEY, clearDemoStorage } from "./helpers"

const OUTPUT_DIR = "C:/llmwiki/outputs/engineer-evaluation-dashboard/manual/screenshots"

async function dismissInitialPasswordChange(page: Page): Promise<void> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const button = page.getByRole("button", { name: "나중에 변경" })
    if (!await button.isVisible().catch(() => false)) return
    await button.click({ force: true }).catch(() => undefined)
    await page.waitForTimeout(200)
  }
}

async function login(page: Page, username: string): Promise<void> {
  if (page.url() !== "about:blank") {
    await page.evaluate((key) => window.localStorage.removeItem(key), AUTH_SESSION_KEY)
  }
  await page.goto("/login")
  await page.getByLabel("아이디").fill(username)
  await page.getByLabel("비밀번호").fill("Demo!2026")
  await page.getByRole("button", { name: "로그인" }).click()
  await page.getByText("샘플 데이터", { exact: true }).first().waitFor()
  await dismissInitialPasswordChange(page)
}

async function waitForScreen(page: Page): Promise<void> {
  await page.getByText("샘플 데이터", { exact: true }).first().waitFor()
  await page.locator("main h1").first().waitFor()
  await dismissInitialPasswordChange(page)
  await page.waitForTimeout(350)
}

async function capture(page: Page, filename: string): Promise<void> {
  await page.screenshot({
    path: `${OUTPUT_DIR}/${filename}`,
    fullPage: false,
    animations: "disabled",
  })
}

test.beforeEach(async ({ page }) => {
  await clearDemoStorage(page)
})

test("제출 결과서용 핵심 화면을 샘플 모드에서 캡처한다", async ({ page }) => {
  test.setTimeout(180_000)
  await page.setViewportSize({ width: 1440, height: 900 })

  await page.goto("/login")
  await page.getByRole("heading", { name: "역량평가 시스템 로그인" }).waitFor()
  await capture(page, "01-login.png")

  await login(page, "operator")
  await page.goto("/dashboard")
  await waitForScreen(page)
  await expect(page.getByRole("heading", { name: "엔지니어별 평가 현황" })).toBeVisible()
  await capture(page, "02-operator-dashboard.png")

  await page.goto("/operations?tab=tasks")
  await waitForScreen(page)
  await page.getByRole("tab", { name: "과제 구성" }).click()
  await page.getByRole("heading", { name: "시즌 과제 구성" }).waitFor()
  await capture(page, "03-operations-task-configuration.png")

  await page.goto("/analysis")
  await waitForScreen(page)
  await capture(page, "04-analysis-overview.png")
  const reliabilityHeading = page.getByText("평가자 신뢰도", { exact: false }).first()
  if (await reliabilityHeading.isVisible().catch(() => false)) {
    await reliabilityHeading.scrollIntoViewIfNeeded()
    await page.waitForTimeout(300)
    await capture(page, "05-analysis-reliability.png")
  }

  await page.goto("/reports/season")
  await waitForScreen(page)
  await expect(page.getByRole("heading", { name: "평가 데이터 Excel 출력" })).toBeVisible()
  await capture(page, "06-season-report-export.png")

  await page.goto("/accounts")
  await waitForScreen(page)
  await capture(page, "07-account-management.png")

  await page.goto("/maintenance")
  await waitForScreen(page)
  await capture(page, "08-maintenance-audit.png")

  await login(page, "evaluator01")
  await page.goto("/evaluations/detail?assignmentId=engineer-16-task-ots-scenario-evaluator-01")
  await waitForScreen(page)
  await capture(page, "09-evaluator-score-entry-desktop.png")

  await page.setViewportSize({ width: 390, height: 844 })
  await page.reload()
  await waitForScreen(page)
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(300)
  await capture(page, "10-evaluator-score-entry-mobile.png")

  await page.setViewportSize({ width: 1440, height: 900 })
  await login(page, "engineer01")
  await page.goto("/my")
  await waitForScreen(page)
  await capture(page, "11-engineer-my-results.png")
})
