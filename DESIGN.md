# Engineer Evaluation Dashboard Design System

## 0. 2026 Industrial Ledger Redesign

- **Direction**: 일반적인 SaaS 카드 대시보드가 아니라 생산 현장의 평가 운영 장부와 계기판을 결합한 `Industrial Ledger`를 기준으로 한다.
- **Primary reference**: Figma Community의 OpenBridge 6.1에서 안전 중요 환경의 명확한 위계, 낮은 채도의 스틸 블루, 얇은 규칙선, 직접 라벨을 차용한다. 해양 전용 계기나 브랜드 자산은 복제하지 않는다.
- **Secondary references**: 100 Card Design Templates는 카드 모양이 아니라 정보 구조의 다양성만 참고하고, Select Codes는 Accounts Table·Add Filter Dropdown·Navigation Tabs의 상호작용만 참고한다. Goo, glow, prism, decorative motion은 사용하지 않는다.
- **Color validation**: Adobe Color의 단색·유사색 조화와 색맹 시뮬레이션을 사용하고, 일반 텍스트 대비는 최소 4.5:1을 유지한다.
- **Anti-references**: 반복되는 흰색 둥근 카드, 왼쪽 강조선이 있는 선택 박스, 점이 붙은 pill 배지, 모든 상태의 아이콘화, 기본 Lucide 아이콘의 장식적 반복을 금지한다.
- **Rollback baseline**: 코드 적용 전 Git 기준점은 `backup/pre-industrial-ui-redesign-20260720`의 `1a255bf`다.

## 1. Atmosphere & Identity

정밀하고 조용한 생산 평가 운영실. 화면은 많은 수치를 다루되 사용자가 현재 상태와 다음 행동을 즉시 찾을 수 있어야 한다. 시그니처는 스틸 블루 수치, 장부처럼 정렬된 규칙선, 짧은 직접 라벨이다. 장식보다 계층, 간격, 정렬, 상태 문구로 신뢰를 만든다. 반복 카드보다 연속적인 문서 흐름을 우선하고, 떠 있는 표면은 실제 계층이 필요한 오버레이에만 사용한다.

## 2. Color

### Palette

| Role | Token | Light | Usage |
|---|---|---|---|
| Canvas | `--background` | `#F3F5F6` | 앱 전체 배경 |
| Surface | `--card` | `#FFFFFF` | 표, 입력, 주요 패널 |
| Rail | `--sidebar` | `#EDF0F2` | 좌측 탐색 영역 |
| Muted surface | `--muted` | `#EDF0F2` | 비활성 행, 보조 영역 |
| Text primary | `--foreground` | `#111820` | 제목, 본문, 수치 |
| Text secondary | `--muted-foreground` | `#5D6872` | 설명, 메타데이터 |
| Border default | `--border` | `#D6DCE0` | 패널, 표, 입력 경계 |
| Border subtle | `--border-subtle` | `#E4E8EB` | 행과 그룹 구분 |
| Accent primary | `--primary` | `#2B5278` | 현재 위치, 주 행동, 포커스 |
| Accent hover | `--primary-hover` | `#1E4265` | 주 행동 hover |
| Accent soft | `--accent` | `#EAF0F4` | 선택 행, 강조 배경 |
| Success | `--success` | `#2E6B4F` | 제출 완료, 저장 완료 |
| Success soft | `--success-soft` | `#E9F2ED` | 완료 상태 배경 |
| Warning | `--warning` | `#8A5A13` | 진행 중, 확인 필요 |
| Warning soft | `--warning-soft` | `#F7F0E4` | 경고 상태 배경 |
| Danger | `--destructive` | `#A9413A` | 미완료, 파괴적 행동 |
| Danger soft | `--danger-soft` | `#F8ECEB` | 오류 상태 배경 |
| Chart primary | `--chart-1` | `#2B5278` | 주요 점수 계열 |
| Chart secondary | `--chart-2` | `#567896` | 보조 계열 |
| Chart neutral | `--chart-3` | `#91A4B4` | 기준 및 미확정 계열 |
| Chart completion | `--chart-4` | `#2E6B4F` | 완료율과 완료 계열 |
| Chart caution | `--chart-5` | `#8A5A13` | 편차와 점검 계열 |

### Rules

- 색은 상호작용과 상태를 설명할 때만 사용한다.
- 완료, 경고, 오류는 색상과 텍스트 또는 아이콘을 함께 제공한다.
- 원색은 작은 면적에만 사용하고 넓은 배경은 soft 토큰을 사용한다.
- 새로운 색이 필요하면 먼저 이 표에 의미와 사용처를 추가한다.

## 3. Typography

### Scale

| Level | Size | Weight | Line height | Tracking | Usage |
|---|---:|---:|---:|---:|---|
| Page title | `28px` | 700 | 1.3 | `-0.025em` | 화면 제목 |
| H1 | `24px` | 700 | 1.3 | `-0.02em` | 주요 결과 수치 |
| H2 | `18px` | 650 | 1.4 | `-0.015em` | 섹션 제목 |
| H3 | `15px` | 650 | 1.45 | `-0.01em` | 패널 제목 |
| Body | `14px` | 450 | 1.6 | `0` | 기본 본문과 표 |
| Body small | `13px` | 450 | 1.55 | `0` | 보조 설명 |
| Caption | `12px` | 550 | 1.45 | `0.01em` | 레이블, 상태, 메타데이터 |
| Numeric | `13px` | 550 | 1.4 | `0` | 표와 점수, tabular nums |

### Font Stack

- Primary: `Pretendard Variable`, `Pretendard`, `Noto Sans KR`, `system-ui`, `sans-serif`
- Mono/numeric fallback: `ui-monospace`, `SFMono-Regular`, `Consolas`, `monospace`

### Rules

- 본문은 13px 아래로 내리지 않는다.
- 점수와 순위에는 `font-variant-numeric: tabular-nums`를 적용한다.
- 페이지 제목은 모바일에서도 26px 아래로만 축소한다.
- 대문자 장식 레이블과 과도한 자간을 사용하지 않는다.

## 4. Spacing & Layout

### Base Unit

모든 간격은 4px 배수를 사용한다.

| Token | Value | Usage |
|---|---:|---|
| `--space-1` | `4px` | 아이콘과 텍스트 |
| `--space-2` | `8px` | 인라인 그룹, 작은 행 |
| `--space-3` | `12px` | 컴팩트 패널, 입력 내부 |
| `--space-4` | `16px` | 모바일 페이지 여백, 폼 간격 |
| `--space-5` | `20px` | 패널 내부 |
| `--space-6` | `24px` | 데스크톱 패널과 섹션 |
| `--space-8` | `32px` | 페이지 주요 그룹 |
| `--space-10` | `40px` | 큰 섹션 구분 |

### Grid

- 앱은 `min-height: 100dvh`를 사용한다.
- 데스크톱 사이드바: 224px, 접힘: 64px, 상단 바: 52px.
- 콘텐츠 최대 폭: 1440px. 데스크톱 좌우 24px, 태블릿 20px, 모바일 16px.
- 데스크톱: 12열, 24px gutter. 태블릿: 8열, 20px gutter. 모바일: 4열, 16px gutter.
- 기준 폭: mobile 390px, tablet 768px, desktop 1280px 이상.
- 정보 표는 데스크톱에서 유지하고 모바일에서는 핵심 열 카드 목록으로 재구성한다.

### Rules

- 카드 안에 카드를 중첩하지 않는다.
- 섹션은 여백보다 얇은 구분선과 제목 계층으로 분리한다.
- 모바일 결과 목록은 카드가 아니라 한 개의 표면 안에서 행 구분선으로 나눈다.
- 앱 셸은 sidebar가 고정되고 main 문서가 수직 스크롤을 소유한다. 별도 패널 스크롤은 명시된 목록·Dialog에만 허용한다.
- 점수 입력 화면의 제출 행동은 모바일 하단에 고정한다.

## 5. Components

### App Shell

- **Structure**: sidebar navigation, top bar, main landmark, mobile sheet.
- **States**: expanded, collapsed, active route, mobile open/closed, authenticated identity, logging out.
- **Accessibility**: 현재 경로는 `aria-current`, 모바일 메뉴는 제목이 있는 Sheet로 제공한다.
- **Motion**: sidebar와 sheet는 180ms transform/opacity만 사용한다.
- **Authentication**: 데모 역할 전환기를 노출하지 않는다. 로그인 계정에 부여된 역할 집합을 권한의 기준으로 사용하고, 평가자·엔지니어 복합 계정에만 `사용 모드` 전환기를 제공한다. 실제 계정명·현재 사용 모드·로그아웃 행동을 데스크톱과 모바일에서 항상 확인할 수 있게 한다.
- **Evaluator identity**: 평가자 계정은 연결된 평가자 본인으로 고정한다. 운영자는 평가 입력 작업 공간 안에서 엔지니어, 과제, 평가자를 순서대로 선택한다.
- **Engineer identity**: 엔지니어 권한은 등록된 엔지니어 한 명과 고정 연결한다. 평가자·엔지니어 복합 계정은 평가자 명단과 엔지니어 명단에 각각 하나씩 연결하며, 엔지니어 모드에서는 연결된 본인의 결과와 원천 실적만 조회·변경할 수 있다.
- **Navigation language**: 기본 내비게이션은 장식 아이콘을 제거하고 2자리 순번, 메뉴명, 짧은 설명으로 구성한다. 활성 상태는 글자 굵기, 스틸 블루 텍스트, 우측의 작은 정사각형 표식으로 표현하며 색 배경 박스와 왼쪽 강조선은 사용하지 않는다.
- **Brand mark**: 둥근 아이콘 타일 대신 각진 `EE` 문자 마크를 사용한다. 모바일에서는 문자 마크만 유지한다.

### Login Surface

- **Structure**: 제품명과 샘플 인증 안내, 아이디·비밀번호 필드, 로그인 행동, 샘플 계정 안내를 하나의 집중된 표면에 배치한다.
- **States**: initial, validating, authenticating, invalid credentials, inactive account, authenticated redirect, storage error.
- **Security copy**: 현재 버전은 브라우저 LocalStorage 기반 샘플 인증이며 실제 운영 보안을 제공하지 않는다는 문구를 로그인 화면에 지속 표시한다. 비밀번호는 저장소에 평문으로 기록하지 않는다.
- **Accessibility**: 보이는 label, `autocomplete="username"`와 `autocomplete="current-password"`, 오류 요약 `role="alert"`, 제출 중 상태 텍스트, 논리적인 키보드 순서를 제공한다.
- **Responsive**: 768px 이상은 인증 폼과 샘플 계정 안내를 두 열로 비교하고, 모바일은 폼을 먼저 보여 주는 단일 열로 전환한다.

### Account Management

- **Structure**: 운영자 전용 페이지 헤더, 전체·활성·역할별 요약, 계정 표/모바일 목록, 계정 생성·편집·비밀번호 재설정·활성 전환·삭제 Dialog.
- **Fields**: 아이디, 표시 이름, 역할 구성, 역할별 연결 대상, 활성 상태. 단일 역할 외에 `평가자 · 엔지니어` 조합을 지원하며 이 경우 두 명단 연결을 모두 필수로 한다. 운영자·승인자는 연결값을 제거한다.
- **Permissions**: 운영자만 계정 목록과 모든 변경 행동을 사용할 수 있다. 평가자·승인자·엔지니어는 경로·메뉴·계정 데이터 모두 접근할 수 없다.
- **Safety states**: 현재 로그인한 운영자는 자신의 역할 변경·비활성화·삭제를 할 수 없고, 마지막 활성 운영자도 제거할 수 없다. 아이디 중복, 비밀번호 규칙, 역할별 대상 미연결을 필드 오류로 제공한다.
- **States**: loading, empty, populated, creating, editing, resetting password, enabling, disabling, deleting, saved, validation error, forbidden.
- **Accessibility**: 각 행의 행동은 계정명을 포함한 접근 가능한 이름을 사용하고, Dialog 제목·설명·오류 연결·초점 복귀를 유지한다. 활성 상태는 색과 함께 텍스트 배지를 제공한다.
- **Responsive**: 데스크톱은 아이디·이름·역할·연결·상태·행동 열을 유지하고, 모바일은 계정 단위 목록과 전체 폭 행동으로 재구성한다.

### Roster Management

- **Edit and delete**: 엔지니어 행에는 수정과 삭제 행동을 제공한다. 수정은 엔지니어 ID와 기존 평가 기록을 유지하며, 삭제는 연결 데이터 범위를 명시한 확인 Dialog를 거친다.
- **Evaluator edit and delete**: 평가자 행에도 동일한 수정·삭제 행동을 제공한다. 수정은 평가자 ID와 기존 평가표를 유지하고, 삭제는 과제 가중치·배정·평가표 정리 범위를 확인 Dialog에 명시한다.
- **Safety states**: 평가 시즌 잠금 중에는 명단 변경을 막고, 로그인 계정이 연결된 엔지니어는 삭제를 비활성화하면서 `계정 연결됨` 사유를 항상 보이는 텍스트로 표시한다.
- **Linked accounts**: 로그인 계정에 연결된 엔지니어 또는 평가자는 계정 연결을 먼저 해제할 때까지 삭제할 수 없다.
- **Validation**: 수정 입력 오류는 해당 필드의 `aria-invalid`와 `aria-describedby`로 연결한다. 삭제 확인은 엔지니어 이름, 연관 데이터 삭제 범위, 복구 불가 안내를 포함한다.
- **Responsive actions**: 데스크톱 표와 모바일 카드 모두 동일한 수정·삭제 행동을 제공하며, Dialog는 390px 화면 안에서 가로 넘침 없이 동작해야 한다.

- **Structure**: 엔지니어·평가자 탭, 현재 명단, 개별 등록 폼, 목록 붙여넣기 Dialog.
- **Organization**: 모든 명단은 `1부문 → 팀 → 담당`으로 분류한다. 기존 6개 담당은 팀별 추천 기본값으로 제공하되 운영자가 새 담당명을 직접 입력할 수 있다. 입력된 담당은 팀별 목록에 저장해 이후 개별 등록·수정·일괄 등록에서 다시 선택할 수 있게 한다.
- **States**: empty, populated, valid preview, row error, duplicate code, saving, saved.
- **Accessibility**: 일괄 등록 오류는 행 번호와 원인을 텍스트로 제공하고 오류가 있으면 확정 행동을 비활성화한다.
- **Responsive**: 데스크톱 표는 모바일에서 사번·이름·팀 중심 목록으로 전환한다.

### Pending Evaluation Board

- **Structure**: 미배정·미시작·진행 중·직접점수 대기 지표, 검색·팀·상태 필터, 다음 작업 링크.
- **States**: actionable rows, filtered empty, fully complete empty.
- **Accessibility**: 진행률 수치와 누락 사유를 색상 외 텍스트로 함께 표시한다.
- **Permissions**: 운영자는 평가 또는 직접점수 입력으로 이동하고 승인자는 엔지니어 상세만 열람한다.

### Evaluation Calendar

- **Structure**: 월 이동, 요일 헤더, 날짜 셀의 직접 라벨 일정, 예정 일정 목록, 등록·수정 Dialog. 새 일정은 평가 과제를 먼저 선택하고 그 과제에 실제 평가자가 배정된 엔지니어를 복수 선택해 일괄 생성한다.
- **Link rule**: 모든 새 일정은 `평가 시즌 × 과제 × 엔지니어`에 연결한다. 평가자에게는 자신의 배정과 일치하는 일정만 전달하며, 일정 선택 시 해당 평가표를 바로 연다. 과제 연결이 없는 기존 일정은 운영자에게만 표시해 수정 시 연결을 보완한다.
- **States**: empty month, populated month, multi-engineer selection, selected event, evaluator-linked action, read-only approver, validation error.
- **Accessibility**: 날짜·시간 입력은 네이티브 컨트롤을 사용하고 이벤트 정보는 hover 없이 읽을 수 있어야 한다.
- **Responsive**: 데스크톱 월간 그리드, 모바일 날짜별 agenda 목록으로 재구성한다.
- **Permissions**: 운영자는 생성·수정·삭제, 평가자는 자신의 일정 조회와 평가표 진입, 승인자는 조회만 가능하다.

### Today's Evaluations

- **Structure**: 평가자 전용 페이지 헤더, 네이티브 날짜 선택기, 선택 날짜의 평가 일정 목록, 평가표 직접 진입 행동.
- **Date rule**: 최초 진입 시 브라우저 현지 날짜를 기본값으로 사용하며, 상단 날짜 선택으로 과거·미래 일정을 같은 화면에서 조회한다.
- **States**: no scheduled evaluation, not started, in progress, submitted, selected date.
- **Accessibility**: 날짜 입력은 보이는 레이블을 제공하고, 일정 카드에는 시간·엔지니어·과제·작성 진행을 텍스트로 표시한다.
- **Responsive**: 모바일은 단일 열 전체 폭 행동, 넓은 화면은 두 열 목록을 사용한다.

### Page Header

- **Structure**: breadcrumb/context, title, description, action group.
- **Variants**: standard, compact.
- **Spacing**: `--space-2`, `--space-6`.
- **States**: actions disabled/loading.

### Metric Strip

- **Structure**: 둥근 카드 없이 한 개의 장부형 공유 표면 안에 세로 구분선으로 KPI를 나눈다.
- **Variants**: neutral, success, warning, danger value.
- **States**: loading skeleton, empty zero, populated.
- **Accessibility**: 값과 단위를 하나의 읽기 순서로 제공한다.

### Data Panel

- **Structure**: header, optional controls, content, optional footer. 제목과 본문은 얇은 규칙선으로만 나눈다.
- **Variants**: `section`(배경·테두리 없음), `panel`(작은 반경과 1px 경계), `flush-table`(표면 안 행 구분선).
- **States**: default, loading, empty, error.
- **Depth**: 기본은 border와 tonal shift, shadow 금지.

### Filter Bar

- **Structure**: search, select groups, reset action.
- **Variants**: desktop inline, mobile Sheet.
- **States**: default, focused, active filter, disabled.
- **Accessibility**: 모든 입력에 보이는 레이블 또는 접근 가능한 이름을 제공한다.
- **Visual rule**: 하나의 연속 도구 모음으로 보이게 하며 필터마다 독립 카드나 pill을 만들지 않는다. 초기화는 낮은 우선순위의 텍스트 행동으로 둔다.

### Data Table / Mobile Result List

- **Structure**: semantic table on desktop, result cards on mobile.
- **States**: sort ascending/descending, selected row, loading, empty.
- **Accessibility**: 정렬 버튼에 상태를 설명하고 행 전체 클릭과 명시적 링크를 함께 제공한다.
- **Numeric rule**: 점수와 순위는 오른쪽 정렬, tabular nums.

### Status Label

- **Variants**: completed, progress, pending, unconfirmed, locked.
- **Anatomy**: 높이 20~22px, 반경 3px, 짧은 상태 텍스트. common status에는 아이콘과 점을 사용하지 않고 `진행 6/10`처럼 상태와 수치를 직접 쓴다.
- **States**: static only; interactive chip으로 오인되지 않게 hover 효과를 주지 않는다.
- **Accessibility**: 색상 외에 상태 텍스트를 항상 제공한다. 잠금·오류처럼 추가 주의가 필요한 상태에만 아이콘을 허용한다.

### Iconography

- 아이콘은 메뉴 장식이 아니라 명확한 도구 행동에만 사용한다.
- 기존 Lucide는 폼 컨트롤, 날짜, 검색, 삭제처럼 보편적인 행동에 한해 유지한다. 내비게이션·상태·로고에서는 제거한다.
- 한 화면에서 서로 다른 아이콘 세트를 혼합하지 않는다. OpenBridge 또는 Solar 아이콘을 도입할 경우 필요한 작은 세트만 가져오고 라이선스 표기를 유지한다.

### Score Input Row

- **Structure**: item index, 구분·평가항목 disclosure, 점수별 세부 평가기준, number input, validation message.
- **States**: default, criteria collapsed/expanded, focus, invalid, saved, locked, disabled.
- **Accessibility**: label과 설명을 input에 연결하고 오류 시 `aria-invalid`를 제공한다.
- **Mobile**: 한 행을 label 위, input 아래의 단일 열로 전환한다.

### Engineer-specific Evaluator Assignment

- **Structure**: 운영자가 엔지니어를 먼저 선택하고, 해당 엔지니어에게 0%보다 크게 적용되는 평가자 과제를 선택한 뒤 평가자와 양수 원시 가중치를 저장한다.
- **Obligation rule**: 평가 의무와 미평가 상태는 저장된 `엔지니어 × 과제 × 평가자` 배정에서만 생성한다. 과제 생성, 평가자 명단 등록, 시즌 복사만으로 배정을 자동 생성하지 않는다.
- **Protection**: 점수가 입력되었거나 제출된 배정은 이 화면에서 제거할 수 없으며, 미입력 초안만 안전하게 제거한다. 원시 가중치 변경은 같은 엔지니어·과제 그룹 안에서 즉시 정규화 비율로 안내한다.
- **States**: no assignment, pending assignment, in-progress protected assignment, submitted protected assignment, saving, saved, and validation error.
- **Responsive**: 엔지니어와 과제 선택은 모바일에서 한 열로 쌓고 평가자 행은 체크, 이름, 가중치, 실제 반영 비율을 읽는 순서로 유지한다.

### Evaluation Entry Workspace

- **Operator**: 전체 엔지니어 목록을 먼저 제시한다. 엔지니어 선택 후 실제 배정된 과제와 평가자를 순서대로 고르면 같은 화면에 평가표를 바로 표시한다. 운영자 입력은 제출 상태여도 잠그지 않고 계속 수정할 수 있다.
- **Evaluator**: 로그인 계정에 실제 배정된 엔지니어와 과제만 표시한다. 제출 후에는 잠그고 수정이 필요하면 사유를 입력해 잠금 해제를 요청한다.
- **Privacy**: 한 평가지에는 선택한 평가자 이름만 표시하고 다른 평가자의 점수와 가중치는 노출하지 않는다.
- **Calibration reference**: 평가자 점수형 평가지에는 같은 시즌·같은 과제의 직전 완료 발표자 최대 3명에 대한 공식 합산 평균과 범위만 익명으로 표시한다. 원천 발표자 이름, 개별 점수, 평가자별 점수와 가중치는 노출하지 않는다. 확정 표본이 없으면 기준 없음 상태를 텍스트로 표시한다.
- **States**: engineer selected, no assignment, task selected, evaluator selected, draft, submitted editable for operator, submitted locked for evaluator, unlock requested.

### Evaluation Season & Task Configurator

- **Structure**: current season summary, create action, season name, period, status, configuration-copy option, weight-total status, and a flat task list. Each task opens one editor for name, evaluator guidance, overall weight, evaluation method, and rubric items.
- **Evaluation methods**: evaluator score, evaluator P/F, operator score, operator P/F, and derived average. Score tasks normalize any count of 0–10 rubric items to 0–100. P/F tasks expose explicit pass and fail choices without numeric inputs. Derived average tasks receive no manual input and are configured per target engineer.
- **Task detail**: rubric items are ordered editable rows with add and delete actions. 각 항목은 선택적 구분과 0~10점별 평가기준 문구를 추가·수정·삭제하며 같은 점수 기준을 중복 저장하지 않는다. 평가자 참여 여부와 가중치는 과제가 아니라 엔지니어별 평가자 배정에서 관리한다.
- **Defaults**: create seasons in setup status, copy the current season task configuration by default, and start every evaluator assignment, engineer response, source record, and schedule empty. A copied season receives independent task IDs without automatically creating evaluator obligations.
- **Weight rule**: season task weights are defaults. Operators may override every task weight per engineer; 0% means the task is not applicable to that engineer, and only weights above 0% create evaluation obligations or contribute to the final score. Ranking stays unconfirmed until that engineer's applicable task total is exactly 100%.
- **Engineer-specific configuration**: OTS and DX are ordinary season tasks rather than one season-wide track. The operator selects an engineer, reviews all season tasks in one flat list, edits 0–100% weights in 0.1 increments, and saves the complete 100% allocation as one transaction.
- **States**: empty season, valid configuration, default allocation, engineer override, excluded task, weight total warning, task add/edit, delete confirmation, saving, saved, and newly selected.
- **Accessibility**: visible labels for every field, native date inputs, task-method descriptions, keyboard-operable rubric row actions, and text status for weight totals and P/F choices.
- **Responsive**: season form uses two columns on desktop and one column on mobile. Task summaries and engineer-specific weights stay flat; the task editor uses a scrollable Dialog with a fixed action footer on mobile, while the weight editor keeps its save action visible after the task list.

### Direct Score Source Editor

- **Structure**: engineer selection, automatic-conversion summary, language record list, certification list, and add/edit Dialog.
- **Language fields**: exam name, score or grade, acquired year-month, and note. Preserve score or grade as source text because formats differ by exam.
- **Certification fields**: certificate name is selected from the active season score table; grade or class, acquired year-month, and issuer remain supporting source fields. Grade and issuer may be left blank.
- **States**: populated, empty, validation error, saving, saved, delete confirmation, review pending, review complete, and disabled.
- **Review workflow**: an engineer-authored record starts in `검토 대기`. The operator can mark it `검토 완료` without changing the raw value; any later engineer edit returns it to `검토 대기`. Operator-authored and seed records are shown separately so the queue count remains actionable.
- **Traceability**: every record shows its latest update time and input source. The operator panel exposes a text summary of pending reviews and a record-level review action; the engineer portal exposes the same read-only status without operator controls.
- **Conversion**: certification score shows the top-three base sum, one highest current-year acquisition bonus even when outside the top three, and one current-year written-exam partial score. Language records show a converted value only when an operator-configured rule matches.
- **Score-table settings**: `자격·어학 평가표` is a separate operation tab. Certification rows expose name, category, difficulty, work relevance, base score, new-acquisition bonus, enabled state, edit, and delete. Language rules remain operator-editable without seeded score bands until a source table is supplied.
- **Impact preview**: 규칙 저장 전 현재 시즌 원천 기록을 새 규칙 집합으로 재계산해 영향을 받는 인원, 과제 환산점수 전후, 최종점수 전후를 표로 비교한다. 미확정 점수는 0점으로 대체하지 않는다.
- **Accessibility**: every input has a visible label; delete actions include the engineer and record names in their accessible labels.
- **Responsive**: desktop compares language and certification in two columns; mobile uses one column and full-width Dialog fields.

### Engineer Personal Portal

- **Structure**: 본인 식별 정보와 평가 시즌, 최종점수·과제별 원점수·반영점수, 어학 성적 목록, 자격증 목록을 한 페이지의 단일 스크롤 흐름에 배치한다.
- **Ownership**: 로그인 계정에 연결된 엔지니어 ID만 사용한다. URL이나 폼 값으로 다른 엔지니어 ID를 전달해도 저장소가 변경을 거부하며 전체 순위, 타인의 점수, 평가자 상세는 노출하지 않는다.
- **Source record input**: 어학은 영어/제2외국어 구분·시험명·현재 결과·전년도 동일 언어 결과·신규취득 여부·취득일을, 자격증은 평가표 선택값·등급·취득일·발급기관을 본인이 추가·수정·삭제한다. 저장 직후 현재 평가 시즌의 환산표로 점수를 다시 계산한다.
- **Language conversion**: 영어와 제2외국어 중 높은 기본점수를 선택하고, 전년 대비 등급 상향 가점은 1회, 제2외국어 IM1 이상 신규취득 가점은 1회 적용한다. 원점수와 가점 합이 100을 넘으면 과제 환산점수는 100으로 제한한다.
- **States**: loading, linked, no linked engineer, incomplete result, complete result, empty records, editing, validation error, saving, saved, delete confirmation, forbidden.
- **Clarity**: 자격증 기본합·신규취득 가산·필기 부분점수와 어학 환산표 미설정 또는 미일치 상태, 운영자 검토 대기를 텍스트로 표시한다.
- **Review feedback**: 본인이 입력한 어학·자격증 기록은 `운영자 검토 대기` 또는 `검토 완료`와 마지막 수정 시각을 함께 표시한다. 검토 완료 후 수정하면 다시 검토 대기로 전환된다.
- **Accessibility**: 모든 입력에 보이는 label과 오류 연결을 제공하고, 수정·삭제 행동의 접근 가능한 이름에 본인 이름과 기록명을 포함한다.
- **Responsive**: 768px 이상은 어학과 자격증을 두 열로 비교하고, 모바일은 점수 요약 뒤 원천 실적을 한 열로 재배치하며 Dialog 입력도 단일 열로 전환한다.

### Chart Panel

- **Structure**: title, explanation, directly labeled chart, table/text fallback.
- **States**: loading, empty, filtered.
- **Rules**: radar/pie 금지, 축 범위는 점수에서 항상 0~100.

### Relative Ranking Simulation

- **Structure**: compact cohort summary, engineer selection rail, left-low-to-right-high score curve, C/B/S-A vertical bands, cutoff lines, selected engineer detail, and an accessible ranking table.
- **Population rule**: 현재 시즌에서 하나 이상의 과제 반영점수가 있는 엔지니어를 기본 전원 선택한다. 미완료자의 현재 부분점수는 포함하되 `부분점수`로 표시한다. 반영점수가 전혀 없는 인원은 0점으로 대체하지 않고 선택 목록에서 `점수 없음` 비활성 상태로 남긴다.
- **Recalculation**: 개별 체크 변경은 선택 인원, 경쟁 순위, `순위 ÷ 선택 인원 × 100`으로 표시하는 상위 백분위, C 20%·B 50%·S/A 30% 인원, 커트라인, 경계 점수 차이, 경계 동점과 밀집 인원을 즉시 다시 계산한다. 등급은 운영 검토용 명목 구간이며 확정 고과로 표현하지 않는다.
- **Chart encoding**: X축은 선택 집단 내 하위에서 상위로, Y축은 0~100점으로 고정한다. 등급은 낮은 채도의 세로 배경과 직접 라벨로 중복 표현하고, 경계는 점선과 진입 점수로 표시한다. 선은 실제 점을 직선으로만 연결한다.
- **Tie handling**: 동일 점수는 공동 순위로 표시한다. 동점이 명목 등급 경계를 가르면 해당 점과 경고를 함께 표시하고 임의로 확정된 등급처럼 보이지 않게 한다.
- **Selection**: 전체 선택, 전체 해제, 검색, 팀·담당 필터, 필터 결과 선택을 제공한다. 개인 선택은 분석 세션 상태이며 시즌이 바뀌면 현재 시즌의 점수 보유자 전체로 초기화한다.
- **Responsive**: 모바일은 차트와 요약을 먼저 보여 주고 인원 선택은 Sheet로 이동한다. 데스크톱은 280px 선택 rail과 차트를 나란히 둔다. 차트는 가로 스크롤에 의존하지 않는다.
- **Accessibility**: 커트라인과 구간 정보는 hover 없이 노출하고, 점 툴팁의 이름·점수·순위·백분위·상태는 하단 시맨틱 표에서도 확인할 수 있어야 한다. 선택, 동점, 부분점수는 색상과 텍스트를 함께 사용한다.

### Analysis Insight Strip

- **Structure**: 한 개의 공유 표면 안에 변별 폭, 완료율 병목, 팀 격차 요약을 세로 구분선으로 배치한다.
- **Evidence**: 각 요약은 수치와 과제명, 표본 또는 비교 대상을 함께 표시하며 아래 시각화에서 근거를 확인할 수 있어야 한다.
- **Responsive**: 데스크톱은 3열, 모바일은 세로 목록으로 전환하고 항목 사이를 얇은 구분선으로 나눈다.

### Score Distribution Range

- **Structure**: 과제별 최소–최대 선, 1–3사분위 굵은 구간, 중앙값 점과 직접 수치 라벨을 사용한다.
- **Rules**: 모든 행은 공통 0~100 축을 사용하고 평균만으로 분포를 대표하지 않는다. 사분위는 선형 보간값임을 설명한다.
- **Accessibility**: 각 과제 행에 최소, 1사분위, 중앙값, 3사분위, 최대, 표본 수를 텍스트로 제공하고 상세 표 대안을 유지한다.

### Completion Bottleneck Bars

- **Structure**: 과제별 완료율을 0~100 공통 축의 가로 막대로 표시하고 완료 인원/대상 인원을 직접 라벨로 제공한다.
- **Rules**: 미완료를 0점으로 취급하지 않으며 현재 필터 대상자 수를 분모로 사용한다.
- **Accessibility**: 색상 외에 완료율, 분자, 분모를 항상 노출하고 상세 표 대안을 유지한다.

### Team Task Performance Matrix

- **Structure**: 팀 행과 과제 열의 시맨틱 표 안에 점수 과제는 평균, P/F 과제는 통과율, 시즌 전체 대비 편차, 확정 인원을 함께 표시한다.
- **Encoding**: 상승, 유사, 하락을 화살표·기호와 텍스트로 중복 표현하며 색상만으로 방향을 구분하지 않는다.
- **Responsive**: 모바일에서는 과제 열을 축소하지 않고 가로 스크롤하며 첫 번째 팀 열을 고정한다.

### Dialog / Sheet

- **Structure**: title, description, content, action footer.
- **States**: open, closing, submitting, error.
- **Accessibility**: 제목 필수, focus trap, Escape와 명시적 닫기 제공.
- **Depth**: overlay만 shadow 사용을 허용한다.

### Submitted Evaluation Unlock

- 제출 후 평가지는 잠긴 상태를 유지하며 평가자 입력은 비활성화한다.
- 운영자 대리 입력은 제출 상태에서도 잠그지 않고 계속 수정할 수 있다.
- 평가자는 잠긴 평가지에서 수정 사유를 입력해 잠금 해제를 요청한다. 운영자는 `평가 잠금 해제 요청` 화면에서 요청 사유를 확인한 뒤 잠금을 해제한다.
- 잠금 해제는 기존 점수를 보존한 채 초안 상태로 되돌리고 감사 이벤트를 남긴다.

### Operator Backup & Audit

- 운영자 전용 화면에서 현재 평가 데이터의 이름 있는 백업과 최근 변경 이력을 함께 제공한다.
- 백업 복구 전 현재 상태를 자동 백업하며, 복구는 현재 revision이 일치할 때만 실행한다.
- 백업 목록은 이름, revision, 생성 시각, 생성자를 직접 표시하고 복구는 확인 Dialog를 거친다.
- 변경 이력은 시각, 작업, 사용자, 대상, revision을 표로 제공하며 수정·삭제할 수 없다.

### Linked / Derived Score

- 운영자는 파생 평균형 과제마다 대상 엔지니어, 원천 평가 과제, 원천 엔지니어 목록을 설정한다.
- 원천 과제는 평가자 점수형 또는 평가자 P/F형으로 제한하고 파생 과제를 다시 원천으로 선택할 수 없어 순환·재귀 연결을 만들지 않는다.
- 선택된 원천 엔지니어의 해당 과제 공식 점수가 모두 확정된 경우에만 단순 평균을 산출한다. 일부 누락 상태에서는 제출자끼리 재정규화하지 않고 파생 과제를 미확정 처리한다.
- 대상 엔지니어별 가중치는 기존 개인별 과제 가중치에서 관리하며 파생 규칙 자체는 가중치를 보유하지 않는다.

### Printable Season Report

- 운영자와 승인자가 현재 시즌의 대상·완료 현황, 과제 평균, 최종 순위를 읽기 전용 문서 레이아웃으로 확인한다.
- 별도 안내문 생성 없이 브라우저 인쇄 기능으로 종이 또는 PDF 문서로 저장한다.
- 인쇄 시 앱 탐색, 상단 제어, 인쇄 버튼은 숨기고 보고서 제목·평가 기간·출력 시각·표 머리글을 유지한다.

## 6. Motion & Interaction

| Type | Duration | Easing | Usage |
|---|---:|---|---|
| Micro | `120ms` | `ease-out` | 버튼, 행 hover, focus |
| Standard | `160ms` | `ease-in-out` | Sheet, dialog, sidebar |
| Feedback | `240ms` | `ease-out` | 저장 상태와 toast 등장 |

### Rules

- `transform`, `opacity`, `filter`만 애니메이션한다.
- hover는 클릭 가능 요소에만 적용한다.
- `prefers-reduced-motion`에서는 필수 상태 전환 외 모션을 제거한다.
- 저장 상태는 색만 바꾸지 않고 텍스트를 함께 갱신한다.

## 7. Depth & Surface

### Strategy: industrial ledger

- 기본 페이지와 섹션은 border 없이 문서 흐름을 유지하고, 표·차트·입력 묶음에만 얇은 border와 tonal shift를 사용한다.
- 기본 패널에는 box shadow를 사용하지 않는다.
- Dialog, Dropdown, Sheet처럼 배경과 분리되어야 하는 overlay에만 `0 8px 24px rgb(17 24 32 / 0.14)`를 허용한다.
- radius는 상태 라벨 3px, 입력과 버튼 4px, 패널 4~6px, overlay 8px로 제한한다.
- 선택 행은 shadow와 왼쪽 강조선 대신 스틸 블루 텍스트, 낮은 채도의 배경, 짧은 우측 표식으로 표현한다.
