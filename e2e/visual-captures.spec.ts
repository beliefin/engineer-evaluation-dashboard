import { expect, test, type Page } from "@playwright/test"

import {
  AUTH_SESSION_KEY,
  clearDemoStorage,
  loginAs,
  switchRole,
  waitForApp,
} from "./helpers"

const OUTPUT_DIR = "C:/llmwiki/outputs/engineer-evaluation-dashboard/visual-qa"
const REFERENCE_OUTPUT =
  "C:/llmwiki/outputs/engineer-evaluation-dashboard/reference-compare/dashboard-1504x1046.png"
const VIEWPORTS = [
  { name: "desktop-1440", width: 1440, height: 1000 },
  { name: "tablet-768", width: 768, height: 1000 },
  { name: "mobile-390", width: 390, height: 844 },
] as const
const REVIEW_VIEWPORTS = [
  { name: "tablet-768", width: 768, height: 1000 },
  { name: "desktop-1280", width: 1280, height: 900 },
  { name: "mobile-375", width: 375, height: 812 },
] as const

const OPERATOR_ROUTES = [
  { name: "dashboard", path: "/dashboard" },
  { name: "engineer-detail", path: "/engineers/engineer-01" },
  { name: "analysis", path: "/analysis" },
  { name: "operator-evaluations", path: "/evaluations" },
  { name: "pending", path: "/pending" },
  { name: "calendar", path: "/calendar" },
  { name: "operations", path: "/operations" },
] as const

const EVALUATOR_ROUTES = [
  { name: "evaluations", path: "/evaluations" },
  { name: "evaluation-form", path: "/evaluations/engineer-13-task-dx-tool-evaluator-01" },
] as const

async function capture(page: Page, name: string, viewportName: string): Promise<void> {
  await page.screenshot({
    path: `${OUTPUT_DIR}/${name}-${viewportName}.png`,
    fullPage: false,
    animations: "disabled",
  })
}

async function captureFullPage(page: Page, name: string, viewportName: string): Promise<void> {
  const fullPageStyle = await page.addStyleTag({
    content: '[data-testid="score-form-actions"] { position: static !important; }',
  })
  const needsFullPageCapture = await page.evaluate(
    () => document.documentElement.scrollHeight > window.innerHeight,
  )
  await page.screenshot({
    path: `${OUTPUT_DIR}/${name}-${viewportName}-full.png`,
    fullPage: needsFullPageCapture,
    animations: "disabled",
  })
  await fullPageStyle.evaluate((style) => style.parentNode?.removeChild(style))
}

async function waitForRouteContent(page: Page): Promise<void> {
  await page.locator("main h1").first().waitFor()
}

test.beforeEach(async ({ page }) => {
  await clearDemoStorage(page)
})

test("로그인과 계정 관리 화면을 1280, 768, 375 폭에서 캡처한다", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "single auth capture pass")
  for (const viewport of REVIEW_VIEWPORTS) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    if (page.url() !== "about:blank") {
      await page.evaluate((sessionKey) => window.localStorage.removeItem(sessionKey), AUTH_SESSION_KEY)
    }
    await page.goto("/login")
    await page.getByRole("heading", { name: "역량평가 시스템 로그인" }).waitFor()
    await expect(page.getByRole("button", { name: "로그인" })).toBeEnabled()
    await capture(page, "login", viewport.name)
    await captureFullPage(page, "login", viewport.name)

    await page.getByLabel("아이디").fill("operator")
    await page.getByLabel("비밀번호").fill("wrong-password")
    await page.getByRole("button", { name: "로그인" }).click()
    await expect(page.getByText("아이디 또는 비밀번호가 일치하지 않습니다.", { exact: true })).toBeVisible()
    await expect(page.getByLabel("비밀번호")).toHaveValue("")
    await expect(page.getByRole("button", { name: "로그인" })).toBeEnabled()
    await capture(page, "login-error", viewport.name)
    await captureFullPage(page, "login-error", viewport.name)

    await loginAs(page, "운영자")
    await page.goto("/accounts")
    await waitForApp(page)
    await page.getByRole("heading", { level: 1, name: "계정 관리" }).waitFor()
    await capture(page, "accounts", viewport.name)
    await captureFullPage(page, "accounts", viewport.name)
    await page.getByRole("button", { name: "계정 추가" }).click()
    await page.getByRole("dialog", { name: "계정 추가" }).waitFor()
    await capture(page, "account-create-dialog", viewport.name)
    await page.getByLabel("역할").selectOption("evaluator")
    await capture(page, "account-create-evaluator-dialog", viewport.name)
    await page.getByRole("button", { name: "계정 저장" }).click()
    await page.getByTestId("account-evaluator-error").waitFor()
    await capture(page, "account-create-error-dialog", viewport.name)
    await page.keyboard.press("Escape")

    await page.getByRole("button", { name: /계정 편집$/ }).first().click()
    await page.getByRole("dialog", { name: "계정 편집" }).waitFor()
    await capture(page, "account-edit-dialog", viewport.name)
    await page.keyboard.press("Escape")

    await page.getByRole("button", { name: /비밀번호 재설정$/ }).first().click()
    await page.getByRole("dialog", { name: "비밀번호 재설정" }).waitFor()
    await capture(page, "account-password-dialog", viewport.name)
    await page.getByLabel("새 비밀번호", { exact: true }).fill("short")
    await page.getByRole("button", { name: "비밀번호 저장" }).click()
    await page.getByText("비밀번호는 8자 이상 입력해 주세요.", { exact: true }).waitFor()
    await capture(page, "account-password-error-dialog", viewport.name)
    await page.keyboard.press("Escape")

    await page.getByRole("button", { name: "샘플 평가자 01 계정 비활성화" }).click()
    await page.getByRole("dialog", { name: "계정을 비활성화할까요?" }).waitFor()
    await capture(page, "account-toggle-dialog", viewport.name)
    await page.keyboard.press("Escape")

    await page.getByRole("button", { name: /계정 삭제$/ }).first().click()
    await page.getByRole("dialog", { name: "계정을 삭제할까요?" }).waitFor()
    await capture(page, "account-delete-dialog", viewport.name)
    await page.keyboard.press("Escape")
  }
})

test("모든 페이지를 1440, 768, 390 폭에서 캡처한다", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "single capture pass")
  test.setTimeout(120_000)
  for (const viewport of VIEWPORTS) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto("/dashboard")
    await waitForApp(page)
    await switchRole(page, "운영자")
    for (const route of OPERATOR_ROUTES) {
      await page.goto(route.path)
      await waitForApp(page)
      await waitForRouteContent(page)
      await capture(page, route.name, viewport.name)
      await captureFullPage(page, route.name, viewport.name)
    }

    await page.goto("/dashboard")
    await switchRole(page, "평가자")
    for (const route of EVALUATOR_ROUTES) {
      await page.goto(route.path)
      await waitForApp(page)
      await waitForRouteContent(page)
      await capture(page, route.name, viewport.name)
      await captureFullPage(page, route.name, viewport.name)
    }
  }
})

test("모바일 필터 Sheet와 평가 폼 하단 고정 액션을 캡처한다", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "single interaction capture pass")
  test.setTimeout(120_000)
  await page.setViewportSize({ width: 390, height: 844 })

  await page.goto("/analysis")
  await waitForApp(page)
  await page.getByRole("button", { name: /^필터/ }).click()
  await page.getByRole("heading", { name: "분석 필터" }).last().waitFor()
  await capture(page, "analysis-filter-sheet", "mobile-390")

  await page.keyboard.press("Escape")
  await switchRole(page, "평가자")
  await page.goto("/evaluations")
  await waitForApp(page)
  await page.getByRole("button", { name: /^필터/ }).click()
  await page.getByRole("heading", { name: "배정 평가 필터" }).waitFor()
  await capture(page, "evaluations-filter-sheet", "mobile-390")

  await page.keyboard.press("Escape")
  await page.goto("/evaluations/engineer-13-task-dx-tool-evaluator-01")
  await waitForApp(page)
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await capture(page, "evaluation-form-sticky-bottom", "mobile-390")
})

test("운영 과제 구성 화면을 세 가지 폭에서 캡처한다", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "single operations capture pass")
  test.setTimeout(120_000)
  for (const viewport of VIEWPORTS) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto("/operations")
    await waitForApp(page)
    await page.getByRole("tab", { name: "과제 구성" }).click()
    await page.getByRole("heading", { name: "시즌 과제 구성" }).waitFor()
    await capture(page, "operations-tasks", viewport.name)
    await captureFullPage(page, "operations-tasks", viewport.name)
    await page.getByRole("button", { name: "과제 추가" }).click()
    await capture(page, "operations-task-dialog", viewport.name)
    await page.keyboard.press("Escape")
  }
})

test("개인별 가중치의 기본·오류·저장 상태를 세 가지 폭에서 캡처한다", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "single weight capture pass")
  for (const viewport of REVIEW_VIEWPORTS) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto("/operations?tab=weights")
    await waitForApp(page)
    await page.getByRole("heading", { name: "개인별 과제 가중치" }).waitFor()
    await capture(page, "operations-weights", viewport.name)
    await captureFullPage(page, "operations-weights", viewport.name)

    const otsWeight = page.getByRole("spinbutton", { name: "OTS 시나리오 제작 가중치" })
    const dxWeight = page.getByRole("spinbutton", { name: "DX 툴 활용 가중치" })
    await otsWeight.fill("20")
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(300)
    await capture(page, "operations-weights-invalid", viewport.name)
    await otsWeight.fill("35")
    await dxWeight.fill("0")
    await page.getByRole("button", { name: "개인별 가중치 저장" }).click()
    await page.getByText("개인별 과제 가중치를 저장했습니다.").waitFor()
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(300)
    const toastStyle = await page.addStyleTag({
      content: '[data-sonner-toaster] { display: none !important; }',
    })
    await capture(page, "operations-weights-saved", viewport.name)
    await toastStyle.evaluate((style) => style.parentNode?.removeChild(style))
    await page.evaluate(() => window.localStorage.clear())
  }
})

test("추가 운영 화면과 입력 대화상자를 1280, 768, 375 폭에서 캡처한다", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "single review capture pass")
  for (const viewport of REVIEW_VIEWPORTS) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })

    await page.goto("/pending")
    await waitForApp(page)
    await waitForRouteContent(page)
    await capture(page, "pending-review", viewport.name)

    await page.goto("/calendar")
    await waitForApp(page)
    await waitForRouteContent(page)
    await capture(page, "calendar-review", viewport.name)
    await page.getByRole("button", { name: "일정 추가" }).click()
    await capture(page, "calendar-dialog", viewport.name)
    await page.keyboard.press("Escape")

    await page.goto("/operations")
    await waitForApp(page)
    await waitForRouteContent(page)
    await capture(page, "roster-review", viewport.name)
    await page.getByRole("button", { name: "엔지니어 일괄 등록" }).click()
    await capture(page, "roster-bulk-dialog", viewport.name)
    await page.keyboard.press("Escape")

    await page.goto("/operations?tab=cycle")
    await waitForRouteContent(page)
    await capture(page, "cycle-review", viewport.name)
    await page.getByRole("button", { name: "평가 시즌 만들기" }).click()
    await capture(page, "cycle-create-dialog", viewport.name)
    await page.keyboard.press("Escape")

    await page.goto("/operations?tab=scores")
    await waitForRouteContent(page)
    await capture(page, "source-record-review", viewport.name)
    await captureFullPage(page, "source-record-review", viewport.name)
    await page.getByRole("button", { name: "어학 성적 추가" }).click()
    await capture(page, "language-record-dialog", viewport.name)
    await page.keyboard.press("Escape")
  }
})

test("방향성 참고 이미지의 원본 해상도로 대시보드를 캡처한다", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "single reference pass")
  await page.setViewportSize({ width: 1504, height: 1046 })
  await page.goto("/dashboard")
  await waitForApp(page)
  await switchRole(page, "운영자")
  await page.screenshot({
    animations: "disabled",
    fullPage: false,
    path: REFERENCE_OUTPUT,
  })
})
