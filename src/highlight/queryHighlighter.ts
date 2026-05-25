/**
 * queryHighlighter.ts
 * Syntax highlighting for SQL queries in terminal output.
 */

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const MAGENTA = '\x1b[35m';
const RED = '\x1b[31m';

const SQL_KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER',
  'ON', 'AND', 'OR', 'NOT', 'IN', 'EXISTS', 'LIKE', 'ILIKE', 'BETWEEN',
  'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'TRUNCATE',
  'CREATE', 'ALTER', 'DROP', 'TABLE', 'INDEX', 'VIEW', 'SCHEMA',
  'GROUP', 'BY', 'ORDER', 'HAVING', 'LIMIT', 'OFFSET', 'DISTINCT',
  'AS', 'WITH', 'UNION', 'ALL', 'EXCEPT', 'INTERSECT', 'RETURNING',
  'BEGIN', 'COMMIT', 'ROLLBACK', 'TRANSACTION', 'NULL', 'IS', 'CASE',
  'WHEN', 'THEN', 'ELSE', 'END', 'CAST', 'COALESCE', 'NULLIF',
];

const KEYWORD_PATTERN = new RegExp(
  `\\b(${SQL_KEYWORDS.join('|')})\\b`,
  'gi'
);

export function highlightSQL(query: string, useColor: boolean = true): string {
  if (!useColor) return query;

  return query
    // Keywords
    .replace(KEYWORD_PATTERN, (match) => `${BOLD}${CYAN}${match.toUpperCase()}${RESET}`)
    // String literals
    .replace(/'([^']*)'/g, `${GREEN}'$1'${RESET}`)
    // Numbers
    .replace(/\b(\d+(\.\d+)?)\b/g, `${YELLOW}$1${RESET}`)
    // Parameters ($1, $2, ...)
    .replace(/(\$\d+)/g, `${MAGENTA}$1${RESET}`)
    // Comments
    .replace(/(--[^\n]*)/g, `${RED}$1${RESET}`);
}

export function stripHighlight(query: string): string {
  // Remove ANSI escape codes
  return query.replace(/\x1b\[[0-9;]*m/g, '');
}

export function highlightBatch(queries: string[], useColor: boolean = true): string[] {
  return queries.map((q) => highlightSQL(q, useColor));
}
