export { estimateCost, estimateBatch } from './costEstimator';
export type { CostEstimate } from './costEstimator';

import { filterQueries } from '../parser';
import { estimateBatch } from './costEstimator';
import type { FilterOptions } from '../parser';
import type { ParsedQuery } from '../parser/logParser';

export interface CostReportOptions extends FilterOptions {
  minScore?: number;
  complexityFilter?: 'low' | 'medium' | 'high';
}

/**
 * Filter queries and return cost estimates, optionally filtered by score or complexity.
 */
export function analyzeCosts(
  queries: ParsedQuery[],
  options: CostReportOptions = {}
) {
  const { minScore, complexityFilter, ...filterOptions } = options;

  const filtered = filterQueries(queries, filterOptions);
  let estimates = estimateBatch(filtered);

  if (minScore !== undefined) {
    estimates = estimates.filter(e => e.score >= minScore);
  }

  if (complexityFilter) {
    estimates = estimates.filter(e => e.complexity === complexityFilter);
  }

  return estimates.sort((a, b) => b.score - a.score);
}
