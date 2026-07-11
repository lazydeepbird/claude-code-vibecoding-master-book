# ai-chat 구축 실행 계획 (TODO)

`PRD.md`를 기준으로 한 단계별 구축 체크리스트. `[x]`는 완료, `[ ]`는 남은 작업이다.

---

## Phase 0. 프로젝트 스캐폴딩
- [x] `package.json` 구성 (Next.js 15 · React 18 · TS · Tailwind · `@anthropic-ai/sdk` · `react-markdown` · `remark-gfm` · Vitest)
- [x] `tsconfig.json` (`@/*` 경로 별칭 포함)
- [x] `next.config.js`
- [x] `tailwind.config.js` (`darkMode: 'class'`) · `postcss.config.js`
- [x] `.eslintrc.json` (`next/core-web-vitals`)
- [x] `.gitignore` (`.env.local` 무시로 API 키 커밋 방지)
- [x] `.env.local.example` (환경변수 템플릿)
- [x] `src/app/globals.css` (Tailwind 지시자 + 마크다운 최소 스타일)

## Phase 1. 타입 정의 (단일 진실 공급원)
- [x] `src/types/chat.ts` — `Role`, `ChatMessage`, `Conversation`, `ApiMessage`

## Phase 2. 서버 라우트 (Claude 연동)
- [x] `src/app/api/chat/route.ts` — `POST` 핸들러
  - [x] `ANTHROPIC_API_KEY` 미설정 시 500 + 안내 메시지
  - [x] 요청 본문 / `messages` 배열 유효성 검사
  - [x] `anthropic.messages.stream()` → `run.on('text')` 델타를 `ReadableStream`으로 전달
  - [x] `Content-Type: text/plain; charset=utf-8`, `X-Content-Type-Options: nosniff` 응답 헤더

## Phase 3. 상태·로직 훅
- [x] `src/hooks/useChat.ts` — 모든 비즈니스 로직 집중 (todo의 `useTodos` 패턴 계승)
  - [x] localStorage(`ai-chat-conversations`) 초기 로드 · 변경 시 영속
  - [x] 다크모드 초기화(`prefers-color-scheme`) · 클래스 토글
  - [x] `newConversation` / `selectConversation` / `deleteConversation` / `clearAll`
  - [x] `sendMessage` — user/assistant 메시지 추가 + fetch 스트리밍 델타 누적
  - [x] 첫 메시지로 대화 제목 자동 생성
  - [x] 빈 입력 · 스트리밍 중 재전송 방지

## Phase 4. UI 컴포넌트
- [x] `src/app/layout.tsx` · `src/app/page.tsx` (훅 호출 후 props 전달)
- [x] `Sidebar` — 대화 목록 · 새 대화 · 삭제 · 전체 초기화(확인 절차)
- [x] `Header` — 다크모드 토글
- [x] `MessageList` — 마크다운 렌더링 · 자동 스크롤 · "생성 중" 표시
- [x] `MessageInput` — Enter 전송 / Shift+Enter 줄바꿈 · 전송 중 비활성화

## Phase 5. 테스트
- [x] `vitest.config.ts` · `src/test/setup.ts`
- [x] `src/hooks/useChat.test.ts` — 세션 생성/삭제/초기화 · 스트리밍 누적 · 빈 입력 무시 · localStorage 영속 (fetch/스트림 mock)
- [x] `npm run test` 전체 통과 (7 tests)

## Phase 6. 정적 검증
- [x] `npm run lint` 경고 0
- [x] `npm run build` 성공 (타입 체크 통과)

---

## Phase 7. 실행 준비
- [x] 의존성 설치: `npm install` (607 packages)
- [x] `.env.local` 생성 (`.env.local.example` 복사, gitignore 대상)
- [x] 개발 서버 기동 확인: `npm run dev` → `GET /` HTTP 200, 핵심 UI 렌더 확인
- [x] API 라우트 배선 확인: 잘못된 본문 → HTTP 400(유효성 검사), 정상 본문 → SDK 호출 도달
- [ ] **`.env.local`에 실제 `ANTHROPIC_API_KEY` 입력** ← 사용자가 채울 항목
  ```
  ANTHROPIC_API_KEY=sk-ant-...   # ai-chat/.env.local
  ```

## 사용자 확인 필요 (유효 키 입력 후 브라우저 E2E)
- [ ] `npm run dev` → http://localhost:3000 접속
- [ ] 메시지 전송 시 응답이 스트리밍으로 표시되는지
- [ ] 새로고침 후 대화가 유지되는지 (localStorage)
- [ ] 다중 대화 전환 · 삭제 · 전체 초기화 동작
- [ ] 다크 모드 토글
- [ ] 코드 블록/목록 등 마크다운 렌더링

## 선택 개선 (범위 밖 / 향후)
- [ ] 응답 생성 중단(abort) 버튼 (`stream.abort()`)
- [ ] 대화 제목 수동 편집
- [ ] 요청 실패 시 재시도(regenerate)
- [ ] 배포 (Vercel 등) 및 서버 환경변수 설정
- [ ] 컴포넌트 렌더링 테스트 추가 (`@testing-library/react`)

---

## 검증 명령어
```bash
cd ai-chat
npm run test      # 단위 테스트
npm run lint      # 정적 분석
npm run build     # 타입 체크 + 프로덕션 빌드
npm run dev       # 로컬 실행 (http://localhost:3000)
```
