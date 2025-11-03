import { createClient } from '@/lib/supabase/server';

export interface CostEntry {
  courseId?: string;
  resourceId?: string;
  operation: string;
  tokensUsed: number;
  cost: number;
  timestamp?: Date;
}

export async function trackCost(entry: CostEntry): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from('cost_tracking').insert({
    course_id: entry.courseId,
    resource_id: entry.resourceId,
    operation: entry.operation,
    tokens_used: entry.tokensUsed,
    cost: entry.cost,
    timestamp: entry.timestamp || new Date(),
  });

  if (error) {
    console.error('Error tracking cost:', error);
  }
}

export async function getCourseCosts(courseId: string): Promise<{
  total: number;
  breakdown: { operation: string; cost: number; tokensUsed: number }[];
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('cost_tracking')
    .select('operation, cost, tokens_used')
    .eq('course_id', courseId);

  if (error) {
    console.error('Error fetching costs:', error);
    return { total: 0, breakdown: [] };
  }

  const breakdown = data.reduce(
    (acc: any[], item: any) => {
      const existing = acc.find((x) => x.operation === item.operation);
      if (existing) {
        existing.cost += item.cost;
        existing.tokensUsed += item.tokens_used;
      } else {
        acc.push({
          operation: item.operation,
          cost: item.cost,
          tokensUsed: item.tokens_used,
        });
      }
      return acc;
    },
    []
  );

  const total = breakdown.reduce((sum, item) => sum + item.cost, 0);

  return { total, breakdown };
}

export function formatCost(cost: number): string {
  return `$${cost.toFixed(4)}`;
}

export function estimateCost(
  tokensUsed: number,
  costPer1K: number
): number {
  return (tokensUsed / 1000) * costPer1K;
}
