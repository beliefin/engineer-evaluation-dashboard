# 엔지니어 역량평가 대시보드

실제 개인정보 없이 명단 등록, 평가 입력, 가중 합산, 완료자 순위와 발표 일정을 검증하는 프론트엔드 프로토타입입니다. Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, TanStack Table, Recharts와 Pretendard Variable을 사용합니다. 세부 UI 규칙은 [DESIGN.md](./DESIGN.md)를 따릅니다.

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
- 평가자: `/evaluations`, `/evaluations/[assignmentId]`
- 승인자: 대시보드·개인 상세·미평가 현황·평가 일정·분석을 읽기 전용으로 확인
- `/pending`은 미배정·미제출·직접점수 누락 엔지니어를 구분하고 다음 입력 화면으로 연결합니다.
- `/calendar`는 엔지니어별 발표일, 시간과 메모를 월별로 기록합니다.
- 로그인한 계정 역할에 따라 메뉴와 접근 범위가 결정되며, 모든 화면에 `샘플 데이터` 표시가 유지됩니다.

샘플은 엔지니어 24명, 평가자 5명, `생산 1팀`·`생산 2팀`으로 구성됩니다. 운영 설정에서 엔지니어와 평가자를 한 명씩 또는 붙여넣기로 일괄 등록할 수 있습니다. 평가 상태는 브라우저 LocalStorage v5, 로그인 계정은 별도 LocalStorage v1 저장소에 남으며 네트워크 API는 사용하지 않습니다. 기존 평가 샘플 저장값은 최초 로드 시 v5로 복원되며, 운영 설정의 `초기화`에서 평가 샘플 상태를 복원할 수 있습니다.

## 샘플 로그인

모든 초기 계정의 공통 비밀번호는 `Demo!2026`입니다.

- 운영자: `operator` — 전체 기능과 `/accounts` 계정 관리
- 평가자: `evaluator01` — 연결된 본인 평가만 입력
- 승인자: `approver` — 결과와 분석 읽기 전용
- 엔지니어: `engineer01` — 본인 점수 확인과 어학·자격증 원천 실적 입력

운영자는 계정을 추가·편집·비활성화·삭제하고 비밀번호를 재설정할 수 있습니다. 현재 로그인한 운영자와 마지막 활성 운영자는 잠글 수 없습니다.

## 실행

```powershell
cd C:\llmwiki\engineer-evaluation-dashboard
npm install
npm run dev
```

브라우저에서 [http://localhost:3000/login](http://localhost:3000/login)을 엽니다. 보호된 주소에 직접 접근해도 로그인 화면으로 이동합니다.

## GitHub Pages

공개 샘플은 [https://beliefin.github.io/engineer-evaluation-dashboard/](https://beliefin.github.io/engineer-evaluation-dashboard/)에서 확인합니다. `main` 브랜치에 푸시하면 GitHub Actions가 Pages 전용 정적 빌드를 생성합니다. LocalStorage 데이터는 브라우저·기기별로 분리되므로 모바일에서 입력한 값은 PC에 자동 동기화되지 않습니다.

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

현재 로그인, 역할 제한과 감사 이력은 브라우저 LocalStorage 기반 클라이언트 데모 기능이므로 실제 보안 경계가 아닙니다. 재오픈 API는 후속 운영 전환을 위해 저장소에 남겨 두었지만 화면에서는 숨겼습니다. 실데이터 적용 전 서버 세션 또는 SSO, 서버 측 RBAC, DB 저장소, 불변 감사 로그, 비밀번호 정책과 개인정보 보존·파기 정책을 별도로 구현해야 합니다.
