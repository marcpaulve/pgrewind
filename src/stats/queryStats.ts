import { ParsedQuery } from '../parser/logParser';

export interface QueryStats {
  totalQueries: number;
  uniqueQueries: number;
  avgDurationMs: number;
  minDurationMs: number;
  maxDurationMs: number;
  totalDurationMs: number;
  slowestQuery: ParsedQuery | null;
  fastestQuery: ParsedQuery | null;
  queryTypeBreakdown: Record<string, number>;
  p50DurationMs: number;
  p95DurationMs: number;
  p99DurationMs: number;
}

function getQueryType(sql: string): string {
  const normalized = sql.trim().toUpperCase();
  const match = normalized.match(/^(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|TRUNCATE|BEGIN|COMMIT|ROLLBACK)/);
  return match ? match[1] : 'OTHER';
}

function percentile(sortedValues: number[], p: number): number {
  if (sortedValues.length === 0) return 0;
  const index = Math.ceil((p / 100) * sortedValues.length) - 1;
  return sortedValues[Math.max(0, index)];
}

export function computeStats(queries: ParsedQuery[]): QueryStats {
  if (queries.length === 0) {
    return {
      totalQueries: 0,
      uniqueQueries: 0,
      avgDurationMs: 0,
      minDurationMs: 0,
      maxDurationMs: 0,
      totalDurationMs: 0,
      slowestQuery: null,
      fastestQuery: null,
      queryTypeBreakdown: {},
      p50DurationMs: 0,
      p95DurationMs: 0,
      p99DurationMs: 0,
    };
  }

  const durations = queries.map((q) => q.durationMs ?? 0);
  const sortedDurations = [...durations].sort((a, b) => a - b);
  const totalDurationMs = durations.reduce((sum, d) => sum + d, 0);

  const uniqueQueries = new Set(queries.map((q) => q.query.trim())).size;

  const queryTypeBreakdown: Record<string, number> = {};
  for (const q of queries) {
    const type = getQueryType(q.query);
    queryTypeBreakdown[type] = (queryTypeBreakdown[type] ?? 0) + 1;
  }

  const slowestQuery = queries.reduce((prev, curr) =>
    (curr.durationMs ?? 0) > (prev.durationMs ?? 0) ? curr : prev
  );

  const fastestQuery = queries.reduce((prev, curr) =>
    (curr.durationMs ?? 0) < (prev.durationMs ?? 0) ? curr : prev
  );

  return {
    totalQueries: queries.length,
    uniqueQueries,
    avgDurationMs: totalDurationMs / queries.length,
    minDurationMs: sortedDurations[0],
    maxDurationMs: sortedDurations[sortedDurations.length - 1],
    totalDurationMs,
    slowestQuery,
    fastestQuery,
    queryTypeBreakdown,
    p50DurationMs: percentile(sortedDurations, 50),
    p95DurationMs: percentile(sortedDurations, 95),
    p99DurationMs: percentile(sortedDurations, 99),
  };
}
