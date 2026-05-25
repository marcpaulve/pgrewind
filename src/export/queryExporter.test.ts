import { exportAsSQL, exportAsJSON, exportAsCSV } from './queryExporter';
import { ParsedQuery } from '../parser/logParser';

const makeQuery = (overrides: Partial<ParsedQuery> = {}): ParsedQuery => ({
  timestamp: '2024-01-15 10:23:45.123 UTC',
  duration: 12.456,
  query: 'SELECT * FROM users WHERE id = 1',
  ...overrides,
});

describe('exportAsSQL', () => {
  it('formats a single query with comment', () => {
    const result = exportAsSQL([makeQuery()]);
    expect(result).toContain('-- [2024-01-15 10:23:45.123 UTC] duration: 12.456ms');
    expect(result).toContain('SELECT * FROM users WHERE id = 1;');
  });

  it('separates multiple queries with blank lines', () => {
    const result = exportAsSQL([makeQuery(), makeQuery({ query: 'SELECT 1' })]);
    expect(result).toContain('\n\n');
    expect(result).toContain('SELECT 1;');
  });

  it('handles missing duration gracefully', () => {
    const result = exportAsSQL([makeQuery({ duration: undefined })]);
    expect(result).toContain('duration: N/A ms');
  });
});

describe('exportAsJSON', () => {
  it('includes metadata by default', () => {
    const result = JSON.parse(exportAsJSON([makeQuery()]));
    expect(result[0]).toHaveProperty('timestamp');
    expect(result[0]).toHaveProperty('duration');
    expect(result[0]).toHaveProperty('query');
  });

  it('excludes metadata when flag is false', () => {
    const result = JSON.parse(exportAsJSON([makeQuery()], false));
    expect(result[0]).toHaveProperty('query');
    expect(result[0]).not.toHaveProperty('timestamp');
  });

  it('returns valid JSON array', () => {
    const result = exportAsJSON([makeQuery(), makeQuery()]);
    expect(() => JSON.parse(result)).not.toThrow();
    expect(JSON.parse(result)).toHaveLength(2);
  });
});

describe('exportAsCSV', () => {
  it('includes header row', () => {
    const result = exportAsCSV([makeQuery()]);
    expect(result.startsWith('timestamp,duration_ms,query')).toBe(true);
  });

  it('escapes double quotes in query', () => {
    const result = exportAsCSV([makeQuery({ query: 'SELECT "name" FROM t' })]);
    expect(result).toContain('""name""');
  });

  it('replaces newlines in query with spaces', () => {
    const result = exportAsCSV([makeQuery({ query: 'SELECT\n1' })]);
    expect(result).not.toContain('SELECT\n1');
    expect(result).toContain('SELECT 1');
  });

  it('produces correct number of rows', () => {
    const result = exportAsCSV([makeQuery(), makeQuery()]);
    const lines = result.split('\n');
    expect(lines).toHaveLength(3); // header + 2 rows
  });
});
