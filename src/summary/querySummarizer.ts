import { ParsedQuery } from '../parser/logParser';
import { computeStats } from '../stats/queryStats';
import { deduplicateQueries } from '../dedup/queryDeduplicator';
import { analyzeCosts } from '../cost/index';

export interface QuerySummary {
  totalQueries: number;
  uniqueQueries: number;
  duplicateRatio: number;
  timeRangeMs: { start: number; end: number } | null;
  durationStats: {
    min: number;
    max: number;
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  } | null;
  topQueryTypes: Array<{ type: string; count: number; pct: number }>;
  estimatedTotalCost: number;
  slowestQuery: ParsedQuery | null;
}

export function summarizeQueries(queries: ParsedQuery[]): QuerySummary {
  if (queries.length === 0) {
    return {
      totalQueries: 0,
      uniqueQueries: 0,
      duplicateRatio: 0,
      timeRangeMs: null,
      durationStats: null,
      topQueryTypes: [],
      estimatedTotalCost: 0,
      slowestQuery: null,
    };
  }

  const deduped = deduplicateQueries(queries);
  const uniqueQueries = deduped.length;
  const duplicateRatio = 1 - uniqueQueries / queries.length;

  const stats = computeStats(queries);

  const timestamps = queries
    .map((q) => q.timestamp?.getTime())
    .filter((t): t is number => t !== undefined);
  const timeRangeMs =
    timestamps.length > 0
      ? { start: Math.min(...timestamps), end: Math.max(...timestamps) }
      : null;

  const typeCounts: Record<string, number> = {};
  for (const q of queries) {
    const type = q.query.trim().split(/\s+/)[0].toUpperCase();
    typeCounts[type] = (typeCounts[type] ?? 0) + 1;
  }
  const topQueryTypes = Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([type, count]) => ({ type, count, pct: count / queries.length }));

  const costResult = analyzeCosts(queries);
  const estimatedTotalCost = costResult.reduce((sum, r) => sum + r.estimatedCost, 0);

  const slowestQuery = queries.reduce<ParsedQuery | null>(
    (slow, q) =>
      q.duration !== undefined && (slow === null || (slow.duration ?? 0) < q.duration)
        ? q
        : slow,
    null
  );

  return {
    totalQueries: queries.length,
    uniqueQueries,
    duplicateRatio,
    timeRangeMs,
    durationStats: stats
      ? {
          min: stats.min,
          max: stats.max,
          avg: stats.avg,
          p50: stats.p50,
          p95: stats.p95,
          p99: stats.p99,
        }
      : null,
    topQueryTypes,
    estimatedTotalCost,
    slowestQuery,
  };
}
