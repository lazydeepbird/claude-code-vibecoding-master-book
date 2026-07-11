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

/** 서버 라우트로 보낼 때 사용하는, API 최소 형태 */
export interface ApiMessage {
  role: Role;
  content: string;
}
