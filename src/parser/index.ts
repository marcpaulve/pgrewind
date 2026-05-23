export { parseLogFile, parseLine } from './logParser';
export type { ParsedQuery } from './logParser';

import { ParsedQuery } from './logParser';

export interface FilterOptions {
  minDuration?: number;  // ms
  maxDuration?: number;  // ms
  user?: string;
  database?: string;
  queryContains?: string;
  from?: Date;
  to?: Date;
}

/**
 * Filter parsed queries based on provided criteria.
 */
export function filterQueries(
  queries: ParsedQuery[],
  options: FilterOptions
): ParsedQuery[] {
  return queries.filter((q) => {
    if (options.minDuration !== undefined && q.duration < options.minDuration) {
      return false;
    }
    if (options.maxDuration !== undefined && q.duration > options.maxDuration) {
      return false;
    }
    if (options.user && q.user !== options.user) {
      return false;
    }
    if (options.database && q.database !== options.database) {
      return false;
    }
    if (
      options.queryContains &&
      !q.query.toLowerCase().includes(options.queryContains.toLowerCase())
    ) {
      return false;
    }
    if (options.from && q.timestamp < options.from) {
      return false;
    }
    if (options.to && q.timestamp > options.to) {
      return false;
    }
    return true;
  });
}
