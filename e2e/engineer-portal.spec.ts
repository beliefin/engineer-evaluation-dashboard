import { expect, test } from "@playwright/test"

import { clearDemoStorage, loginAs, waitForApp } from "./helpers"

test.beforeEach(async ({ page }) => {
  await clearDemoStorage(page)
})

test("엔지니어가 본인 점수를 확인하고 어학·자격증 실적을 저장한다", async ({ page }) => {
  await page.goto("/login")
  await loginAs(page, "엔지니어")

  await expect(page).toHaveURL(/\/my$/)
  await expect(page.getByRole("heading", { name: "샘플 엔지니어 01" })).toBeVisible()
  await expect(page.getByRole("heading", { name: "분야별 점수" })).toBeVisible()
  if ((page.viewportSize()?.width ?? 1440) < 1024) {
    await page.getByRole("button", { name: "메뉴 열기" }).click()
    await expect(page.getByRole("link", { name: /내 평가/ })).toBeVisible()
    await expect(page.getByRole("link", { name: /전체 현황/ })).toHaveCount(0)
    await page.getByRole("button", { name: "메뉴 닫기" }).click()
  } else {
    await expect(page.getByRole("link", { name: /내 평가/ })).toBeVisible()
    await expect(page.getByRole("link", { name: /전체 현황/ })).toHaveCount(0)
  }

  await page.getByRole("button", { name: "어학 성적 추가" }).click()
  await page.getByLabel("시험명").fill("TOEFL iBT")
  await page.getByLabel("점수 또는 등급").fill("102")
  await page.getByLabel("취득일").fill("2026-07-01")
  await page.getByRole("button", { name: "저장" }).click()
  await expect(page.getByText("TOEFL iBT", { exact: true })).toBeVisible()
  await expect(page.getByText("102", { exact: true })).toBeVisible()

  await page.getByRole("button", { name: "자격증 추가" }).click()
  await page.getByLabel("자격증명").fill("가스기사")
  await page.getByLabel("등급 또는 구분").fill("기사")
  await page.getByLabel("발급기관").fill("한국산업인력공단")
  await page.getByRole("button", { name: "저장" }).click()
  await expect(page.getByText("가스기사", { exact: true })).toBeVisible()

  await page.reload()
  await expect(page.getByText("TOEFL iBT", { exact: true })).toBeVisible()
  await expect(page.getByText("가스기사", { exact: true })).toBeVisible()

  await page.goto("/dashboard")
  await expect(page.getByRole("heading", { name: "접근 권한이 없습니다" })).toBeVisible()
})

test("운영자가 본인 입력 실적을 검토하면 엔지니어 수정 전까지 완료 상태가 유지된다", async ({ page }) => {
  // Given
  await page.goto("/login")
  await loginAs(page, "엔지니어")
  await page.getByRole("button", { name: "어학 성적 추가" }).click()
  await page.getByLabel("시험명").fill("TEPS")
  await page.getByLabel("점수 또는 등급").fill("410")
  await page.getByLabel("취득일").fill("2026-07-02")
  await page.getByRole("button", { name: "저장" }).click()
  await expect(page.getByText("운영자 검토 대기")).toBeVisible()

  // When
  await loginAs(page, "운영자")
  await page.goto("/operations?tab=scores")
  await waitForApp(page)
  await expect(page.getByText("검토 대기 1건")).toBeVisible()
  await page.getByRole("button", {
    name: "샘플 엔지니어 01 TEPS 어학 성적 검토 완료",
  }).click()

  // Then
  await expect(page.getByText("원천 실적 검토를 완료했습니다.")).toBeVisible()
  await expect(page.getByText("검토 대기 0건")).toBeVisible()
  await loginAs(page, "엔지니어")
  await expect(page.getByText("검토 완료")).toBeVisible()

  // When
  await page.getByRole("button", { name: "샘플 엔지니어 01 TEPS 어학 성적 수정" }).click()
  await page.getByLabel("점수 또는 등급").fill("420")
  await page.getByRole("button", { name: "저장" }).click()

  // Then
  await expect(page.getByText("운영자 검토 대기")).toBeVisible()
})
