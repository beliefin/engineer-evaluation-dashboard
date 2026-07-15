import { describe, expect, it } from "vitest"

import { parseEngineerRoster, parseEvaluatorRoster } from "./parser"

describe("parseEngineerRoster", () => {
  it("skips a header and applies the selected team and default position", () => {
    const result = parseEngineerRoster(
      "사번\t이름\t팀\t직급\nE-001\t김하늘\nE-002,박이든,생산 2팀,선임",
      "생산 1팀",
    )

    expect(result.errors).toEqual([])
    expect(result.rows).toEqual([
      {
        employeeCode: "E-001",
        displayName: "김하늘",
        team: "생산 1팀",
        position: "엔지니어",
      },
      {
        employeeCode: "E-002",
        displayName: "박이든",
        team: "생산 2팀",
        position: "선임",
      },
    ])
  })

  it("returns line-specific required-field and team errors", () => {
    const result = parseEngineerRoster(
      "E-001,,생산 3팀\n,홍길동,생산 1팀",
      "생산 2팀",
    )

    expect(result.rows).toEqual([])
    expect(result.errors).toEqual([
      { line: 1, message: "이름을 입력하세요." },
      { line: 1, message: "팀은 생산 1팀 또는 생산 2팀이어야 합니다." },
      { line: 2, message: "사번을 입력하세요." },
    ])
  })

  it("rejects duplicate employee codes within one batch", () => {
    const result = parseEngineerRoster(
      "E-001,김하늘\ne-001,박이든",
      "생산 1팀",
    )

    expect(result.rows).toEqual([])
    expect(result.errors).toEqual([
      { line: 2, message: "사번 E-001이(가) 목록 안에서 중복되었습니다." },
    ])
  })
})

describe("parseEvaluatorRoster", () => {
  it("parses comma and tab rows and defaults an omitted team", () => {
    const result = parseEvaluatorRoster(
      "사번,이름,팀\nV-001,이서준\nV-002\t최유진\t생산 2팀",
      "생산 1팀",
    )

    expect(result.errors).toEqual([])
    expect(result.rows).toEqual([
      { employeeCode: "V-001", displayName: "이서준", team: "생산 1팀" },
      { employeeCode: "V-002", displayName: "최유진", team: "생산 2팀" },
    ])
  })
})
