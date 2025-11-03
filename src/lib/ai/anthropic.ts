import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClaudeResponse {
  content: string;
  tokensUsed: {
    input: number;
    output: number;
    total: number;
  };
  cost: number;
}

// Pricing for Claude Sonnet 4.5 (as of January 2025)
const INPUT_COST_PER_1K = 0.003; // $3 per million tokens
const OUTPUT_COST_PER_1K = 0.015; // $15 per million tokens

export async function sendClaudeMessage(
  messages: ClaudeMessage[],
  systemPrompt?: string,
  maxTokens: number = 4096
): Promise<ClaudeResponse> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
  });

  const inputTokens = response.usage.input_tokens;
  const outputTokens = response.usage.output_tokens;
  const totalTokens = inputTokens + outputTokens;

  const cost =
    (inputTokens / 1000) * INPUT_COST_PER_1K +
    (outputTokens / 1000) * OUTPUT_COST_PER_1K;

  return {
    content: response.content[0].type === 'text' ? response.content[0].text : '',
    tokensUsed: {
      input: inputTokens,
      output: outputTokens,
      total: totalTokens,
    },
    cost,
  };
}

export async function streamClaudeMessage(
  messages: ClaudeMessage[],
  systemPrompt?: string,
  maxTokens: number = 4096
): Promise<AsyncIterable<string>> {
  const stream = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
    stream: true,
  });

  async function* generateText() {
    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        yield event.delta.text;
      }
    }
  }

  return generateText();
}

export { anthropic };
