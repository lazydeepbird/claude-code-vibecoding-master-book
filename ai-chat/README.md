# ai-chat — Claude API 스트리밍 챗봇

Claude Code 바이브코딩 실습 저장소의 **두 번째 예제**. Anthropic Claude API를 실제로 연동한 스트리밍 AI 챗봇이다. 여러 대화 세션을 만들어 Claude와 실시간으로 주고받고, 응답은 타이핑되듯 스트리밍으로 표시되며 마크다운으로 렌더링된다. 모든 대화는 브라우저 `localStorage`에 저장되어 새로고침 후에도 유지된다.

첫 번째 예제 `todo/`(Vite 기반)와 달리, **API 키를 서버에서만 다루기 위해 Next.js(App Router)** 를 사용한다. Claude 호출은 서버 라우트에서만 이뤄지고 키는 클라이언트로 노출되지 않는다.

---

## ✨ 주요 기능

| 기능 | 설명 |
|------|------|
| 스트리밍 응답 | Claude 응답을 델타 단위로 실시간 수신·표시 |
| 다중 대화 세션 | 사이드바에서 대화 생성·전환·삭제 |
| 히스토리 영속 | `localStorage`에 저장, 새로고침 후에도 유지 |
| 마크다운 렌더링 | 코드 블록·목록·표·링크 등 GFM 지원 |
| 다크 모드 | 라이트/다크 토글 (초기값은 시스템 설정 따름) |
| 대화 삭제/초기화 | 개별 삭제 및 전체 초기화(확인 절차 포함) |

---

## 🧰 기술 스택

- **Next.js 15** (App Router)
- **React 18** + **TypeScript**
- **Tailwind CSS** (`darkMode: 'class'`)
- **@anthropic-ai/sdk** — 서버 측 Claude 호출
- **react-markdown** + **remark-gfm** — 마크다운 렌더링
- **Vitest** + **@testing-library/react** — 단위 테스트

---

## 🚀 설치 및 실행

### 사전 요구
- Node.js 18.18 이상 (Next.js 15 요구사항)
- Anthropic API 키 — https://console.anthropic.com 에서 발급

### 1) 의존성 설치
```bash
cd ai-chat
npm install
```

### 2) 환경변수 설정
`.env.local.example`을 복사해 `.env.local`을 만들고 실제 키를 채운다. 이 파일은 `.gitignore`에 포함되어 **커밋되지 않는다**.
```bash
cp .env.local.example .env.local
```
```bash
# ai-chat/.env.local
ANTHROPIC_API_KEY=sk-ant-...

# 선택: 사용할 모델 (미설정 시 claude-opus-4-8)
# 예: 가장 저렴한 Haiku 티어
ANTHROPIC_MODEL=claude-haiku-4-5-20251001
```

### 3) 개발 서버 실행
```bash
npm run dev
```
브라우저에서 http://localhost:3000 접속.

> ⚠️ `.env.local` 값은 **dev 서버 재시작 후에만** 반영된다. 실행 중 키/모델을 바꾸면 서버를 껐다 켠다.

---

## 📜 npm 스크립트

```bash
npm run dev       # 개발 서버 (http://localhost:3000)
npm run build     # 프로덕션 빌드 (타입 체크 포함)
npm run start     # 빌드 결과물 실행
npm run lint      # ESLint 검사 (경고 0개 기준)
npm run test      # Vitest 전체 테스트
```

단일 테스트 파일 실행:
```bash
npx vitest run src/hooks/useChat.test.ts
```

---

## 📁 폴더 구조

```
ai-chat/
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx          # 루트 레이아웃 (html/body, 메타데이터)
│  │  ├─ page.tsx            # 메인 페이지 (useChat 호출 후 props 전달)
│  │  ├─ globals.css         # Tailwind 지시자 + 마크다운 최소 스타일
│  │  └─ api/chat/route.ts   # 서버 라우트 — Claude 스트리밍 호출 (키 사용처)
│  ├─ components/
│  │  ├─ Sidebar.tsx         # 대화 목록 · 새 대화 · 삭제 · 전체 초기화
│  │  ├─ Header.tsx          # 다크모드 토글
│  │  ├─ MessageList.tsx     # 메시지 렌더링(마크다운) · 자동 스크롤
│  │  └─ MessageInput.tsx    # 입력창 (Enter 전송 / Shift+Enter 줄바꿈)
│  ├─ hooks/
│  │  ├─ useChat.ts          # 모든 상태·비즈니스 로직 집중
│  │  └─ useChat.test.ts     # useChat 단위 테스트
│  ├─ types/
│  │  └─ chat.ts             # 단일 진실 공급원 타입
│  └─ test/
│     └─ setup.ts            # Vitest 셋업 (jest-dom)
├─ .env.local.example        # 환경변수 템플릿
├─ next.config.js
├─ tailwind.config.js
├─ postcss.config.js
├─ tsconfig.json
├─ vitest.config.ts
├─ PRD.md                    # 제품 요구사항 명세
├─ TODO.md                   # 구축 실행 계획 체크리스트
└─ README.md                 # (이 문서)
```

---

## 🏗️ 아키텍처

### 상태 관리 흐름
모든 비즈니스 로직은 **`useChat` 훅 한 곳에 집중**되어 있다(첫 예제 `todo/`의 `useTodos` 패턴 계승). 컴포넌트는 훅이 반환하는 값·함수만 사용하며 자체 상태를 갖지 않는다(입력창 임시 텍스트 같은 UI 로컬 상태는 예외).

```
useChat (상태 + 로직)
  └─ page.tsx (최상위, 훅 호출 후 props 전달)
       ├─ Sidebar       (대화 목록 · 새 대화 · 삭제 · 초기화)
       ├─ Header        (다크모드 토글)
       ├─ MessageList   (활성 대화 메시지 렌더링, 마크다운)
       └─ MessageInput  (입력 · 전송)
```

### 스트리밍 데이터 흐름
```
[브라우저] MessageInput 전송
   → useChat.sendMessage: user/assistant 메시지 추가
   → fetch('/api/chat', { messages })            (POST, JSON)
        ↓ (서버)
   [route.ts] anthropic.messages.stream(...)
        → run.on('text', delta) → ReadableStream.enqueue(delta)
        ↓ (text/plain 스트림 응답)
   → useChat: res.body.getReader()로 청크 읽어
       마지막 assistant 메시지 content에 실시간 누적
   → MessageList가 react-markdown으로 렌더링
```

핵심: **API 키는 `src/app/api/chat/route.ts`(서버)에서만 사용**되고, 브라우저 코드에는 절대 노출되지 않는다.

### 데이터 모델 (`src/types/chat.ts`)
```ts
type Role = 'user' | 'assistant';

interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  createdAt: number;
}

interface Conversation {
  id: string;
  title: string;          // 첫 사용자 메시지에서 자동 생성
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}
```

### 데이터 영속성
`localStorage` 키 **`ai-chat-conversations`** 에 `Conversation[]`를 JSON으로 저장한다. `useChat` 내부에서 초기 로드와 변경 시 저장을 모두 처리한다.

---

## 🤖 모델 설정

사용 모델은 `src/app/api/chat/route.ts`에서 결정된다.
```ts
const DEFAULT_MODEL = 'claude-opus-4-8';
// ...
const model = process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL;
```

- **모델을 바꾸려면** 코드를 건드리지 말고 `.env.local`에 `ANTHROPIC_MODEL`을 지정한다(재시작 필요).
- 예: 가장 저렴한 Haiku 티어 → `ANTHROPIC_MODEL=claude-haiku-4-5-20251001`
- 환경변수를 지우면 코드 기본값(`claude-opus-4-8`)으로 복귀한다.

---

## 🧪 테스트

`useChat` 훅의 순수 로직을 우선 검증한다(네트워크·스트림은 mock). 검증 대상:
- 대화 생성 / 전환 / 삭제 / 전체 초기화
- `sendMessage` 시 user·assistant 메시지 추가와 **스트리밍 델타 누적**
- 빈 입력 무시
- 첫 메시지로 제목 자동 생성
- `localStorage` 영속

이 저장소의 테스트 원칙(실제 동작 검증, 무의미한 assertion·하드코딩 금지)은 루트 `../CLAUDE.md`를 따른다.

```bash
npm run test
```

---

## 📌 범위 밖 (Non-goals)

인증/계정, 서버 DB, 파일·이미지 업로드, 음성, 메시지 복사·편집·재생성, 멀티모달, 도구 사용(tool use)은 이 예제 범위에 포함되지 않는다. 자세한 명세는 [`PRD.md`](./PRD.md), 구축 진행 상황은 [`TODO.md`](./TODO.md) 참고.

---

## 🔧 트러블슈팅

| 증상 | 원인 / 해결 |
|------|-------------|
| `ANTHROPIC_API_KEY 가 설정되지 않았습니다` (500) | `.env.local`에 키 미입력. 입력 후 dev 서버 재시작 |
| assistant 말풍선에 `_오류: ..._` 표시 | 키가 잘못됐거나(401) 네트워크 실패. 키/네트워크 확인 |
| 모델 변경이 반영 안 됨 | 환경변수는 재시작 후 반영. dev 서버 재기동 |
| 대화가 사라짐 | 브라우저 `localStorage` 초기화 시 데이터도 삭제됨(서버 저장 없음) |
