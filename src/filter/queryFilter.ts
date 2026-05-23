import { ParsedQuery } from '../parser/logParser';

export interface FilterOptions {
  startTime?: Date;
  endTime?: Date;
  minDuration?: number; // milliseconds
  maxDuration?: number; // milliseconds
  user?: string;
  database?: string;
  queryPattern?: string;
  excludePattern?: string;
}

export function filterByTimeRange(
  queries: ParsedQuery[],
  startTime?: Date,
  endTime?: Date
): ParsedQuery[] {
  return queries.filter((q) => {
    if (startTime && q.timestamp < startTime) return false;
    if (endTime && q.timestamp > endTime) return false;
    return true;
  });
}

export function filterByDuration(
  queries: ParsedQuery[],
  minDuration?: number,
  maxDuration?: number
): ParsedQuery[] {
  return queries.filter((q) => {
    if (minDuration !== undefined && (q.duration ?? 0) < minDuration) return false;
    if (maxDuration !== undefined && (q.duration ?? Infinity) > maxDuration) return false;
    return true;
  });
}

export function filterByPattern(
  queries: ParsedQuery[],
  pattern?: string,
  excludePattern?: string
): ParsedQuery[] {
  return queries.filter((q) => {
    if (pattern) {
      const regex = new RegExp(pattern, 'i');
      if (!regex.test(q.query)) return false;
    }
    if (excludePattern) {
      const excludeRegex = new RegExp(excludePattern, 'i');
      if (excludeRegex.test(q.query)) return false;
    }
    return true;
  });
}

export function applyFilters(
  queries: ParsedQuery[],
  options: FilterOptions
): ParsedQuery[] {
  let result = [...queries];

  result = filterByTimeRange(result, options.startTime, options.endTime);
  result = filterByDuration(result, options.minDuration, options.maxDuration);
  result = filterByPattern(result, options.queryPattern, options.excludePattern);

  if (options.user) {
    result = result.filter((q) => q.user === options.user);
  }

  if (options.database) {
    result = result.filter((q) => q.database === options.database);
  }

  return result;
}
