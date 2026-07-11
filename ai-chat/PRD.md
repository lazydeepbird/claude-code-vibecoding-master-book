# AI 챗봇 (ai-chat) — PRD

## 1. 개요

Claude Code 바이브코딩 두 번째 실습 예제. Anthropic Claude API를 실제로 연동한 **스트리밍 AI 챗봇**이다. 사용자는 여러 대화 세션을 만들어 Claude와 실시간으로 주고받고, 응답은 타이핑되듯 스트리밍으로 표시되며 마크다운으로 렌더링된다. 모든 대화는 브라우저 `localStorage`에 저장되어 새로고침 후에도 유지된다.

첫 번째 예제 `todo/`와 달리, API 키를 안전하게 다루기 위해 **Next.js(App Router)** 스택을 사용한다. Claude API 호출은 서버 라우트에서만 이뤄지고 키는 클라이언트로 노출되지 않는다.

## 2. 기술 스택

| 구분 | 선택 | 비고 |
|------|------|------|
| 프레임워크 | Next.js (App Router) | 서버 라우트에서 API 키 보호, 스트리밍 자연스러움 |
| 언어 | TypeScript | |
| 스타일 | Tailwind CSS | |
| AI SDK | `@anthropic-ai/sdk` | 서버 측에서만 사용 |
| 기본 모델 | `claude-opus-4-8` | 환경변수로 교체 가능하게 설계 권장 |
| 마크다운 | `react-markdown` + `remark-gfm` | 코드 블록·목록·표·굵게 등 GFM 지원 |

> 이 예제는 `todo/`와 **다른 스택**을 사용하며 자체 `package.json`을 갖는다.

## 3. 핵심 기능 명세

### 3.1 메시지 전송 / 스트리밍 수신
- 입력창에 텍스트 입력 후 전송(Enter 또는 전송 버튼) 시 사용자 메시지가 즉시 목록에 추가된다.
- 서버 라우트를 통해 Claude 응답을 스트리밍으로 수신하며, 도착하는 델타를 마지막 assistant 메시지에 실시간 누적한다.
- 응답 생성 중에는 전송 버튼이 비활성화되고 로딩/생성 중 상태를 표시한다.
- 빈 문자열(공백만)은 전송하지 않는다.

### 3.2 다중 대화 세션
- 사이드바에서 **새 대화 생성**, 대화 간 **전환**, 개별 대화 **삭제**가 가능하다.
- 각 대화는 제목을 가진다. 제목은 첫 사용자 메시지 앞부분에서 자동 생성한다(예: 앞 30자).
- 활성 대화 하나만 메시지 영역에 렌더링된다.

### 3.3 대화 히스토리 영속
- 모든 대화(`Conversation[]`)를 `localStorage`에 저장하여 새로고침 후에도 유지한다.

### 3.4 마크다운 렌더링
- assistant 메시지는 마크다운으로 렌더링한다: 코드 블록, 인라인 코드, 순서/비순서 목록, 굵게/기울임, 표, 링크 등.
- 사용자 메시지는 평문으로 표시한다(입력 그대로).

### 3.5 다크 모드
- 라이트/다크 테마 토글. 초기값은 `prefers-color-scheme`를 따른다(`todo/`와 동일한 방침).

### 3.6 대화 삭제 / 초기화
- 개별 대화 삭제(사이드바).
- 전체 초기화: 모든 대화를 비우고 `localStorage`를 정리한다. 되돌릴 수 없으므로 확인 절차를 둔다.

## 4. 데이터 모델

`src/types/chat.ts`를 단일 진실 공급원으로 둔다(`todo/src/types/todo.ts` 패턴 계승).

```ts
export type Role = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  createdAt: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}
```

## 5. 아키텍처

### 5.1 상태 관리 흐름
모든 비즈니스 로직은 `useChat` 훅 한 곳에 집중한다(`todo/`의 `useTodos` 패턴 계승). 컴포넌트는 훅이 반환하는 값과 함수만 사용하며 자체 상태를 갖지 않는다(입력창 임시 텍스트 같은 UI 로컬 상태는 예외).

```
useChat (상태 + 로직: 대화 목록 · 활성 대화 · 전송/스트리밍 · 영속 · 다크모드)
  └─ page.tsx (최상위, 훅 호출 후 props 전달)
       ├─ Sidebar       (대화 목록 · 새 대화 · 대화 삭제)
       ├─ Header        (다크모드 토글 · 전체 초기화)
       ├─ MessageList   (활성 대화 메시지 렌더링, 마크다운)
       └─ MessageInput  (입력 · 전송)
```

### 5.2 서버 라우트
`app/api/chat/route.ts`의 `POST` 핸들러가 클라이언트로부터 `messages` 배열을 받아 Claude를 호출하고 응답 스트림을 되돌려준다. 이 파일은 서버에서만 실행되며 API 키를 다룬다.

## 6. API 연동 상세

### 6.1 서버 (`app/api/chat/route.ts`)
Anthropic SDK의 `messages.stream()`으로 스트림을 열고, `text` 이벤트의 델타를 `ReadableStream`으로 흘려보낸다.

```ts
import Anthropic from '@anthropic-ai/sdk';
import type { NextRequest } from 'next/server';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-opus-4-8';

export async function POST(request: NextRequest) {
  const { messages } = await request.json();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const run = anthropic.messages.stream({
        model: MODEL,
        max_tokens: 1024,
        messages, // [{ role, content }, ...]
      });
      run.on('text', (delta) => {
        controller.enqueue(encoder.encode(delta));
      });
      run.on('error', (err) => controller.error(err));
      await run.finalMessage();
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
```

### 6.2 클라이언트 (`useChat` 내부)
전송 시 활성 대화의 메시지 히스토리를 `POST`로 보내고, 응답 본문을 `getReader()`로 읽어 마지막 assistant 메시지에 누적한다.

```ts
const res = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ messages: historyForApi }),
});

const reader = res.body!.getReader();
const decoder = new TextDecoder();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const chunk = decoder.decode(value, { stream: true });
  // chunk를 활성 대화의 마지막 assistant 메시지 content에 append
}
```

> `historyForApi`는 `ChatMessage[]`에서 `{ role, content }`만 추린 배열이다(`id`, `createdAt` 제외).

### 6.3 환경변수
- `.env.local`에 다음을 설정한다(Next.js가 서버에서만 로드):
  ```
  ANTHROPIC_API_KEY=sk-ant-...
  # 선택: ANTHROPIC_MODEL=claude-opus-4-8
  ```
- `.env.local`은 반드시 `.gitignore`에 포함되어야 한다(키 커밋 방지).

## 7. 데이터 영속성

`localStorage` 키 `ai-chat-conversations`에 `Conversation[]`를 JSON으로 저장한다. `useChat` 내부에서 초기 로드와 변경 시 저장을 모두 처리한다(`todo/`의 `todo-app-items` 패턴 계승).

## 8. 테스트 원칙

루트 `CLAUDE.md`의 테스트 규칙을 그대로 따른다.
- **실제 동작을 검증한다.** 함수 호출 여부가 아니라 결과 상태를 검증한다.
- **무의미한 assertion·하드코딩 금지.**
- 우선 검증 대상: `useChat`의 순수 로직 — 대화 생성/전환/삭제, 메시지 추가, 스트리밍 델타 누적, 빈 입력 무시, localStorage 영속.
- 네트워크(`fetch`)와 스트림 응답은 mock으로 대체한다. `localStorage`는 `todo` 테스트와 동일한 storage mock 패턴을 사용한다.
- 파일 위치·`describe`/`it` 구조 규칙은 `CLAUDE.md` 기준을 따른다.

## 9. 범위 밖 (Non-goals)

- 사용자 인증 / 계정
- 서버 측 데이터베이스(대화는 브라우저 로컬에만 저장)
- 파일·이미지 업로드, 음성 입출력
- 메시지 복사·편집·재생성 버튼
- 멀티모달, 도구 사용(tool use), RAG
