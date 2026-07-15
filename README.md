# 엔지니어 역량평가 대시보드

명단 등록, 평가 입력, 가중 합산, 완료자 순위와 발표 일정을 관리하는 웹 애플리케이션입니다. Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, TanStack Table, Recharts, Supabase를 사용합니다. 세부 UI 규칙은 [DESIGN.md](./DESIGN.md)를 따릅니다.

## 평가 규칙

- 평가 시즌마다 과제를 독립적으로 추가·수정·삭제하고 최종 반영 가중치를 설정합니다. 모든 과제의 가중치 합계가 100%일 때만 최종점수와 순위를 확정합니다.
- 과제의 평가방식은 `평가자 점수`, `평가자 P/F`, `운영자 점수`, `운영자 P/F` 중 하나입니다.
- 평가자 점수형 과제는 필요한 수만큼 평가 항목을 구성합니다. 각 항목을 0~10점으로 입력한 합계를 항목 수와 관계없이 0~100점으로 정규화합니다.
- 평가자형 과제는 참여 평가자와 원시 가중치를 시즌별로 설정하며, 실제 반영 비율은 자동 정규화합니다. 참여 평가자 중 한 명이라도 미제출이면 해당 과제는 미확정입니다.
- P/F 과제는 P를 100점, F를 0점으로 환산해 과제 가중치를 반영합니다. 모든 필수 과제가 완료된 엔지니어만 최종점수와 공동순위에 포함합니다.
- 샘플 시즌은 성장탐구계획서, OTS 시나리오 제작, DX 툴 활용, 어학, 자격증, 고등급제안으로 구성되지만 운영 설정에서 자유롭게 교체할 수 있습니다.
- 어학·자격증 원천 실적은 여러 건 저장할 수 있으며, 별도 환산식이 확정될 때까지 평가 과제 결과에 자동 반영하지 않습니다.

## 화면과 역할

- 운영자: 전체 현황·개인 상세·분석·명단 등록·평가 시즌·과제·결과·평가 일정·로그인 계정 관리
- 운영자는 `/evaluations`에서 모든 평가자의 배정 평가지를 대신 입력할 수 있습니다.
- 운영 설정에서 시즌명·기간·상태를 입력해 새 평가 시즌을 만들 수 있습니다. 현재 시즌의 과제, 세부 항목, 평가자 배정과 가중치를 선택적으로 복사하며 모든 점수와 일정은 빈 상태로 시작합니다.
- 평가자: `/evaluations`, `/evaluations/detail?assignmentId=...`
- 승인자: 대시보드·개인 상세·미평가 현황·평가 일정·분석을 읽기 전용으로 확인
- `/pending`은 미배정·미제출·직접점수 누락 엔지니어를 구분하고 다음 입력 화면으로 연결합니다.
- `/calendar`는 엔지니어별 발표일, 시간과 메모를 월별로 기록합니다.
- 로그인한 계정 역할에 따라 메뉴와 서버 응답의 데이터 범위가 함께 결정됩니다.

운영 설정에서 엔지니어와 평가자를 한 명씩 또는 붙여넣기로 일괄 등록할 수 있습니다. Supabase 환경변수가 설정되면 인증·평가 상태·감사 이력을 서버에 저장하고, 설정되지 않았거나 `NEXT_PUBLIC_BACKEND_MODE=local`이면 기존 LocalStorage 샘플 모드로 실행합니다.

## Supabase 백엔드

- `profiles`는 Supabase Auth 사용자와 운영자·평가자·승인자·엔지니어 역할을 연결합니다.
- 원본 평가 상태는 인증 사용자에게도 직접 공개하지 않고 `evaluation-api`가 역할별로 필요한 범위만 반환합니다.
- 운영자 전체 변경, 평가자 본인 평가, 엔지니어 본인 어학·자격증 기록만 서버에서 허용합니다.
- 모든 변경은 revision 충돌 검사와 원자적 DB 커밋을 거치며 별도 불변 감사 로그에 기록합니다.
- `account-admin`은 활성 운영자만 계정 생성·수정·비밀번호 초기화·삭제를 실행할 수 있습니다.

필수 환경변수는 `.env.example`을 참고합니다. 실제 키를 저장하는 `.env.local`은 Git에서 제외됩니다.

## 로컬 샘플 모드

`NEXT_PUBLIC_BACKEND_MODE=local`에서는 엔지니어 24명, 평가자 5명과 역할별 샘플 계정을 LocalStorage에 생성합니다. 이 모드는 테스트와 UI 검증 전용이며 운영 데이터와 동기화되지 않습니다.

## 실행

```powershell
cd C:\llmwiki\engineer-evaluation-dashboard
npm install
npm run dev
```

브라우저에서 [http://localhost:3000/login](http://localhost:3000/login)을 엽니다. 보호된 주소에 직접 접근해도 로그인 화면으로 이동합니다.

## GitHub Pages

운영 사이트는 [https://beliefin.github.io/engineer-evaluation-dashboard/](https://beliefin.github.io/engineer-evaluation-dashboard/)입니다. `main` 브랜치에 푸시하면 GitHub Actions가 Node.js 22로 Pages 정적 빌드를 생성하며, Repository Variables의 Supabase URL과 publishable key를 주입합니다. 서버 저장 데이터는 PC와 모바일에서 같은 계정으로 공유됩니다.

## 검증

루트 운영 규칙에 따라 검증 명령은 `C:\llmwiki\hermes_test`에서 실행합니다.

```powershell
cd C:\llmwiki\hermes_test
npm --prefix ..\engineer-evaluation-dashboard run lint
npm --prefix ..\engineer-evaluation-dashboard run typecheck
npm --prefix ..\engineer-evaluation-dashboard run test
npm --prefix ..\engineer-evaluation-dashboard run build
npm --prefix ..\engineer-evaluation-dashboard run test:e2e
```

## 운영 전환 경계

현재 Supabase Auth, RLS, 역할별 Edge Function, DB 저장과 불변 감사 로그까지 연결되어 있습니다. 실제 직원 데이터를 넣기 전 SSO, 조직 비밀번호 정책, 개인정보 보존·파기 정책, 백업·복구 훈련과 운영자 감사 로그 조회 화면은 추가로 확정해야 합니다. 재오픈 API는 후속 운영을 위해 저장소에 남아 있지만 화면에서는 숨겼습니다.
