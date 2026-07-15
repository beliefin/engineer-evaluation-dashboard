import { expect, test } from "@playwright/test"

import { clearDemoStorage, loginAs } from "./helpers"

test.beforeEach(async ({ page }) => {
  await clearDemoStorage(page)
})

test("로그인 실패를 알리고 올바른 운영자 계정을 역할 홈으로 보낸다", async ({ page }) => {
  await page.goto("/dashboard")
  await expect(page.getByRole("heading", { name: "역량평가 시스템 로그인" })).toBeVisible()

  await page.getByLabel("아이디").fill("operator")
  await page.getByLabel("비밀번호").fill("Wrong!2026")
  await page.getByRole("button", { name: "로그인" }).click()
  await expect(page.getByRole("alert")).toBeVisible()

  await page.getByLabel("비밀번호").fill("Demo!2026")
  await page.getByRole("button", { name: "로그인" }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(page.getByRole("heading", { name: "전체 현황" })).toBeVisible()
})

test("평가자 계정은 본인 평가만 보고 운영자 계정 관리에 접근하지 못한다", async ({ page }) => {
  await page.goto("/login")
  await loginAs(page, "평가자")

  await expect(page).toHaveURL(/\/evaluations$/)
  await expect(page.getByRole("link", { name: /계정 관리/ })).toHaveCount(0)
  await page.goto("/accounts")
  await expect(page.getByRole("heading", { name: "접근 권한이 없습니다" })).toBeVisible()
})

test("운영자가 새 승인자 계정을 만들고 해당 계정으로 로그인한다", async ({ page }) => {
  await page.goto("/login")
  await loginAs(page, "운영자")
  await page.goto("/accounts")
  await page.getByRole("button", { name: "계정 추가" }).click()
  await page.getByLabel("아이디").fill("reviewer01")
  await page.getByLabel("표시 이름").fill("검토 승인자")
  await page.getByLabel("역할").selectOption("approver")
  await page.getByLabel("초기 비밀번호").fill("Review!2026")
  await page.getByRole("button", { name: "계정 저장" }).click()
  await expect(page.getByText("reviewer01", { exact: true })).toBeVisible()

  if ((page.viewportSize()?.width ?? 1440) < 1024) {
    await page.getByRole("button", { name: "메뉴 열기" }).click()
  }
  await page.getByRole("button", { name: /로그아웃/ }).click()
  await page.getByLabel("아이디").fill("reviewer01")
  await page.getByLabel("비밀번호").fill("Review!2026")
  await page.getByRole("button", { name: "로그인" }).click()

  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(page.getByRole("link", { name: /운영 설정/ })).toHaveCount(0)
  await expect(page.getByRole("link", { name: /계정 관리/ })).toHaveCount(0)
})

test("운영자가 엔지니어 계정을 명단과 연결해 개인 포털을 발급한다", async ({ page }) => {
  await page.goto("/login")
  await loginAs(page, "운영자")
  await page.goto("/accounts")
  await page.getByRole("button", { name: "계정 추가" }).click()
  await page.getByLabel("아이디").fill("engineer02")
  await page.getByLabel("표시 이름").fill("샘플 엔지니어 02")
  await page.getByLabel("역할").selectOption("engineer")
  await page.getByLabel("연결 엔지니어").selectOption("engineer-02")
  await page.getByLabel("초기 비밀번호").fill("Engineer!2026")
  await page.getByRole("button", { name: "계정 저장" }).click()
  await expect(page.getByText("engineer02", { exact: true })).toBeVisible()

  if ((page.viewportSize()?.width ?? 1440) < 1024) {
    await page.getByRole("button", { name: "메뉴 열기" }).click()
  }
  await page.getByRole("button", { name: /로그아웃/ }).click()
  await page.getByLabel("아이디").fill("engineer02")
  await page.getByLabel("비밀번호").fill("Engineer!2026")
  await page.getByRole("button", { name: "로그인" }).click()

  await expect(page).toHaveURL(/\/my$/)
  await expect(page.getByRole("heading", { name: "샘플 엔지니어 02" })).toBeVisible()
})
