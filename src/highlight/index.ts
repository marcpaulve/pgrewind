/**
 * highlight/index.ts
 * Public API for the query highlighting module.
 */

import { highlightSQL, highlightBatch, stripHighlight } from './queryHighlighter';
import type { ParsedQuery } from '../parser/logParser';

export interface HighlightOptions {
  useColor?: boolean;
  stripOnExport?: boolean;
}

/**
 * Highlights the SQL in a single ParsedQuery, returning a new object
 * with the `query` field replaced by its highlighted version.
 */
export function highlightQuery(
  parsed: ParsedQuery,
  options: HighlightOptions = {}
): ParsedQuery & { highlighted: string } {
  const { useColor = true } = options;
  return {
    ...parsed,
    highlighted: highlightSQL(parsed.query, useColor),
  };
}

/**
 * Highlights SQL in an array of ParsedQuery objects.
 */
export function highlightQueries(
  queries: ParsedQuery[],
  options: HighlightOptions = {}
): Array<ParsedQuery & { highlighted: string }> {
  return queries.map((q) => highlightQuery(q, options));
}

/**
 * Returns a plain highlighted string for quick CLI display.
 */
export function renderQuery(query: string, options: HighlightOptions = {}): string {
  const { useColor = true, stripOnExport = false } = options;
  const result = highlightSQL(query, useColor);
  return stripOnExport ? stripHighlight(result) : result;
}

export { highlightSQL, highlightBatch, stripHighlight };
