import { expect, test } from "@playwright/test"

import {
  clearDemoStorage,
  clickShellLink,
  switchRole,
  waitForApp,
} from "./helpers"

test.beforeEach(async ({ page }) => {
  await clearDemoStorage(page)
})

async function fillMissingScores(page: import("@playwright/test").Page, value = "8") {
  const inputs = page.locator('input[inputmode="numeric"][aria-label$=" 점수"]')
  await expect(inputs.first()).toBeVisible()
  const count = await inputs.count()
  for (let index = 0; index < count; index += 1) {
    const input = inputs.nth(index)
    if (await input.inputValue() === "") {
      await input.fill(value)
      await expect(input).toHaveValue(value)
      await page.waitForTimeout(200)
    }
  }
}

test("평가 제출부터 직접점수 확정, 순위 반영, 새로고침과 초기화까지 연결된다", async ({ page }) => {
  test.setTimeout(90_000)
  await page.goto("/dashboard")
  await waitForApp(page)
  await expect(page.getByRole("link", { name: /샘플 엔지니어 16/ })).toHaveCount(0)

  await switchRole(page, "평가자")
  await expect(page).toHaveURL(/\/today$/)
  await clickShellLink(page, /평가하기/)
  await page
    .getByRole("button", { name: "샘플 엔지니어 16 평가 열기, 작성 중" })
    .click()

  await fillMissingScores(page)
  const submitButton = page.getByRole("button", { name: "제출 및 잠금" })
  await expect(submitButton).toBeEnabled()
  await submitButton.click()
  await expect(page.getByText("제출 완료되어 잠겼습니다")).toBeVisible()

  await page.reload()
  await waitForApp(page)
  await page.goto("/evaluations/detail?assignmentId=engineer-16-task-ots-scenario-evaluator-01")
  await expect(page.getByText("제출 완료되어 잠겼습니다")).toBeVisible()

  await switchRole(page, "운영자")
  await clickShellLink(page, /운영 설정/)
  await page.getByRole("tab", { name: "자격, 어학 입력" }).click()
  await page.getByLabel("엔지니어 선택").click()
  await page.getByRole("option", { name: /샘플 엔지니어 16/ }).click()
  await page.getByRole("button", { name: "자격증 추가" }).click()
  await page.getByLabel("자격증명").selectOption("산업안전기사")
  await page.getByRole("button", { name: "저장" }).click()
  await expect(page.getByText("산업안전기사", { exact: true })).toBeVisible()
  await page.getByLabel("엔지니어 검색").fill("샘플 엔지니어 16")
  await expect(
    page.getByRole("spinbutton", { name: "샘플 엔지니어 16 자격증 점수" }),
  ).toHaveValue("22")
  await page.getByRole("spinbutton", { name: "샘플 엔지니어 16 고등급제안 점수" }).fill("91")

  await page.reload()
  await page.getByRole("tab", { name: "자격, 어학 입력" }).click()
  await page.getByLabel("엔지니어 검색").fill("샘플 엔지니어 16")
  await expect(
    page.getByRole("spinbutton", { name: "샘플 엔지니어 16 자격증 점수" }),
  ).toHaveValue("22")

  await clickShellLink(page, /전체 현황/)
  const rankedEngineer = page.getByRole("link", { name: "샘플 엔지니어 16", exact: true })
  await expect(rankedEngineer).toBeVisible()
  await rankedEngineer.click()
  await expect(page.getByRole("heading", { name: "샘플 엔지니어 16" })).toBeVisible()

  await clickShellLink(page, /운영 설정/)
  await page.getByRole("tab", { name: "초기화" }).click()
  await page.getByRole("button", { name: "샘플 데이터 초기화" }).click()
  await page.getByRole("button", { name: "초기화 실행" }).click()
  await expect(page.getByText("샘플 데이터를 초기 상태로 복원했습니다.")).toBeVisible()

  await clickShellLink(page, /전체 현황/)
  await expect(page.getByRole("link", { name: "샘플 엔지니어 16", exact: true })).toHaveCount(0)
})

test("역할별 메뉴와 평가자 상세 노출 범위가 분리된다", async ({ page }) => {
  await page.goto("/dashboard")
  await waitForApp(page)
  await switchRole(page, "승인자")
  await expect(page.getByRole("link", { name: /운영 설정/ })).toHaveCount(0)

  await page.goto("/engineers/engineer-01")
  await expect(page.getByText("평가자별 상세")).toHaveCount(0)

  await switchRole(page, "평가자")
  await page.goto("/dashboard")
  await expect(page.getByRole("heading", { name: "접근 권한이 없습니다" })).toBeVisible()
  await expect(page.getByText("완료자 전체 순위")).toHaveCount(0)
})

test("명단 일괄 등록부터 미평가 확인, 운영자 대리평가, 일정 저장까지 유지된다", async ({
  page,
}) => {
  test.setTimeout(60_000)
  await page.goto("/dashboard")
  await waitForApp(page)
  await clickShellLink(page, /운영 설정/)

  await page.getByRole("button", { name: "엔지니어 일괄 등록" }).click()
  await page
    .getByLabel("엔지니어 목록")
    .fill("E-900, 테스트 엔지니어, 생산 2팀, 염화메탄담당, 엔지니어")
  await expect(page.getByText("등록 예정 1명")).toBeVisible()
  await page.getByRole("button", { name: "1명 일괄 등록" }).click()
  await expect(page.getByText("1명의 엔지니어를 등록했습니다.")).toBeVisible()

  await clickShellLink(page, /미평가 현황/)
  await expect(page.getByRole("heading", { name: "미평가 현황" })).toBeVisible()
  await expect(page.getByRole("link", { name: "테스트 엔지니어 직접점수 입력" })).toBeVisible()
  const pendingEvaluationLink = page
    .getByRole("link", { name: /샘플 엔지니어 .* 평가 입력/ })
    .filter({ visible: true })
    .first()
  await expect(pendingEvaluationLink).toBeVisible()
  await pendingEvaluationLink.click()

  await fillMissingScores(page)
  await page.getByRole("button", { name: "평가 저장" }).click()
  await expect(page.getByText(/운영자 대리 입력/)).toBeVisible()

  await clickShellLink(page, /운영 설정/)
  await page.getByRole("tab", { name: /평가자 5명/ }).click()
  await page.getByRole("button", { name: "평가자 일괄 등록" }).click()
  await page
    .getByLabel("평가자 목록")
    .fill("V-900, 테스트 평가자, 생산 1팀")
  await page.getByRole("button", { name: "1명 일괄 등록" }).click()
  await expect(page.getByText("1명의 평가자를 등록했습니다.")).toBeVisible()

  await clickShellLink(page, /평가 일정/)
  await page.getByRole("button", { name: "일정 추가" }).click()
  await page.getByLabel("평가 과제").selectOption("task-growth-plan")
  await page.getByRole("checkbox", { name: "샘플 엔지니어 01 생산 1팀" }).check()
  await page.getByRole("checkbox", { name: "샘플 엔지니어 02 생산 2팀" }).check()
  const browserToday = await page.evaluate(() => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, "0")
    const day = String(today.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  })
  await page.getByLabel("일정 제목").fill("테스트 역량평가 발표")
  await page.getByLabel("발표일").fill(browserToday)
  await page.getByLabel("시작 시간").fill("10:30")
  await page.getByLabel("메모").fill("테스트 회의실")
  await page.getByRole("button", { name: "일정 저장" }).click()
  await page.getByRole("button", { name: "다음 달" }).click()
  await expect(page.getByRole("heading", { name: "2026년 6월" })).toBeVisible()
  await page.getByRole("button", { name: "다음 달" }).click()
  await expect(page.getByRole("heading", { name: "2026년 7월" })).toBeVisible()
  const savedEventTitle = page
    .getByText("테스트 역량평가 발표", { exact: true })
    .filter({ visible: true })
    .first()
  await expect(savedEventTitle).toBeVisible()

  await page.reload()
  await waitForApp(page)
  await expect(
    page.getByText("테스트 역량평가 발표", { exact: true }).filter({ visible: true }).first(),
  ).toBeVisible()

  await switchRole(page, "평가자")
  await expect(page).toHaveURL(/\/today$/)
  await expect(page.getByLabel("평가일")).toHaveValue(browserToday)
  await expect(page.getByRole("link", { name: /평가 시작|평가표 열기/ }).first()).toBeVisible()
  await switchRole(page, "운영자")

  await clickShellLink(page, /평가 입력/)
  await expect(page.getByRole("heading", { level: 1, name: "전체 평가 입력" })).toBeVisible()
})
