# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

Claude Code 바이브코딩 실습 예제 모음 저장소. 각 예제는 독립된 하위 디렉토리로 관리된다.

현재 예제:
- `todo/` — React 18 + TypeScript + Vite + Tailwind CSS TODO 앱

## 명령어 (todo/)

```bash
cd todo

npm run dev       # 개발 서버 (http://localhost:5173)
npm run build     # 타입 체크 후 프로덕션 빌드
npm run lint      # ESLint 검사 (경고 0개 기준, 초과 시 실패)
npm run test      # Vitest 전체 테스트 실행
npm run preview   # 빌드 결과물 미리보기
```

단일 테스트 파일 실행:
```bash
cd todo && npx vitest run src/hooks/useTodos.test.ts
```

## 아키텍처

### 상태 관리 흐름

모든 비즈니스 로직은 `src/hooks/useTodos.ts` 한 곳에 집중되어 있다. 컴포넌트는 이 훅이 반환하는 값과 함수만 사용하며, 자체 상태를 갖지 않는다 (편집 중 임시 텍스트 같은 UI 로컬 상태 제외).

```
useTodos (상태 + 로직)
  └─ App.tsx (최상위, 훅 호출 후 props로 전달)
       ├─ TodoInput   (할 일 추가)
       ├─ TodoList    (목록 렌더링)
       │    └─ TodoItem (개별 항목, 인라인 편집 로컬 상태 보유)
       └─ TodoFooter  (필터 탭 + 완료 항목 삭제)
```

### 데이터 영속성

`localStorage` 키 `todo-app-items`에 `Todo[]`를 JSON으로 저장. `useTodos` 내부에서 초기 로드와 변경 시 저장을 모두 처리한다.

### 타입 정의

`src/types/todo.ts`가 단일 진실 공급원. `Todo`, `Priority`, `FilterType` 세 타입만 존재하며 앱 전체가 이를 공유한다.

## 테스트 코드 작성 원칙

### 기본 원칙

- **실제 동작을 검증한다.** 함수가 호출되었는지(호출 여부 assert)가 아니라, 호출 결과로 상태나 반환값이 어떻게 바뀌었는지를 검증한다.
- **무의미한 assertion 금지.** `expect(fn).toBeDefined()`, `expect(true).toBe(true)` 같이 항상 통과하는 테스트는 작성하지 않는다.
- **하드코딩 금지.** 테스트 데이터는 fixture 또는 factory 함수로 생성하고, 매직 스트링·숫자를 테스트 본문에 직접 쓰지 않는다.

### 구체적 규칙

```ts
// ❌ 금지: 호출 여부만 확인
expect(mockFn).toHaveBeenCalled();

// ✅ 허용: 결과 상태 확인
expect(result.current.todos).toHaveLength(1);
expect(result.current.todos[0].text).toBe(TODO_TEXT);
```

```ts
// ❌ 금지: 하드코딩
expect(result.current.activeCount).toBe(3);

// ✅ 허용: 데이터에서 파생
const added = result.current.todos.filter(t => !t.completed);
expect(result.current.activeCount).toBe(added.length);
```

### `useTodos` 훅 테스트 방법

`useTodos`는 `localStorage`와 `window.matchMedia`에 의존하므로 테스트 파일 상단에 아래 mock을 설정한다.

```ts
const storageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
    clear: () => { store = {}; },
  };
})();

beforeEach(() => {
  Object.defineProperty(window, 'localStorage', { value: storageMock });
  Object.defineProperty(window, 'matchMedia', {
    value: () => ({ matches: false }),
  });
  storageMock.clear();
});
```

### 테스트 구조 규칙

- 파일 위치: 테스트 대상과 같은 디렉토리, 확장자 `.test.ts` 또는 `.test.tsx`
- `describe` — 테스트 대상 단위 (훅명, 컴포넌트명)
- `it` — 구체적인 시나리오를 한 문장으로 기술 ("빈 문자열 입력 시 todo를 추가하지 않는다")
- 하나의 `it` 블록에서 하나의 동작만 검증한다. 여러 동작을 한 블록에 몰아넣지 않는다.

## 새 예제 추가 시

루트에 새 디렉토리를 만들고 독립적인 `package.json`을 갖도록 구성한다. `todo/`와 동일한 스택(Vite + React + TypeScript + Tailwind)을 기본으로 사용한다.
