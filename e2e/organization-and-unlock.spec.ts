import { mkdir } from "node:fs/promises"

import { expect, test, type Page } from "@playwright/test"

import { clearDemoStorage, waitForApp } from "./helpers"

const EVIDENCE_DIR = ".omo/evidence/organization-and-unlock"

test.beforeEach(async ({ page }) => {
  await clearDemoStorage(page)
})

async function login(page: Page, username: string) {
  await page.getByRole("textbox", { name: "아이디" }).fill(username)
  await page.getByRole("textbox", { name: "비밀번호" }).fill("Demo!2026")
  await page.getByRole("button", { name: "로그인" }).click()
  const accountLabel = username === "evaluator01"
    ? "샘플 평가자 01 로그아웃"
    : "샘플 운영자 로그아웃"
  await expect(page.getByRole("button", { name: accountLabel })).toBeVisible()
}

test("운영자가 조직 분류를 확인하고 평가자의 잠금 해제 요청을 승인한다", async ({ page }, testInfo) => {
  const outputDir = `${EVIDENCE_DIR}/${testInfo.project.name}`
  await mkdir(outputDir, { recursive: true })

  await page.goto("/operations?tab=roster")
  await waitForApp(page)
  await expect(page.getByRole("heading", { name: "평가 명단 관리" })).toBeVisible()
  if ((page.viewportSize()?.width ?? 1280) >= 768) {
    const rosterTable = page.getByRole("region", { name: "엔지니어 명단 표" })
    await expect(rosterTable.getByText("1부문", { exact: true }).first()).toBeVisible()
    await expect(rosterTable.getByText("전자약품담당", { exact: true }).first()).toBeVisible()
  } else {
    await expect(page.locator("li").filter({ hasText: "전자약품담당" }).first()).toBeVisible()
  }
  await page.screenshot({ fullPage: true, path: `${outputDir}/01-roster.png` })

  await page.getByRole("button", { name: "엔지니어 1명 추가" }).click()
  const rosterDialog = page.getByRole("dialog", { name: "엔지니어 개별 등록" })
  await expect(rosterDialog.getByLabel("부문")).toHaveValue("1부문")
  await rosterDialog.getByLabel("팀").click()
  await page.getByRole("option", { name: "생산 2팀" }).click()
  await expect(rosterDialog.getByLabel("담당")).toContainText("염화메탄담당")
  await page.screenshot({ path: `${outputDir}/02-roster-dialog.png` })
  await page.keyboard.press("Escape")

  await page.getByRole("button", { name: "샘플 운영자 로그아웃" }).click()
  await login(page, "evaluator01")
  await page.goto("/evaluations")
  await waitForApp(page)

  const submittedEvaluation = page.getByRole("button", { name: /평가 열기, 제출 완료/ }).first()
  await expect(submittedEvaluation).toBeVisible()
  await submittedEvaluation.click()
  await page.getByRole("button", { name: "잠금 해제 요청" }).click()
  const requestDialog = page.getByRole("dialog", { name: "평가 잠금 해제 요청" })
  await requestDialog.getByLabel("수정 요청 사유").fill("발표 질의응답 점수를 수정해야 합니다.")
  await page.screenshot({ path: `${outputDir}/03-evaluator-request.png` })
  await requestDialog.getByRole("button", { name: "요청 보내기" }).click()
  await expect(page.getByRole("button", { name: "잠금 해제 요청 중" })).toBeDisabled()

  await page.getByRole("button", { name: "샘플 평가자 01 로그아웃" }).click()
  await login(page, "operator")
  await page.goto("/operations?tab=unlocks")
  await waitForApp(page)
  await expect(page.getByRole("heading", { name: "평가 잠금 해제 요청" })).toBeVisible()
  await expect(
    page.getByText("발표 질의응답 점수를 수정해야 합니다.", { exact: true }).filter({ visible: true }).first(),
  ).toBeVisible()
  await page.screenshot({ fullPage: true, path: `${outputDir}/04-operator-request-list.png` })

  await page.getByRole("button", { name: "잠금 해제" }).filter({ visible: true }).first().click()
  const unlockDialog = page.getByRole("dialog", { name: "잠금 해제 요청 승인" })
  await expect(unlockDialog.getByText(/감사 기록에 남습니다/)).toBeVisible()
  await page.screenshot({ path: `${outputDir}/05-operator-approval.png` })
  await unlockDialog.getByRole("button", { name: "잠금 해제" }).click()
  await expect(unlockDialog).toBeHidden()
  await expect(page.getByText("대기 중인 잠금 해제 요청이 없습니다.")).toBeVisible()
})
