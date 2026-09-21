import { expect, test } from "@playwright/test"

import { clearDemoStorage, loginAs, waitForApp } from "./helpers"

test.beforeEach(async ({ page }) => {
  await clearDemoStorage(page)
})

test("고등급 제안 점수를 입력하고 직접 점수 표와 새로고침 후에도 확인한다", async ({ page }) => {
  await page.goto("/login")
  await loginAs(page, "운영자")
  await page.goto("/operations?tab=scores")
  await waitForApp(page)

  await expect(page.getByRole("tab", {
    name: "자격·어학·고등급 제안 입력",
  })).toHaveAttribute("data-state", "active")

  const proposalRegion = page.getByRole("region", { name: "고등급 제안 점수 입력" })
  const proposalInput = proposalRegion.getByRole("spinbutton", {
    name: "샘플 엔지니어 01 고등급제안 점수",
  })
  await proposalInput.fill("84.5")
  await expect(proposalInput).toHaveValue("84.5")
  await expect(proposalRegion.getByText("100점 만점 · 최종 점수 10% 반영")).toBeVisible()

  const directScorePanel = page.getByRole("heading", { name: "직접 점수 확인" })
    .locator("xpath=ancestor::section[1]")
  await directScorePanel.getByLabel("엔지니어 검색").fill("샘플 엔지니어 01")
  await expect(directScorePanel.getByRole("spinbutton", {
    name: "샘플 엔지니어 01 고등급제안 점수",
  })).toHaveValue("84.5")

  await page.reload()
  await waitForApp(page)
  await expect(page.getByRole("region", { name: "고등급 제안 점수 입력" })
    .getByRole("spinbutton", {
      name: "샘플 엔지니어 01 고등급제안 점수",
    })).toHaveValue("84.5")
})
