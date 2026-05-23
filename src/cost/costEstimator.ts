import { ParsedQuery } from '../parser/logParser';

export interface CostEstimate {
  query: string;
  durationMs: number | null;
  complexity: 'low' | 'medium' | 'high';
  score: number;
  warnings: string[];
}

const JOIN_PATTERN = /\bJOIN\b/gi;
const SUBQUERY_PATTERN = /\bSELECT\b/gi;
const WILDCARD_PATTERN = /SELECT\s+\*/gi;
const NO_WHERE_PATTERN = /^\s*(SELECT|UPDATE|DELETE)(?!.*\bWHERE\b)/i;

export function estimateCost(parsed: ParsedQuery): CostEstimate {
  const { query, durationMs } = parsed;
  const warnings: string[] = [];
  let score = 0;

  const joinCount = (query.match(JOIN_PATTERN) || []).length;
  const subqueryCount = Math.max(0, (query.match(SUBQUERY_PATTERN) || []).length - 1);
  const hasWildcard = WILDCARD_PATTERN.test(query);
  const hasNoWhere = NO_WHERE_PATTERN.test(query);

  score += joinCount * 10;
  score += subqueryCount * 15;

  if (hasWildcard) {
    score += 5;
    warnings.push('SELECT * detected — consider specifying columns');
  }

  if (hasNoWhere) {
    score += 20;
    warnings.push('No WHERE clause detected — full table scan likely');
  }

  if (durationMs !== null) {
    if (durationMs > 1000) {
      score += 30;
      warnings.push(`Slow query: ${durationMs}ms execution time`);
    } else if (durationMs > 200) {
      score += 10;
    }
  }

  const complexity: CostEstimate['complexity'] =
    score >= 40 ? 'high' : score >= 15 ? 'medium' : 'low';

  return { query, durationMs, complexity, score, warnings };
}

export function estimateBatch(queries: ParsedQuery[]): CostEstimate[] {
  return queries.map(estimateCost);
}
