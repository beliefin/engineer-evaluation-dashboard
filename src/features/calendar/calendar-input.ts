import { z } from "zod"

import { isCanonicalDate } from "./calendar-helpers"

export const calendarInputSchema = z.object({
  engineerId: z.string().trim().min(1, "엔지니어를 선택해 주세요."),
  taskId: z.string().trim().min(1, "평가 과제를 선택해 주세요."),
  title: z.string().trim().min(1, "일정 제목을 입력해 주세요.").max(100, "일정 제목은 100자 이하여야 합니다."),
  date: z.string().refine(isCanonicalDate, "올바른 발표일을 입력해 주세요."),
  startTime: z
    .string()
    .regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, "올바른 시작 시간을 입력해 주세요.")
    .nullable(),
  note: z.string().trim().min(1).max(500, "메모는 500자 이하여야 합니다.").nullable(),
})

export const calendarCreateInputSchema = calendarInputSchema.omit({ engineerId: true }).extend({
  engineerIds: z.array(z.string().trim().min(1)).min(1, "엔지니어를 한 명 이상 선택해 주세요."),
})

export type CalendarInputField = keyof z.infer<typeof calendarInputSchema> | "engineerIds"

export function getCalendarInputErrorField(path: readonly PropertyKey[]): CalendarInputField | null {
  const field = path[0]
  switch (field) {
    case "engineerId":
    case "engineerIds":
    case "taskId":
    case "title":
    case "date":
    case "startTime":
    case "note":
      return field
    default:
      return null
  }
}
