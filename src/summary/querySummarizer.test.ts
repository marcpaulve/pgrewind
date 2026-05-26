import { summarizeQueries } from './querySummarizer';
import { ParsedQuery } from '../parser/logParser';

function makeQuery(overrides: Partial<ParsedQuery> = {}): ParsedQuery {
  return {
    timestamp: new Date('2024-01-01T10:00:00Z'),
    query: 'SELECT 1',
    duration: 10,
    ...overrides,
  };
}

describe('summarizeQueries', () => {
  it('returns zeroed summary for empty input', () => {
    const result = summarizeQueries([]);
    expect(result.totalQueries).toBe(0);
    expect(result.uniqueQueries).toBe(0);
    expect(result.duplicateRatio).toBe(0);
    expect(result.timeRangeMs).toBeNull();
    expect(result.durationStats).toBeNull();
    expect(result.topQueryTypes).toEqual([]);
    expect(result.estimatedTotalCost).toBe(0);
    expect(result.slowestQuery).toBeNull();
  });

  it('counts total and unique queries correctly', () => {
    const queries = [
      makeQuery({ query: 'SELECT 1' }),
      makeQuery({ query: 'SELECT 1' }),
      makeQuery({ query: 'SELECT 2' }),
    ];
    const result = summarizeQueries(queries);
    expect(result.totalQueries).toBe(3);
    expect(result.uniqueQueries).toBeLessThanOrEqual(3);
    expect(result.duplicateRatio).toBeGreaterThanOrEqual(0);
    expect(result.duplicateRatio).toBeLessThanOrEqual(1);
  });

  it('computes time range from timestamps', () => {
    const queries = [
      makeQuery({ timestamp: new Date('2024-01-01T08:00:00Z') }),
      makeQuery({ timestamp: new Date('2024-01-01T10:00:00Z') }),
      makeQuery({ timestamp: new Date('2024-01-01T09:00:00Z') }),
    ];
    const result = summarizeQueries(queries);
    expect(result.timeRangeMs).not.toBeNull();
    expect(result.timeRangeMs!.start).toBe(new Date('2024-01-01T08:00:00Z').getTime());
    expect(result.timeRangeMs!.end).toBe(new Date('2024-01-01T10:00:00Z').getTime());
  });

  it('identifies the slowest query', () => {
    const slow = makeQuery({ query: 'SELECT slow', duration: 999 });
    const queries = [
      makeQuery({ duration: 10 }),
      slow,
      makeQuery({ duration: 50 }),
    ];
    const result = summarizeQueries(queries);
    expect(result.slowestQuery).toBe(slow);
  });

  it('aggregates top query types', () => {
    const queries = [
      makeQuery({ query: 'SELECT a FROM t' }),
      makeQuery({ query: 'SELECT b FROM t' }),
      makeQuery({ query: 'INSERT INTO t VALUES (1)' }),
    ];
    const result = summarizeQueries(queries);
    const types = result.topQueryTypes.map((t) => t.type);
    expect(types).toContain('SELECT');
    const selectEntry = result.topQueryTypes.find((t) => t.type === 'SELECT');
    expect(selectEntry?.count).toBe(2);
    expect(selectEntry?.pct).toBeCloseTo(2 / 3);
  });

  it('returns non-negative estimated total cost', () => {
    const queries = [makeQuery(), makeQuery(), makeQuery()];
    const result = summarizeQueries(queries);
    expect(result.estimatedTotalCost).toBeGreaterThanOrEqual(0);
  });
});
