/**
 * Public API for the deduplication module.
 * Provides a high-level function to deduplicate and summarize query logs.
 */

import { deduplicateQueries, DedupedQuery, ParsedQuery } from './queryDeduplicator';

export { DedupedQuery, ParsedQuery } from './queryDeduplicator';

export interface DedupSummary {
  uniqueQueries: number;
  totalQueries: number;
  topRepeated: DedupedQuery[];
  deduped: DedupedQuery[];
}

/**
 * Analyze a list of parsed queries for duplicates.
 * Returns a summary including the top repeated queries.
 *
 * @param queries   Array of parsed query objects
 * @param topN      Number of top repeated queries to highlight (default: 5)
 */
export function analyzeDuplicates(
  queries: ParsedQuery[],
  topN = 5
): DedupSummary {
  const deduped = deduplicateQueries(queries);
  const totalQueries = queries.length;
  const uniqueQueries = deduped.length;
  const topRepeated = deduped.filter((d) => d.count > 1).slice(0, topN);

  return {
    uniqueQueries,
    totalQueries,
    topRepeated,
    deduped,
  };
}
