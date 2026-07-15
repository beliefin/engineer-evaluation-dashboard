import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"

import { clearDemoStorage, loginAs, switchRole, waitForApp } from "./helpers"

const ROUTES = [
  "/dashboard",
  "/engineers/engineer-01",
  "/analysis",
  "/evaluations",
  "/pending",
  "/calendar",
  "/operations",
  "/accounts",
] as const

async function expectNoCriticalViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page }).analyze()
  const critical = results.violations.filter(
    (violation) => violation.impact === "critical" || violation.impact === "serious",
  )
  expect(critical, JSON.stringify(critical, null, 2)).toEqual([])
}

test.beforeEach(async ({ page }) => {
  await clearDemoStorage(page)
})

for (const route of ROUTES) {
  test(`${route} 운영 화면에 치명적 접근성 오류가 없다`, async ({ page }) => {
    await page.goto(route)
    await waitForApp(page)
    await expectNoCriticalViolations(page)
  })
}

test("/operations 평가 과제 탭에 치명적 접근성 오류가 없다", async ({ page }) => {
  await page.goto("/operations")
  await waitForApp(page)
  await page.getByRole("tab", { name: "과제 구성" }).click()
  await page.getByRole("heading", { name: "시즌 과제 구성" }).waitFor()
  await expectNoCriticalViolations(page)
})

test("/operations 개인별 가중치 탭에 치명적 접근성 오류가 없다", async ({ page }) => {
  await page.goto("/operations?tab=weights")
  await waitForApp(page)
  await page.getByRole("heading", { name: "개인별 과제 가중치" }).waitFor()
  await expectNoCriticalViolations(page)
})

test("/operations 시즌 생성 화면에 치명적 접근성 오류가 없다", async ({ page }) => {
  await page.goto("/operations?tab=cycle")
  await waitForApp(page)
  await expectNoCriticalViolations(page)
  await page.getByRole("button", { name: "평가 시즌 만들기" }).click()
  await expectNoCriticalViolations(page)
})

test("/operations 원천 실적 화면에 치명적 접근성 오류가 없다", async ({ page }) => {
  await page.goto("/operations?tab=scores")
  await waitForApp(page)
  await expectNoCriticalViolations(page)
  await page.getByRole("button", { name: "어학 성적 추가" }).click()
  await expectNoCriticalViolations(page)
})

test("/login 기본·오류 상태에 치명적 접근성 오류가 없다", async ({ page }) => {
  await page.goto("/login")
  await page.getByRole("heading", { name: "역량평가 시스템 로그인" }).waitFor()
  await expectNoCriticalViolations(page)
  await page.getByLabel("아이디").fill("operator")
  await page.getByLabel("비밀번호").fill("wrong-password")
  await page.getByRole("button", { name: "로그인" }).click()
  await page.getByRole("alert").waitFor()
  await expectNoCriticalViolations(page)
})

test("/accounts 계정 추가 화면에 치명적 접근성 오류가 없다", async ({ page }) => {
  await page.goto("/accounts")
  await waitForApp(page)
  await page.getByRole("button", { name: "계정 추가" }).click()
  await page.getByRole("dialog", { name: "계정 추가" }).waitFor()
  await expectNoCriticalViolations(page)
})

test("/my 엔지니어 포털과 원천 실적 Dialog에 치명적 접근성 오류가 없다", async ({ page }) => {
  await page.goto("/login")
  await loginAs(page, "엔지니어")
  await expectNoCriticalViolations(page)

  await page.getByRole("button", { name: "어학 성적 추가" }).click()
  await expectNoCriticalViolations(page)
  await page.keyboard.press("Escape")

  await page.getByRole("button", { name: "자격증 추가" }).click()
  await expectNoCriticalViolations(page)
})

for (const route of [
  "/evaluations",
  "/evaluations/engineer-13-task-dx-tool-evaluator-01",
] as const) {
  test(`${route} 평가자 화면에 치명적 접근성 오류가 없다`, async ({ page }) => {
    await page.goto("/dashboard")
    await waitForApp(page)
    await switchRole(page, "평가자")
    await page.goto(route)
    await expectNoCriticalViolations(page)
  })
}
