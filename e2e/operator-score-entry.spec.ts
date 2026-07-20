import { expect, test } from "@playwright/test"

import { clearDemoStorage, waitForApp } from "./helpers"

test.beforeEach(async ({ page }) => {
  await clearDemoStorage(page)
})

test("운영자가 평가자를 바꾸면 해당 평가자의 점수만 표시하고 TSV 점수를 저장한다", async ({ page }) => {
  // Given
  await page.goto("/evaluations")
  await waitForApp(page)
  const postponePasswordChange = page.getByRole("button", { name: "나중에 변경" })
  if (await postponePasswordChange.isVisible()) await postponePasswordChange.click()
  await page.getByText("샘플 엔지니어 13", { exact: true }).click()
  await page.getByRole("combobox", { name: "과제" }).click()
  await page.getByRole("option", { name: "DX 툴 활용" }).click()
  const score = page.getByRole("textbox", { name: "결과물의 사용 편의성 점수" })
  await expect(score).toHaveValue("")
  await score.fill("9")

  // When
  await page.getByRole("combobox", { name: "평가자", exact: true }).click()
  await page.getByRole("option", { name: "샘플 평가자 4" }).click()

  // Then
  await expect(page.getByText("운영자 대리 입력 · 샘플 평가자 4")).toBeVisible()
  await expect(score).toHaveValue("10")

  // When
  await page.getByRole("combobox", { name: "평가자", exact: true }).click()
  await page.getByRole("option", { name: "샘플 평가자 3" }).click()

  // Then
  await expect(score).toHaveValue("9")

  // When
  await page.getByRole("textbox", { name: "TSV 점수" }).fill("10\t9\t8\t7\t6\t5\t4\t3\t2\t1")
  await page.getByRole("button", { name: "점수 일괄 적용" }).click()
  await page.getByRole("combobox", { name: "평가자", exact: true }).click()
  await page.getByRole("option", { name: "샘플 평가자 4" }).click()
  await page.getByRole("combobox", { name: "평가자", exact: true }).click()
  await page.getByRole("option", { name: "샘플 평가자 3" }).click()

  // Then
  await expect(page.getByRole("textbox", { name: "주제 선정 및 문제 정의 점수" })).toHaveValue("10")
  await expect(page.getByRole("textbox", { name: "발표 자료의 완성도 점수" })).toHaveValue("1")
})
