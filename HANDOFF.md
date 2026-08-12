# 엔지니어 역량평가 시스템 인수인계서

## 1. 문서 목적

이 문서는 `C:\llmwiki\engineer-evaluation-dashboard`의 개발·운영 맥락을 다음 Codex 대화에 넘기기 위한 기준 문서다. 동시에 이 시스템을 `DX 툴 활용` 과제로 정리할 때 사용할 수 있도록 문제 정의, 사용 도구, 구현 과정, 결과와 증빙 위치를 함께 기록한다.

독자는 이 문서만 읽고도 다음 작업을 시작할 수 있어야 한다.

- 현재 시스템의 목적과 주요 기능 파악
- 로컬 실행과 검증
- 프론트엔드와 Supabase 백엔드의 연결 구조 이해
- 변경 범위와 남은 위험 확인
- DX 과제 보고서 또는 발표자료 작성

## 2. 프로젝트 식별 정보

| 항목 | 내용 |
|---|---|
| 프로젝트 경로 | `C:\llmwiki\engineer-evaluation-dashboard` |
| 원격 저장소 | `https://github.com/beliefin/engineer-evaluation-dashboard.git` |
| 기본 브랜치 | `main` |
| 인수인계 기준 커밋 | `f18b1de` (`Support explicit zero-score declarations`) |
| 배포 주소 | <https://beliefin.github.io/engineer-evaluation-dashboard/> |
| 확인된 Pages 실행 | GitHub Actions `29826304142`, 성공 |
| Supabase 프로젝트 참조값 | `kwfjvafyjprbgfzvugnl` |
| 디자인 기준 | `DESIGN.md` |
| 프로젝트 개요·실행법 | `README.md` |

현재 작업 트리에는 `.omo/`가 추적되지 않은 상태로 남아 있다. 이 폴더는 작업 증적이므로 제품 배포 파일에 포함하지 않는다. 다른 변경이 보이면 사용자의 작업일 수 있으므로 임의로 되돌리지 않는다.

## 3. 해결하려던 문제

기존 평가는 엔지니어별 발표 과제, 평가자 수와 가중치, 직접 입력 점수, 평가 일정과 완료 여부를 여러 문서에서 따로 관리해야 했다. 이 과정에서 다음 문제가 발생할 수 있었다.

- 평가자별 점수와 가중치 합산을 반복 계산해야 함
- 엔지니어마다 다른 과제와 평가자를 배정하기 어려움
- 미평가, 일부 제출, 직접점수 누락을 한 화면에서 구분하기 어려움
- 시즌마다 달라지는 과제·문항·평가방식을 재사용하기 어려움
- 어학·자격증 원천 실적과 환산 결과의 추적이 어려움
- 운영자, 평가자, 승인자, 엔지니어에게 필요한 화면과 권한이 다름
- 상대평가, 과제별 순위, 팀별 현황과 경계 구간 분석을 수작업으로 수행해야 함

시스템의 목표는 평가 업무를 한 화면에 모으는 데 그치지 않는다. 평가 시즌 설정, 명단, 평가 의무, 점수 원천, 계산, 순위, 분석과 감사 이력을 하나의 데이터 흐름으로 연결해 운영자가 현재 상태와 다음 조치를 확인할 수 있게 하는 것이 목표다.

## 4. 구현 범위

### 역할별 기능

- 운영자: 시즌·과제·문항·가중치·명단·계정·평가자 배정·직접점수·일정·잠금 해제·백업·보고서 관리
- 평가자: 본인에게 배정된 평가 입력, 제출, 잠금 해제 요청, 당일 평가 대상 확인
- 승인자: 전체 현황, 개인 결과, 미평가 현황, 일정과 분석 열람
- 엔지니어: 본인 평가 결과 확인, 어학·자격증 원천 실적 입력
- 복합 역할: 평가자와 엔지니어 역할을 한 계정에 연결하고 사용 모드 전환
- 평가자 추가 권한: 운영자가 허용한 평가자에게 전체 현황·분석 열람 권한 부여

### 평가 모델

- 평가 시즌마다 과제, 반영 가중치, 평가방식과 평가 항목 수를 변경할 수 있다.
- 평가방식은 평가자 점수, 평가자 P/F, 운영자 점수, 운영자 P/F, 파생 평균을 지원한다.
- 평가 의무는 `엔지니어 × 과제 × 평가자` 배정이 저장될 때만 생성한다.
- 평가자 원시 가중치는 같은 엔지니어·과제 안에서 자동 정규화한다.
- 엔지니어별 과제 가중치를 별도로 설정할 수 있다. OTS와 DX도 일반 과제로 취급한다.
- 최종 순위는 적용 과제 가중치와 완료 상태를 기준으로 계산하며, 진행 중인 부분점수 순위와 확정 순위를 구분한다.
- 어학·자격증 기록이 비어 있으면 `미입력`이다. 사용자가 `보유 어학성적 없음` 또는 `보유 자격증 없음`을 명시한 경우에만 `noScore: true`와 0점으로 확정한다.

### 운영·분석 기능

- 생산 1팀·생산 2팀과 부문·팀·담당 조직 구조
- 담당명 직접 입력과 재선택
- 다중 발표자 일정 등록, 과제 연동, 평가자 바로가기
- 미평가 현황과 과제별 완료 상태
- 과제별 가중 평균·단순 평균, 팀별 비교와 평가자 편차
- 과제별 순위와 현재 종합 순위
- 선택 집단을 다시 계산하는 상대 서열 곡선과 S/A·B·C 명목 구간
- 경계 동점, 커트라인, 점수 밀집과 완료 병목 분석
- 개인 총점 가·감점과 연계·파생 점수
- 시즌 보고서 인쇄와 평가 결과 Excel 출력
- 이름 있는 백업, 복구와 변경 이력

## 5. 사용한 도구와 용도

### 기획·개발 지원

| 도구 | 사용 목적 |
|---|---|
| Codex | 요구사항 정리, 코드 탐색, 구현, 테스트, 오류 분석과 배포 작업 |
| `ultra-front` | 프론트엔드 구조, 반응형 화면과 접근성 검토 |
| `ultra-webdesign` | 화면 위계, 디자인 토큰, 상태 표현과 시각적 일관성 설계 |
| Figma 플러그인·Figma Community | 운영 화면의 정보 구조와 산업용 인터페이스 참고 |
| HyperUI·Tremor Blocks | 필터바, 상태 모니터링, 도구 모음과 표 패턴 참고 |
| Adobe Color | 스틸 블루 중심 색상 조화와 상태색 검토 |
| Select Codes | 계정 표, 필터 드롭다운, 탭 상호작용 참고 |

참고 UI의 코드를 그대로 복사하지 않았다. `DESIGN.md`에 정리한 색, 간격, 상태, 접근성 규칙에 맞춰 프로젝트 컴포넌트로 다시 구현했다.

### 프론트엔드

| 기술 | 역할 |
|---|---|
| Next.js 16 App Router | 페이지 라우팅, 서버·클라이언트 경계, GitHub Pages 정적 내보내기 |
| React 19·TypeScript | 컴포넌트와 도메인 타입 구현 |
| Tailwind CSS 4 | 반응형 레이아웃과 디자인 토큰 적용 |
| shadcn/ui·Radix UI | Dialog, Sheet, Select 등 접근 가능한 UI 기반 |
| TanStack Table | 순위·명단·현황 표의 정렬과 필터 |
| Recharts | 분포, 평균, 편차와 상대 서열 시각화 |
| React Hook Form·Zod | 입력 상태와 경계 검증 |
| Pretendard | 한국어 UI 글꼴 |
| `write-excel-file` | 시즌 결과와 과제별 데이터의 Excel 출력 |

### 백엔드·저장

| 기술 | 역할 |
|---|---|
| Supabase Auth | 로그인과 사용자 식별 |
| Supabase Postgres | 평가 상태, 계정 연결, 감사 이력과 백업 저장 |
| Row Level Security(RLS) | 테이블 직접 접근 제한 |
| Supabase Edge Functions | `evaluation-api`, `account-admin`의 역할별 조회·변경 처리 |
| LocalStorage 저장소 | 서버 없이 UI와 계산을 검증하는 로컬 샘플 모드 |
| `EvaluationRepository` | LocalStorage와 Supabase 저장 구현을 교체하는 공개 경계 |

### 품질·배포

| 도구 | 역할 |
|---|---|
| ESLint | 코드 규칙 검사 |
| TypeScript compiler | 정적 타입 검사 |
| Vitest·Testing Library | 계산, 저장소, ViewModel과 컴포넌트 테스트 |
| Playwright | 로그인, 평가 입력, 저장·새로고침과 핵심 사용자 흐름 검증 |
| axe-core | 브라우저 접근성 점검 |
| Git·GitHub | 변경 이력과 원격 저장소 관리 |
| GitHub Actions·GitHub Pages | `main` 푸시 후 Node.js 22 정적 빌드와 배포 |

## 6. 개발 과정

### 1단계: 평가 규칙 구조화

초기 요구사항의 35%·35%·10%·10%·10% 구조와 10개 문항 평가를 도메인 타입과 계산 함수로 분리했다. 평가자 가중 평균, 누락 평가, 공동순위, 최종 반올림 규칙을 테스트로 고정했다.

### 2단계: 로컬 프로토타입

Next.js 화면과 `EvaluationRepository`를 만들고 LocalStorage에 버전이 있는 스냅샷을 저장했다. 실제 개인정보 대신 샘플 데이터로 운영자·평가자·승인자 흐름을 먼저 확인했다.

### 3단계: 시즌 중심의 유연한 모델

고정 과제 구조를 평가 시즌, 과제, 평가방식, 문항, 엔지니어별 가중치로 일반화했다. P/F, 문항 수 변경, 과제 추가·삭제, OTS/DX 개인별 선택과 평가자 수 변경을 운영자가 설정하도록 확장했다.

### 4단계: 평가 의무와 일정 연결

과제에 평가자를 일괄 지정하는 방식에서 벗어나 엔지니어별 평가자 배정으로 변경했다. 발표 일정에 엔지니어·과제를 연결하고, 평가자는 당일 대상 또는 일정에서 평가 화면으로 바로 이동하도록 구성했다.

### 5단계: 인증·권한·실제 명단

운영자, 평가자, 승인자, 엔지니어 역할과 복합 역할을 추가했다. 사번 뒷자리 체계, 최초 비밀번호 변경 안내, 조직 분류와 실제 명단 연결을 반영했다. 운영자만 계정과 전체 평가 데이터를 관리하도록 서버 권한 경계를 만들었다.

### 6단계: Supabase 연결

LocalStorage 인터페이스를 유지한 채 Supabase 저장소, Auth, RLS, Edge Functions와 마이그레이션을 추가했다. 프론트엔드는 공개키로 접속하고 역할별 데이터 투영과 변경 허용은 Edge Function에서 판단하도록 설계했다.

### 7단계: 원천 실적과 환산

성장탐구계획서, OTS, DX 평가기준을 평가 항목별 세부 기준으로 입력했다. 자격증과 어학 평가표, 취득 년월, 신규취득 가산점, 규칙 변경 영향 미리보기와 엔지니어 본인 입력 기능을 추가했다. 기록 없음과 미입력을 구분하기 위해 명시적 0점 선언을 별도 상태로 구현했다.

### 8단계: 분석·보고·운영 안전

평가 완료 현황, 과제별 평균, 팀 비교, 순위, 상대평가 곡선, 경계 동점과 밀집 분석을 추가했다. Excel 출력, 인쇄 보고서, 백업·복구, 감사 이력과 평가 잠금 해제 흐름을 구현했다.

### 9단계: UI 재설계와 검증

반복 카드와 장식 아이콘을 줄이고 생산 현장의 운영 장부에 가까운 `Industrial Ledger` 디자인으로 정리했다. 390px, 768px, 데스크톱 화면과 키보드·상태 텍스트를 고려했다. 단위·컴포넌트·브라우저 테스트 후 GitHub Pages에 배포했다.

## 7. 코드 구조와 데이터 흐름

```text
사용자 화면
  └─ src/app, src/screens, src/features
       └─ src/providers/evaluation-actions.ts
            └─ EvaluationRepository
                 ├─ LocalStorage: src/repository/local-storage.ts
                 └─ Supabase: src/backend/*
                      └─ Edge Functions: supabase/functions/*
                           └─ Postgres·Auth·감사 로그

도메인 계산
  ├─ src/domain/scoring.ts
  ├─ src/domain/direct-score-rules.ts
  ├─ src/domain/derived-scores.ts
  └─ src/view-models/*
```

주요 디렉터리의 책임은 다음과 같다.

- `src/domain`: 평가 데이터 타입, 스키마, 계산과 마이그레이션
- `src/repository`: 저장소 인터페이스와 LocalStorage 변경 로직
- `src/backend`: Supabase 호출과 서버 저장소 어댑터
- `src/features`: 화면별 UI와 상호작용
- `src/view-models`: 화면 표시용 집계와 분석 계산
- `src/screens`: 페이지 단위 조합
- `supabase/migrations`: DB, RLS, 원자적 커밋과 역할 확장 이력
- `supabase/functions`: 역할별 API와 계정 관리
- `e2e`: 실제 브라우저 시나리오

## 8. 실행·검증·배포

### 로컬 실행

```powershell
cd C:\llmwiki\engineer-evaluation-dashboard
npm install
npm run dev
```

브라우저에서 `http://localhost:3000/login`을 연다. `.env.local`에 Supabase 값이 있으면 서버 모드, `NEXT_PUBLIC_BACKEND_MODE=local`이면 샘플 모드로 실행한다. `.env.local`의 키는 문서나 커밋에 복사하지 않는다.

### 검증

루트 운영 규칙상 아래 명령은 `C:\llmwiki\hermes_test`에서 실행한다.

```powershell
cd C:\llmwiki\hermes_test
npm --prefix ..\engineer-evaluation-dashboard run lint
npm --prefix ..\engineer-evaluation-dashboard run typecheck
npm --prefix ..\engineer-evaluation-dashboard run test
npm --prefix ..\engineer-evaluation-dashboard run build
npm --prefix ..\engineer-evaluation-dashboard run test:e2e
```

최근 명시적 0점 변경에서는 lint, typecheck, build와 관련 Vitest 4개 파일 31개 테스트가 통과했다. 새 Playwright 시나리오는 통과했으나, 기존 시나리오 일부에는 `<select>`에 `.fill()`을 사용하는 테스트 드리프트가 있었다. 전체 E2E를 다시 실행할 때는 실제 UI가 `<select>`이면 `selectOption()`으로 맞춘 뒤 결과를 기록한다.

### 프론트엔드 배포

`.github/workflows/pages.yml`은 `main` 푸시를 감지해 `npm ci`, `npm run build`, Pages 업로드를 실행한다. 현재 기준 커밋 `f18b1de`의 Pages 실행은 성공했고 배포 주소가 HTTP 200을 반환한 기록이 있다.

### 백엔드 배포 주의

`evaluation-api`가 ACTIVE version 20인 상태는 확인했지만, 마지막 명시적 0점 코드가 포함된 새 버전 배포와 실제 API 저장·재조회까지 성공했다는 증거는 남아 있지 않다. 당시 배포 시도에서 `Illegal return statement` 오류 기록이 있었다. 다음 백엔드 변경 전 아래 순서로 현재 상태를 다시 확인한다.

1. Supabase에서 `evaluation-api`의 현재 버전과 업데이트 시각 확인
2. 로컬 `supabase/functions/evaluation-api`와 배포본 비교
3. 테스트 계정으로 `noScore: true` 어학 또는 자격증 저장
4. 새로고침 후 0점과 선언 상태 재조회
5. Edge Function 로그와 감사 이벤트 확인

검증 전에는 “최신 백엔드 코드 배포 완료”라고 기록하지 않는다.

## 9. 유지보수 원칙

- 점수가 없는 상태를 임의로 0점으로 바꾸지 않는다.
- 평가 의무는 과제나 평가자 명단만으로 생성하지 않는다. 엔지니어별 배정이 기준이다.
- 시즌 과제 가중치 합계가 100%를 넘을 수 있어도 개인별 적용 가중치는 최종 계산 전에 100%여야 한다.
- 평가자별 점수와 가중치는 평가자 본인에게 노출하지 않는다.
- 운영자 권한 검사는 화면 숨김과 서버 검사를 함께 유지한다.
- 실제 직원 데이터, 인증 정보와 Supabase 키를 로그·문서·스크린샷에 남기지 않는다.
- 현재 작업 트리의 사용자 변경을 임의로 되돌리지 않는다.
- GitHub Pages는 정적 프론트엔드다. 데이터 저장 성공 여부는 Supabase API까지 별도로 확인한다.
- 새로운 UI는 `DESIGN.md`의 토큰과 상태 규칙을 먼저 갱신한 뒤 구현한다.

## 10. 남은 운영 전환 항목

- Supabase Edge Function 최신 코드 재배포와 명시적 0점 API 연동 시험
- 전체 Playwright 회귀 시험의 오래된 선택자 정리
- 실제 SSO 또는 조직 계정 정책 결정
- 개인정보 보존·파기, 권한 검토와 계정 퇴직 처리 기준
- 백업 복구 훈련과 복구 시간 기록
- 운영자 감사 로그의 정기 점검 절차
- 평가 시즌 종료·잠금·정정 이력에 대한 운영 규정
- 상대평가 구간을 실제 고과 등급으로 확정할 경우 동점·예외 처리 규정

## 11. DX 툴 활용 과제 작성 방향

### 추천 과제명

`평가 운영 데이터의 통합과 상대평가 분석을 위한 엔지니어 역량평가 시스템 구축`

### 보고서 서사

1. **현행 문제**: 명단, 평가표, 점수, 일정과 순위를 분리 관리해 누락 확인과 재계산에 시간이 소요됨
2. **개선 목표**: 시즌 설정부터 평가 입력, 집계, 분석과 보고까지 하나의 흐름으로 연결
3. **도구 선정**: Codex로 요구사항·코드·테스트를 반복 개선하고, Next.js와 Supabase로 웹·데이터 계층 구현
4. **핵심 구현**: 유연한 과제 모델, 엔지니어별 평가자 배정, 역할별 화면, 자동 환산과 분석
5. **검증 방법**: 단위 테스트, 실제 브라우저 흐름, 모바일 확인, 빌드·배포 로그
6. **성과 지표**: 미평가 확인 시간, 점수 재계산 작업, 명단·일정 중복 입력, 보고서 작성 시간을 도입 전후로 측정
7. **한계와 후속 계획**: 실제 운영 기간의 사용자 피드백, SSO, 데이터 보존 정책과 백업 훈련

### 확보할 증빙

- 요구사항 변화가 드러나는 Git 커밋 이력
- `DESIGN.md`의 UI 의사결정
- 주요 화면의 데스크톱·모바일 전후 스크린샷
- 평가 입력 → 저장 → 대시보드 반영 화면 녹화 또는 연속 캡처
- Vitest·Playwright·GitHub Actions 성공 결과
- Supabase 테이블·Edge Function 구조도. 실제 계정과 점수는 가림 처리
- 도입 전 수작업 절차와 도입 후 절차의 단계 수·소요 시간 비교

성과 수치는 실제 운영 측정 전에는 예상값으로 표기한다. “업무시간을 몇 % 절감했다” 같은 문구는 측정값이 확보된 뒤 확정한다.

## 12. 다음 대화 시작문

새 Codex 대화에서 아래 문장을 그대로 사용한다.

```text
C:\llmwiki\engineer-evaluation-dashboard\HANDOFF.md를 먼저 읽고 프로젝트를 이어서 진행해줘.
현재 기준 커밋은 f18b1de이고 프론트엔드는 GitHub Pages에 배포되어 있다.
Supabase evaluation-api의 최신 코드 반영은 인수인계서의 주의사항에 따라 재검증해야 한다.
이번 대화의 목표는 [유지보수할 기능 또는 DX 과제 문서 작성]이다.
기존 사용자 변경과 .omo 폴더는 건드리지 말고, 수정 전 git status를 확인해줘.
```

DX 과제 문서 작성을 바로 시작하려면 마지막 두 문장을 다음과 같이 바꾼다.

```text
이번 대화의 목표는 이 시스템 구축 과정을 DX 툴 활용 과제 보고서와 발표자료로 정리하는 것이다.
HANDOFF.md, README.md, DESIGN.md와 Git 커밋 이력을 근거로 사용하고, 실제로 측정하지 않은 성과 수치는 추정이라고 표시해줘.
```

## 용어 메모

- **DX(Digital Transformation)**: 디지털 기술로 업무 절차, 데이터 흐름과 의사결정 방식을 개선하는 활동.
- **App Router**: Next.js에서 폴더 구조로 페이지, 레이아웃과 오류 화면을 구성하는 라우팅 방식.
- **RLS(Row Level Security)**: 데이터베이스 행 단위로 조회·변경 권한을 제한하는 정책.
- **Edge Function**: Supabase에서 인증된 API 로직을 실행하는 서버 함수.
- **Repository**: 화면이 저장 방식에 직접 의존하지 않도록 데이터 읽기·변경 경계를 정의한 계층.
- **ViewModel**: 원본 데이터를 화면 표시와 분석에 맞게 집계한 구조.
- **E2E(End-to-End) 테스트**: 로그인부터 저장·조회까지 실제 사용자 흐름을 브라우저에서 확인하는 테스트.
- **명시적 0점**: 기록이 없는 상태와 구분하여 사용자가 보유 실적 없음을 직접 선언한 확정 점수.
