import Anthropic from '@anthropic-ai/sdk';
import type { NextRequest } from 'next/server';
import type { ApiMessage } from '@/types/chat';

const DEFAULT_MODEL = 'claude-opus-4-8';

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(
      'ANTHROPIC_API_KEY 가 설정되지 않았습니다. .env.local 을 확인하세요.',
      { status: 500 }
    );
  }

  let messages: ApiMessage[];
  try {
    const body = await request.json();
    messages = body.messages;
  } catch {
    return new Response('요청 본문(JSON)을 파싱할 수 없습니다.', { status: 400 });
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response('messages 배열이 비어 있습니다.', { status: 400 });
  }

  const anthropic = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL;
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const run = anthropic.messages.stream({
          model,
          max_tokens: 1024,
          messages,
        });

        run.on('text', (delta) => {
          controller.enqueue(encoder.encode(delta));
        });

        await run.finalMessage();
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-store',
    },
  });
}
