import { createClient } from '@/lib/supabase/server';
import { generateEmbedding } from './embeddings';
import type { RAGSearchResult } from '@/lib/types';

export async function searchRelevantContent(
  query: string,
  courseId: string,
  limit: number = 5,
  similarityThreshold: number = 0.7
): Promise<RAGSearchResult[]> {
  const supabase = await createClient();

  // Generate embedding for the query
  const { embedding } = await generateEmbedding(query);

  // Search for similar embeddings in the database using pgvector
  const { data, error } = await supabase.rpc('search_embeddings', {
    query_embedding: embedding,
    match_threshold: similarityThreshold,
    match_count: limit,
    course_id_filter: courseId,
  });

  if (error) {
    console.error('Error searching embeddings:', error);
    throw new Error('Failed to search embeddings');
  }

  return data.map((item: any) => ({
    chunk: item.chunk,
    resourceId: item.resource_id,
    resourceName: item.resource_name,
    similarity: item.similarity,
    metadata: item.metadata,
  }));
}

export async function buildRAGContext(
  query: string,
  courseId: string,
  maxContextLength: number = 4000
): Promise<string> {
  const results = await searchRelevantContent(query, courseId);

  let context = 'Relevant information from course resources:\n\n';
  let currentLength = context.length;

  for (const result of results) {
    const entry = `[From: ${result.resourceName}]\n${result.chunk}\n\n`;
    if (currentLength + entry.length > maxContextLength) {
      break;
    }
    context += entry;
    currentLength += entry.length;
  }

  return context;
}

export async function storeEmbedding(
  resourceId: string,
  chunk: string,
  metadata: any = {}
): Promise<void> {
  const supabase = await createClient();
  const { embedding, tokensUsed, cost } = await generateEmbedding(chunk);

  const { error } = await supabase.from('embeddings').insert({
    resource_id: resourceId,
    chunk,
    embedding,
    metadata,
  });

  if (error) {
    console.error('Error storing embedding:', error);
    throw new Error('Failed to store embedding');
  }

  // Track the cost
  await supabase.from('cost_tracking').insert({
    resource_id: resourceId,
    operation: 'embedding_generation',
    tokens_used: tokensUsed,
    cost,
  });
}

export async function processResourceForRAG(
  resourceId: string,
  content: string,
  chunkSize: number = 1000,
  overlapSize: number = 200
): Promise<void> {
  const chunks = splitIntoChunks(content, chunkSize, overlapSize);

  for (let i = 0; i < chunks.length; i++) {
    await storeEmbedding(resourceId, chunks[i], {
      chunkIndex: i,
      totalChunks: chunks.length,
    });
  }
}

function splitIntoChunks(
  text: string,
  chunkSize: number,
  overlapSize: number
): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start += chunkSize - overlapSize;
  }

  return chunks;
}
