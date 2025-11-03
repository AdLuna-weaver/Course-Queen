import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export interface EmbeddingResult {
  embedding: number[];
  tokensUsed: number;
  cost: number;
}

// Pricing for text-embedding-3-small
const EMBEDDING_COST_PER_1K = 0.00002; // $0.02 per million tokens

export async function generateEmbedding(text: string): Promise<EmbeddingResult> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
    encoding_format: 'float',
  });

  const tokensUsed = response.usage.total_tokens;
  const cost = (tokensUsed / 1000) * EMBEDDING_COST_PER_1K;

  return {
    embedding: response.data[0].embedding,
    tokensUsed,
    cost,
  };
}

export async function generateEmbeddings(
  texts: string[]
): Promise<EmbeddingResult[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: texts,
    encoding_format: 'float',
  });

  const totalTokens = response.usage.total_tokens;
  const cost = (totalTokens / 1000) * EMBEDDING_COST_PER_1K;
  const tokensPerText = Math.ceil(totalTokens / texts.length);

  return response.data.map((item) => ({
    embedding: item.embedding,
    tokensUsed: tokensPerText,
    cost: cost / texts.length,
  }));
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
