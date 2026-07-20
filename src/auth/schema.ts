import { z } from "zod"

import { roleSchema } from "@/domain"

const idSchema = z.string().trim().min(1)
export const accountRolesSchema = z.array(roleSchema).min(1).max(2).superRefine((roles, context) => {
  const dualRole = roles.length === 2 && roles[0] === "evaluator" && roles[1] === "engineer"
  if (roles.length > 1 && !dualRole) {
    context.addIssue({
      code: "custom",
      message: "복합 역할은 평가자와 엔지니어 조합만 사용할 수 있습니다.",
    })
  }
})
export const usernameSchema = z
  .string()
  .trim()
  .min(2, "아이디는 2자 이상 입력해 주세요.")
  .max(40, "아이디는 40자 이하로 입력해 주세요.")
  .regex(/^[가-힣a-z0-9._-]+$/, "아이디는 한글, 영문 소문자, 숫자, 점, 밑줄, 하이픈만 사용할 수 있습니다.")

export const passwordSchema = z
  .string()
  .min(4, "비밀번호는 4자 이상 입력해 주세요.")
  .max(64, "비밀번호는 64자 이하로 입력해 주세요.")

export const loginInputSchema = z.object({
  username: usernameSchema.transform((value) => value.toLowerCase()),
  password: z.string().min(1, "비밀번호를 입력해 주세요."),
})

const accountFieldsSchema = z.object({
  displayName: z.string().trim().min(2, "표시 이름은 2자 이상 입력해 주세요.").max(50),
  role: roleSchema,
  roles: accountRolesSchema,
  evaluatorId: idSchema.nullable(),
  engineerId: idSchema.nullable(),
  canViewInsights: z.boolean(),
  active: z.boolean(),
}).superRefine((account, context) => {
  if (account.role !== account.roles[0]) {
    context.addIssue({
      code: "custom",
      message: "기본 역할과 권한 구성이 일치하지 않습니다.",
      path: ["roles"],
    })
  }
  const evaluatorRole = account.roles.includes("evaluator")
  const engineerRole = account.roles.includes("engineer")
  if (evaluatorRole && account.evaluatorId === null) {
    context.addIssue({
      code: "custom",
      message: "평가자 역할은 등록된 평가자와 연결해야 합니다.",
      path: ["evaluatorId"],
    })
  }
  if (!evaluatorRole && account.evaluatorId !== null) {
    context.addIssue({
      code: "custom",
      message: "평가자 역할만 평가자 연결을 사용할 수 있습니다.",
      path: ["evaluatorId"],
    })
  }
  if (engineerRole && account.engineerId === null) {
    context.addIssue({
      code: "custom",
      message: "엔지니어 역할은 등록된 엔지니어와 연결해야 합니다.",
      path: ["engineerId"],
    })
  }
  if (!engineerRole && account.engineerId !== null) {
    context.addIssue({
      code: "custom",
      message: "엔지니어 역할만 엔지니어 연결을 사용할 수 있습니다.",
      path: ["engineerId"],
    })
  }
  if (account.canViewInsights && !evaluatorRole) {
    context.addIssue({
      code: "custom",
      message: "현황·분석 열람 권한은 평가자 역할에만 부여할 수 있습니다.",
      path: ["canViewInsights"],
    })
  }
})

export const createAccountInputSchema = z.object({
  username: usernameSchema.transform((value) => value.toLowerCase()),
  password: passwordSchema,
  displayName: z.string(),
  role: roleSchema,
  roles: accountRolesSchema,
  evaluatorId: idSchema.nullable(),
  engineerId: idSchema.nullable(),
  canViewInsights: z.boolean().default(false),
  active: z.boolean(),
}).pipe(accountFieldsSchema.extend({
  username: usernameSchema,
  password: passwordSchema,
}))

export const updateAccountInputSchema = accountFieldsSchema.and(z.object({ accountId: idSchema }))
export const resetPasswordInputSchema = z.object({ accountId: idSchema, password: passwordSchema })
export const changeOwnPasswordInputSchema = z.object({ password: passwordSchema })

export const authAccountRecordSchema = z.object({
  id: idSchema,
  username: usernameSchema,
  displayName: z.string().trim().min(1),
  role: roleSchema,
  roles: accountRolesSchema.optional(),
  evaluatorId: idSchema.nullable(),
  engineerId: idSchema.nullable().default(null),
  canViewInsights: z.boolean().default(false),
  active: z.boolean(),
  mustChangePassword: z.boolean().default(true),
  createdAt: z.string().trim().min(1),
  updatedAt: z.string().trim().min(1),
  passwordSalt: idSchema,
  passwordHash: idSchema,
}).transform((account) => ({
  ...account,
  roles: account.roles ?? [account.role],
}))

export const authSnapshotSchema = z.object({
  schemaVersion: z.literal(1),
  accounts: z.array(authAccountRecordSchema).min(1),
})

export const authSessionSchema = z.object({
  schemaVersion: z.literal(1),
  accountId: idSchema,
  expiresAt: z.number().int().positive(),
})
