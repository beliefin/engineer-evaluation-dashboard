import { expect, test } from "@playwright/test"

import { clearDemoStorage, waitForApp } from "./helpers"

test.beforeEach(async ({ page }) => {
  await clearDemoStorage(page)
})

test("새 평가 시즌을 만들면 즉시 선택되고 새로고침 후에도 유지된다", async ({ page }) => {
  await page.goto("/operations?tab=cycle")
  await waitForApp(page)

  await page.getByRole("button", { name: "평가 시즌 만들기" }).click()
  await page.getByLabel("평가 시즌명").fill("2026 하반기")
  await page.getByLabel("시작일").fill("2026-07-01")
  await page.getByLabel("종료일").fill("2026-12-31")
  await page.getByRole("button", { name: "시즌 만들기" }).click()

  await expect(page.getByText("새 평가 시즌을 만들었습니다.")).toBeVisible()
  const cycleSelect = page.getByLabel("평가 시즌").first()
  await expect(cycleSelect.locator("option:checked")).toHaveText("2026 하반기")
  await expect(page.getByText("총 2개 시즌")).toBeVisible()
  await expect(page.getByText("설정 중 · 2026-07-01 ~ 2026-12-31")).toBeVisible()

  await page.reload()
  await waitForApp(page)
  await expect(page.getByLabel("평가 시즌").first().locator("option:checked")).toHaveText(
    "2026 하반기",
  )
  await expect(page.getByText("총 2개 시즌")).toBeVisible()
})

test("빈 시즌에 점수형과 P/F 과제를 구성하고 가중치 100%를 저장한다", async ({ page }) => {
  await page.goto("/operations?tab=season")
  await waitForApp(page)

  await page.getByRole("button", { name: "평가 시즌 만들기" }).click()
  await page.getByLabel("평가 시즌명").fill("자유 구성 시즌")
  await page.getByLabel("시작일").fill("2027-01-01")
  await page.getByLabel("종료일").fill("2027-06-30")
  await page.getByLabel("현재 과제 구성 복사").uncheck()
  await page.getByRole("button", { name: "시즌 만들기" }).click()

  await page.getByRole("tab", { name: "과제 구성" }).click()
  await expect(page.getByText("등록된 과제가 없습니다.")).toBeVisible()

  await page.getByRole("button", { name: "과제 추가" }).click()
  await page.getByLabel("과제명").fill("현장 개선 발표")
  await page.getByLabel("최종 반영 가중치 (%)").fill("60")
  await page.getByLabel("평가 안내").fill("현장 문제 정의와 개선 효과를 평가합니다.")
  await page.getByLabel("평가 항목 1", { exact: true }).fill("문제 정의")
  await page.getByRole("button", { name: "항목", exact: true }).click()
  await page.getByLabel("평가 항목 2", { exact: true }).fill("개선 효과")
  await page.getByLabel("샘플 평가자 1 평가 참여").check()
  await page.getByLabel("샘플 평가자 1 가중치").fill("2")
  await page.getByLabel("샘플 평가자 2 평가 참여").check()
  await page.getByRole("button", { name: "과제 저장" }).click()

  await expect(page.getByRole("heading", { name: "현장 개선 발표" })).toBeVisible()
  await expect(page.getByText("평가 항목 2개 · 평가자 2명")).toBeVisible()
  await expect(page.getByText("현재 가중치 합계는 60%입니다.", { exact: false })).toBeVisible()

  await page.getByRole("button", { name: "과제 추가" }).click()
  await page.getByLabel("과제명").fill("안전 기준 준수")
  await page.getByLabel("평가방식").click()
  await page.getByRole("option", { name: "운영자 P/F 입력" }).click()
  await page.getByLabel("최종 반영 가중치 (%)").fill("40")
  await page.getByRole("button", { name: "과제 저장" }).click()

  await expect(page.getByText("합계 100%", { exact: true })).toBeVisible()
  await expect(page.getByRole("heading", { name: "안전 기준 준수" })).toBeVisible()

  await page.reload()
  await waitForApp(page)
  await page.getByRole("tab", { name: "과제 구성" }).click()
  await expect(page.getByText("합계 100%", { exact: true })).toBeVisible()
  await expect(page.getByRole("heading", { name: "현장 개선 발표" })).toBeVisible()
  await expect(page.getByRole("heading", { name: "안전 기준 준수" })).toBeVisible()
})
