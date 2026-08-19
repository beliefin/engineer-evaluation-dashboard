# 엔지니어 역량평가 시스템 핵심 보안 점검 기준

- 점검일: 2026-08-19
- 점검 대상: `C:\llmwiki\engineer-evaluation-dashboard`
- 기준 Git SHA: `affd3a4ebdc87e3002ec4e901c712945d7269b20`
- 보완 상태: 로컬 작업 트리와 연결된 Supabase 프로젝트에 반영
- 최종 판정: **PASS**
- 미해결 Critical / High: **0건**

## 1. 점검 범위

운영 영향이 큰 인증, 권한, 평가 데이터 무결성, 동시 저장, Supabase RLS·RPC·Edge Function, 감사·백업, Secret 노출, 의존성 및 GitHub Pages 배포 경계를 우선 점검했다. 보안 관련 파일 63개와 원격 Supabase 함수·마이그레이션·권한 메타데이터를 확인했다.

초기 비밀번호 4자리 정책과 최초 로그인 시 비밀번호 강제 변경은 사용자의 명시적 결정에 따라 이번 보완에서 제외했다. 비밀번호, API key, token, secret 및 개인정보 값은 이 문서에 기록하지 않는다.

## 2. 확인 및 보완 결과

| ID | 원래 위험도 | 확인 내용 | 보완 내용 | 상태 |
| --- | --- | --- | --- | --- |
| SEC-01 | High | 엔지니어가 입력한 미검증 어학·자격 기록이 공식 점수와 순위에 반영될 수 있음 | 최신 감사 이벤트로 검증 상태를 판정하고 미검증 기록을 직접점수·완료·순위 계산에서 제외 | 완료 |
| SEC-02 | High | 배포 의존성에 알려진 Next.js 취약 버전 존재 | Next.js와 `eslint-config-next`를 16.3.1로 갱신하고 npm audit 0건 확인 | 완료 |
| SEC-03 | Medium | 점수표 저장 중 시즌 잠금·평가자 배정 변경이 발생할 때 최신 권한 재검증 부족 | `commit_evaluation_sheet`가 DB 행 잠금 후 assignment, evaluator link, cycle lock, 제출 잠금을 재검증 | 완료 |
| SEC-04 | Medium | snapshot 충돌 복구 후 큐에 남은 이전 세대 명령이 재전송될 가능성 | write generation을 도입해 충돌 이전 세대 명령을 서버 전송 전에 취소 | 완료 |
| SEC-05 | Medium | 어학·자격 원천 기록을 반복 생성해 단일 snapshot을 과도하게 키울 가능성 | 시즌·엔지니어별 언어 10건, 자격 30건, 원천 기록 변경 200회의 서버측 상한 적용 | 완료 |
| SEC-06 | Medium | 운영 감사 이벤트의 actor·시각이 클라이언트 값에 의존하고 계정 감사 실패가 fail-open | 기존 감사 이벤트 불변 검증, 서버 actor·시각 확정, 계정 변경 전 사전 감사 실패 시 작업 중단 | 완료 |
| SEC-07 | Medium | 분석 권한 평가자에게 일정·잠금 요청·감사 기록 등 불필요한 운영 데이터까지 투영 | 분석·개인 상세에 필요한 필드만 허용 목록으로 반환하고 운영 데이터 제외 | 완료 |

## 3. 주요 보완 지점

- 검증된 원천 기록 판정: `src/domain/source-record-verification.ts`, `src/domain/scoring.ts`
- 원천 기록 상한: `src/repository/source-record-actions.ts`, `supabase/functions/evaluation-api/mutations.ts`
- 충돌 후 이전 쓰기 취소: `src/providers/evaluation-provider.tsx`
- 분석 권한 데이터 최소화: `supabase/functions/evaluation-api/projection.ts`
- 운영 감사 무결성: `supabase/functions/evaluation-api/mutations.ts`, `supabase/functions/account-admin/index.ts`
- 최신 점수표 권한 재검증: `supabase/migrations/20260819093000_recheck_score_sheet_authorization.sql`
- RPC 오류 경계: `supabase/functions/evaluation-api/state-store.ts`
- 의존성 보완: `package.json`, `package-lock.json`

## 4. 원격 Supabase 확인

- 프로젝트 식별자: `kwfjvafyjprbgfzvugnl`
- `evaluation-api`: version 28, ACTIVE, JWT 검증 활성
- `account-admin`: version 11, ACTIVE, JWT 검증 활성
- `bootstrap-evaluation-admin`: version 4, ACTIVE, JWT 검증 활성, 현재 요청은 410으로 종료
- 적용 마이그레이션: 원격 version `20260819112243`, `recheck_score_sheet_authorization`
- `commit_evaluation_sheet`: SECURITY INVOKER, 빈 `search_path`, `service_role`만 실행 가능
- 비인증 `evaluation-api` 및 `account-admin` 요청: 401 확인
- `evaluation_state_backups`: RLS 활성, 클라이언트 정책 없음. 직접 접근을 허용하지 않는 의도된 deny-by-default 구성

## 5. 검증 결과

| 검증 | 결과 |
| --- | --- |
| 보안 집중 단위 테스트 | 19/19 통과 |
| 전체 Vitest | 98 files / 396 tests 통과 |
| ESLint | 통과 |
| TypeScript typecheck | 통과 |
| Next.js production build | 통과, 20개 정적 페이지 생성 |
| `npm audit --omit=dev` | 취약점 0건 |
| Secret 패턴 검사 | 실제 secret 값 노출 없음 |
| Codex Security 표준 스캔 | 7건 확인·보완, scan `312f13c6-2631-44a5-9100-6c202cb294ab` 완료 |

## 6. 잔여 위험 및 후속 검토

1. **비밀번호 정책**: 이번 범위에서 의도적으로 제외. 전체 사용자가 비밀번호를 변경하는 운영 시점에 leaked-password 차단, 최초 변경 강제, 재설정 절차를 함께 재검토할 것.
2. **고위험 운영 작업 재인증**: 계정 삭제, 대량 초기화, 복구 등에는 향후 AAL2 또는 최근 로그인 확인을 추가할 가치가 있음.
3. **대규모 확장**: 현재 단일 JSON snapshot은 현 규모에서는 단순하고 원자적으로 관리되지만, 인원과 기록이 크게 증가하면 관계형 테이블 분리와 인프라 수준 rate limit 검토가 필요함.
4. **실사용자 라이브 E2E**: 자격증명을 사용하지 않아 인증된 실제 계정 기반의 종단 검증은 수행하지 않음. 비인증 차단, 서버 메타데이터, 로컬 전체 테스트 및 빌드로 대체 확인함.
5. **리더 평가자 권한**: 지정된 세 명의 리더 평가자가 원시 평가 상세를 조회하는 것은 사용자 요구에 따른 의도된 권한. 쓰기 권한은 기존과 같이 본인 배정 범위로 제한하며, 분석에 불필요한 운영 데이터는 제거함.

## 7. 판정 기준

현재 수정본과 확인한 원격 Supabase 상태에서 이번 범위의 Critical·High 미해결 항목은 없다. Medium 항목도 모두 직접 보완됐다. 명시적으로 연기한 비밀번호 정책과 향후 확장성·강화 항목은 운영 전 후속 점검 대상으로 관리한다.
