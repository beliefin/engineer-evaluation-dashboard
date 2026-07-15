# Engineer Evaluation Dashboard Design System

## 1. Atmosphere & Identity

정밀하고 조용한 평가 운영실. 화면은 많은 수치를 다루되 사용자가 항상 현재 상태와 다음 행동을 즉시 찾을 수 있어야 한다. 시그니처는 얇은 인디고 선택선과 장부처럼 정렬된 표 구조다. 장식보다 계층, 간격, 정렬, 상태 색으로 신뢰를 만든다. 첫 번째 참조는 승인된 라이트 대시보드 시안이며, Linear의 명확한 정보 계층을 제품 맥락에 맞게 재구성한다.

## 2. Color

### Palette

| Role | Token | Light | Usage |
|---|---|---|---|
| Canvas | `--background` | `#F7F8FB` | 앱 전체 배경 |
| Surface | `--card` | `#FFFFFF` | 표, 입력, 주요 패널 |
| Rail | `--sidebar` | `#FBFCFE` | 좌측 탐색 영역 |
| Muted surface | `--muted` | `#F1F3F7` | 비활성 행, 보조 영역 |
| Text primary | `--foreground` | `#171A21` | 제목, 본문, 수치 |
| Text secondary | `--muted-foreground` | `#545E6D` | 설명, 메타데이터 |
| Border default | `--border` | `#DDE2EA` | 패널, 표, 입력 경계 |
| Border subtle | `--border-subtle` | `#E9ECF2` | 행과 그룹 구분 |
| Accent primary | `--primary` | `#4056E8` | 현재 위치, 주 행동, 포커스 |
| Accent hover | `--primary-hover` | `#3045C9` | 주 행동 hover |
| Accent soft | `--accent` | `#EEF1FF` | 선택 행, 강조 배경 |
| Success | `--success` | `#08724C` | 제출 완료, 저장 완료 |
| Success soft | `--success-soft` | `#EAF7F1` | 완료 배지 배경 |
| Warning | `--warning` | `#8A4B00` | 진행 중, 확인 필요 |
| Warning soft | `--warning-soft` | `#FFF4DE` | 경고 배지 배경 |
| Danger | `--destructive` | `#C43D38` | 미완료, 파괴적 행동 |
| Danger soft | `--danger-soft` | `#FFF0EF` | 오류 배지 배경 |
| Chart primary | `--chart-1` | `#4056E8` | 주요 점수 계열 |
| Chart secondary | `--chart-2` | `#7B8CFB` | 보조 계열 |
| Chart neutral | `--chart-3` | `#A7B0C0` | 기준 및 미확정 계열 |
| Chart completion | `--chart-4` | `#0F845C` | 완료율과 완료 계열 |
| Chart caution | `--chart-5` | `#A96300` | 편차와 점검 계열 |

### Rules

- 색은 상호작용과 상태를 설명할 때만 사용한다.
- 완료, 경고, 오류는 색상과 텍스트 또는 아이콘을 함께 제공한다.
- 원색은 작은 면적에만 사용하고 넓은 배경은 soft 토큰을 사용한다.
- 새로운 색이 필요하면 먼저 이 표에 의미와 사용처를 추가한다.

## 3. Typography

### Scale

| Level | Size | Weight | Line height | Tracking | Usage |
|---|---:|---:|---:|---:|---|
| Page title | `30px` | 700 | 1.25 | `-0.025em` | 화면 제목 |
| H1 | `26px` | 700 | 1.3 | `-0.02em` | 주요 결과 수치 |
| H2 | `20px` | 650 | 1.4 | `-0.015em` | 섹션 제목 |
| H3 | `16px` | 650 | 1.45 | `-0.01em` | 패널 제목 |
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
- 점수 입력 화면의 제출 행동은 모바일 하단에 고정한다.

## 5. Components

### App Shell

- **Structure**: sidebar navigation, top bar, main landmark, mobile sheet.
- **States**: expanded, collapsed, active route, mobile open/closed, operator proxy evaluator selected, authenticated identity, logging out.
- **Accessibility**: 현재 경로는 `aria-current`, 모바일 메뉴는 제목이 있는 Sheet로 제공한다.
- **Motion**: sidebar와 sheet는 180ms transform/opacity만 사용한다.
- **Authentication**: 데모 역할 전환기를 노출하지 않는다. 로그인 계정의 역할을 메뉴·페이지 권한의 단일 기준으로 사용하고, 실제 계정명·역할·로그아웃 행동을 데스크톱과 모바일에서 항상 확인할 수 있게 한다.
- **Evaluator identity**: 평가자 계정은 연결된 평가자 본인으로 고정한다. 운영자만 평가 입력 화면에서 대리 입력할 평가자를 선택할 수 있다.
- **Engineer identity**: 엔지니어 계정은 등록된 엔지니어 한 명과 고정 연결한다. 개인 포털에서는 연결된 본인의 결과와 원천 실적만 조회·변경할 수 있다.

### Login Surface

- **Structure**: 제품명과 샘플 인증 안내, 아이디·비밀번호 필드, 로그인 행동, 샘플 계정 안내를 하나의 집중된 표면에 배치한다.
- **States**: initial, validating, authenticating, invalid credentials, inactive account, authenticated redirect, storage error.
- **Security copy**: 현재 버전은 브라우저 LocalStorage 기반 샘플 인증이며 실제 운영 보안을 제공하지 않는다는 문구를 로그인 화면에 지속 표시한다. 비밀번호는 저장소에 평문으로 기록하지 않는다.
- **Accessibility**: 보이는 label, `autocomplete="username"`와 `autocomplete="current-password"`, 오류 요약 `role="alert"`, 제출 중 상태 텍스트, 논리적인 키보드 순서를 제공한다.
- **Responsive**: 768px 이상은 인증 폼과 샘플 계정 안내를 두 열로 비교하고, 모바일은 폼을 먼저 보여 주는 단일 열로 전환한다.

### Account Management

- **Structure**: 운영자 전용 페이지 헤더, 전체·활성·역할별 요약, 계정 표/모바일 목록, 계정 생성·편집·비밀번호 재설정·활성 전환·삭제 Dialog.
- **Fields**: 아이디, 표시 이름, 역할, 역할별 연결 대상, 활성 상태. 평가자는 등록 평가자 한 명, 엔지니어는 등록 엔지니어 한 명과 반드시 연결하며 운영자·승인자는 연결값을 제거한다.
- **Permissions**: 운영자만 계정 목록과 모든 변경 행동을 사용할 수 있다. 평가자·승인자·엔지니어는 경로·메뉴·계정 데이터 모두 접근할 수 없다.
- **Safety states**: 현재 로그인한 운영자는 자신의 역할 변경·비활성화·삭제를 할 수 없고, 마지막 활성 운영자도 제거할 수 없다. 아이디 중복, 비밀번호 규칙, 역할별 대상 미연결을 필드 오류로 제공한다.
- **States**: loading, empty, populated, creating, editing, resetting password, enabling, disabling, deleting, saved, validation error, forbidden.
- **Accessibility**: 각 행의 행동은 계정명을 포함한 접근 가능한 이름을 사용하고, Dialog 제목·설명·오류 연결·초점 복귀를 유지한다. 활성 상태는 색과 함께 텍스트 배지를 제공한다.
- **Responsive**: 데스크톱은 아이디·이름·역할·연결·상태·행동 열을 유지하고, 모바일은 계정 단위 목록과 전체 폭 행동으로 재구성한다.

### Roster Management

- **Edit and delete**: 엔지니어 행에는 수정과 삭제 행동을 제공한다. 수정은 엔지니어 ID와 기존 평가 기록을 유지하며, 삭제는 연결 데이터 범위를 명시한 확인 Dialog를 거친다.
- **Safety states**: 평가 시즌 잠금 중에는 명단 변경을 막고, 로그인 계정이 연결된 엔지니어는 삭제를 비활성화하면서 `계정 연결됨` 사유를 항상 보이는 텍스트로 표시한다.
- **Validation**: 수정 입력 오류는 해당 필드의 `aria-invalid`와 `aria-describedby`로 연결한다. 삭제 확인은 엔지니어 이름, 연관 데이터 삭제 범위, 복구 불가 안내를 포함한다.
- **Responsive actions**: 데스크톱 표와 모바일 카드 모두 동일한 수정·삭제 행동을 제공하며, Dialog는 390px 화면 안에서 가로 넘침 없이 동작해야 한다.

- **Structure**: 엔지니어·평가자 탭, 현재 명단, 개별 등록 폼, 목록 붙여넣기 Dialog.
- **Teams**: 모든 팀 선택은 `생산 1팀`, `생산 2팀`만 제공한다.
- **States**: empty, populated, valid preview, row error, duplicate code, saving, saved.
- **Accessibility**: 일괄 등록 오류는 행 번호와 원인을 텍스트로 제공하고 오류가 있으면 확정 행동을 비활성화한다.
- **Responsive**: 데스크톱 표는 모바일에서 사번·이름·팀 중심 목록으로 전환한다.

### Pending Evaluation Board

- **Structure**: 미배정·미시작·진행 중·직접점수 대기 지표, 검색·팀·상태 필터, 다음 작업 링크.
- **States**: actionable rows, filtered empty, fully complete empty.
- **Accessibility**: 진행률 수치와 누락 사유를 색상 외 텍스트로 함께 표시한다.
- **Permissions**: 운영자는 평가 또는 직접점수 입력으로 이동하고 승인자는 엔지니어 상세만 열람한다.

### Evaluation Calendar

- **Structure**: 월 이동, 요일 헤더, 날짜 셀의 직접 라벨 일정, 예정 일정 목록, 등록·수정 Dialog.
- **States**: empty month, populated month, selected event, read-only approver, validation error.
- **Accessibility**: 날짜·시간 입력은 네이티브 컨트롤을 사용하고 이벤트 정보는 hover 없이 읽을 수 있어야 한다.
- **Responsive**: 데스크톱 월간 그리드, 모바일 날짜별 agenda 목록으로 재구성한다.
- **Permissions**: 운영자는 생성·수정·삭제, 승인자는 조회만 가능하다.

### Page Header

- **Structure**: breadcrumb/context, title, description, action group.
- **Variants**: standard, compact.
- **Spacing**: `--space-2`, `--space-6`.
- **States**: actions disabled/loading.

### Metric Strip

- **Structure**: 한 개의 공유 표면 안에 세로 구분선으로 KPI를 나눈다.
- **Variants**: neutral, success, warning, danger value.
- **States**: loading skeleton, empty zero, populated.
- **Accessibility**: 값과 단위를 하나의 읽기 순서로 제공한다.

### Data Panel

- **Structure**: header, optional controls, content, optional footer.
- **Variants**: bordered, flush-table.
- **States**: default, loading, empty, error.
- **Depth**: 기본은 border와 tonal shift, shadow 금지.

### Filter Bar

- **Structure**: search, select groups, reset action.
- **Variants**: desktop inline, mobile Sheet.
- **States**: default, focused, active filter, disabled.
- **Accessibility**: 모든 입력에 보이는 레이블 또는 접근 가능한 이름을 제공한다.

### Data Table / Mobile Result List

- **Structure**: semantic table on desktop, result cards on mobile.
- **States**: sort ascending/descending, selected row, loading, empty.
- **Accessibility**: 정렬 버튼에 상태를 설명하고 행 전체 클릭과 명시적 링크를 함께 제공한다.
- **Numeric rule**: 점수와 순위는 오른쪽 정렬, tabular nums.

### Status Badge

- **Variants**: completed, progress, pending, unconfirmed, locked.
- **States**: static only; interactive chip으로 오인되지 않게 hover 효과를 주지 않는다.
- **Accessibility**: 색상 외에 상태 텍스트와 아이콘을 함께 제공한다.

### Score Input Row

- **Structure**: item index, neutral item label, number input, validation message.
- **States**: default, focus, invalid, saved, locked, disabled.
- **Accessibility**: label과 설명을 input에 연결하고 오류 시 `aria-invalid`를 제공한다.
- **Mobile**: 한 행을 label 위, input 아래의 단일 열로 전환한다.

### Evaluation Season & Task Configurator

- **Structure**: current season summary, create action, season name, period, status, configuration-copy option, weight-total status, and a flat task list. Each task opens one editor for name, evaluator guidance, overall weight, evaluation method, rubric items, and evaluator weights.
- **Evaluation methods**: evaluator score, evaluator P/F, operator score, and operator P/F. Score tasks normalize any count of 0–10 rubric items to 0–100. P/F tasks expose explicit pass and fail choices without numeric inputs.
- **Task detail**: rubric items are ordered editable rows with add and delete actions. Evaluator tasks show the registered evaluator list with participation checkboxes and positive raw weights; operator tasks hide evaluator configuration.
- **Defaults**: create seasons in setup status, copy the current season configuration by default, and start every engineer response, source record, and schedule empty. A copied season receives independent task IDs and draft sheets.
- **Weight rule**: season task weights are defaults. Operators may override every task weight per engineer; 0% means the task is not applicable to that engineer, and only weights above 0% create evaluation obligations or contribute to the final score. Ranking stays unconfirmed until that engineer's applicable task total is exactly 100%.
- **Engineer-specific configuration**: OTS and DX are ordinary season tasks rather than one season-wide track. The operator selects an engineer, reviews all season tasks in one flat list, edits 0–100% weights in 0.1 increments, and saves the complete 100% allocation as one transaction.
- **States**: empty season, valid configuration, default allocation, engineer override, excluded task, weight total warning, task add/edit, delete confirmation, no evaluator selected, saving, saved, and newly selected.
- **Accessibility**: visible labels for every field, native date inputs, task-method descriptions, keyboard-operable rubric row actions, and text status for weight totals and P/F choices.
- **Responsive**: season form uses two columns on desktop and one column on mobile. Task summaries and engineer-specific weights stay flat; the task editor uses a scrollable Dialog with a fixed action footer on mobile, while the weight editor keeps its save action visible after the task list.

### Direct Score Source Editor

- **Structure**: engineer selection, automatic-conversion deferred notice, language record list, certification list, and add/edit Dialog.
- **Language fields**: exam name, score or grade, acquired date, and note. Preserve score or grade as source text because formats differ by exam.
- **Certification fields**: certificate name, grade or class, acquired date, and issuer. Grade and issuer may be left blank.
- **States**: populated, empty, validation error, saving, saved, delete confirmation, review pending, review complete, and disabled.
- **Review workflow**: an engineer-authored record starts in `검토 대기`. The operator can mark it `검토 완료` without changing the raw value; any later engineer edit returns it to `검토 대기`. Operator-authored and seed records are shown separately so the queue count remains actionable.
- **Traceability**: every record shows its latest update time and input source. The operator panel exposes a text summary of pending reviews and a record-level review action; the engineer portal exposes the same read-only status without operator controls.
- **Separation**: source records and 0–100 converted scores use separate panels, with a persistent text notice that no automatic conversion is applied.
- **Accessibility**: every input has a visible label; delete actions include the engineer and record names in their accessible labels.
- **Responsive**: desktop compares language and certification in two columns; mobile uses one column and full-width Dialog fields.

### Engineer Personal Portal

- **Structure**: 본인 식별 정보와 평가 시즌, 최종점수·과제별 원점수·반영점수, 어학 성적 목록, 자격증 목록을 한 페이지의 단일 스크롤 흐름에 배치한다.
- **Ownership**: 로그인 계정에 연결된 엔지니어 ID만 사용한다. URL이나 폼 값으로 다른 엔지니어 ID를 전달해도 저장소가 변경을 거부하며 전체 순위, 타인의 점수, 평가자 상세는 노출하지 않는다.
- **Source record input**: 어학은 시험명·점수 또는 등급·취득일·메모, 자격증은 명칭·등급·취득일·발급기관을 본인이 추가·수정·삭제한다. 원천 실적 입력은 운영자 환산 점수를 자동으로 바꾸지 않는다.
- **States**: loading, linked, no linked engineer, incomplete result, complete result, empty records, editing, validation error, saving, saved, delete confirmation, forbidden.
- **Clarity**: 환산식 미적용과 운영자 검토 대기를 지속 표시하고, 최종점수 미확정 원인을 과제별 완료 상태로 확인할 수 있게 한다.
- **Review feedback**: 본인이 입력한 어학·자격증 기록은 `운영자 검토 대기` 또는 `검토 완료`와 마지막 수정 시각을 함께 표시한다. 검토 완료 후 수정하면 다시 검토 대기로 전환된다.
- **Accessibility**: 모든 입력에 보이는 label과 오류 연결을 제공하고, 수정·삭제 행동의 접근 가능한 이름에 본인 이름과 기록명을 포함한다.
- **Responsive**: 768px 이상은 어학과 자격증을 두 열로 비교하고, 모바일은 점수 요약 뒤 원천 실적을 한 열로 재배치하며 Dialog 입력도 단일 열로 전환한다.

### Chart Panel

- **Structure**: title, explanation, directly labeled chart, table/text fallback.
- **States**: loading, empty, filtered.
- **Rules**: radar/pie 금지, 축 범위는 점수에서 항상 0~100.

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

### Deferred Controls

- 제출 평가지 재오픈 저장소 기능은 보존하지만 현재 운영 UI에서는 노출하지 않는다.
- 제출 후 평가지에는 “현재 버전에서는 수정할 수 없음”을 명시하고 비활성 입력 상태를 유지한다.

## 6. Motion & Interaction

| Type | Duration | Easing | Usage |
|---|---:|---|---|
| Micro | `120ms` | `ease-out` | 버튼, 행 hover, focus |
| Standard | `180ms` | `ease-in-out` | Sheet, dialog, sidebar |
| Feedback | `240ms` | `ease-out` | 저장 상태와 toast 등장 |

### Rules

- `transform`, `opacity`, `filter`만 애니메이션한다.
- hover는 클릭 가능 요소에만 적용한다.
- `prefers-reduced-motion`에서는 필수 상태 전환 외 모션을 제거한다.
- 저장 상태는 색만 바꾸지 않고 텍스트를 함께 갱신한다.

## 7. Depth & Surface

### Strategy: constrained mixed

- 기본 페이지, 표, 패널, 입력은 얇은 border와 작은 tonal shift만 사용한다.
- 기본 패널에는 box shadow를 사용하지 않는다.
- Dialog, Dropdown, Sheet처럼 배경과 분리되어야 하는 overlay에만 `0 8px 24px rgb(23 26 33 / 0.12)`를 허용한다.
- radius는 입력과 버튼 6px, 패널 8px, overlay 10px로 제한한다.
- 선택 행은 shadow 대신 인디고 왼쪽 선과 accent soft 배경을 사용한다.
