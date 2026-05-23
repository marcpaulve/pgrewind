/**
 * Query deduplication: normalize and group duplicate queries,
 * tracking frequency and aggregated durations.
 */

export interface ParsedQuery {
  raw: string;
  duration: number;
  timestamp: string;
  queryType?: string;
}

export interface DedupedQuery {
  normalized: string;
  count: number;
  totalDuration: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  firstSeen: string;
  lastSeen: string;
  examples: string[];
}

/**
 * Normalize a SQL query by collapsing whitespace and replacing
 * literal values with placeholders.
 */
export function normalizeQuery(sql: string): string {
  return sql
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/'[^']*'/g, '?')
    .replace(/\b\d+\b/g, '?')
    .toLowerCase();
}

/**
 * Deduplicate an array of parsed queries, grouping by normalized form.
 */
export function deduplicateQueries(queries: ParsedQuery[]): DedupedQuery[] {
  const map = new Map<string, DedupedQuery>();

  for (const q of queries) {
    const key = normalizeQuery(q.raw);
    const existing = map.get(key);

    if (!existing) {
      map.set(key, {
        normalized: key,
        count: 1,
        totalDuration: q.duration,
        avgDuration: q.duration,
        minDuration: q.duration,
        maxDuration: q.duration,
        firstSeen: q.timestamp,
        lastSeen: q.timestamp,
        examples: [q.raw],
      });
    } else {
      existing.count += 1;
      existing.totalDuration += q.duration;
      existing.avgDuration = existing.totalDuration / existing.count;
      existing.minDuration = Math.min(existing.minDuration, q.duration);
      existing.maxDuration = Math.max(existing.maxDuration, q.duration);
      if (q.timestamp < existing.firstSeen) existing.firstSeen = q.timestamp;
      if (q.timestamp > existing.lastSeen) existing.lastSeen = q.timestamp;
      if (existing.examples.length < 3) existing.examples.push(q.raw);
    }
  }

  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}
