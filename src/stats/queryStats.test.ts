import { computeStats } from './queryStats';
import { ParsedQuery } from '../parser/logParser';

function makeQuery(query: string, durationMs: number): ParsedQuery {
  return {
    timestamp: new Date('2024-01-01T00:00:00Z'),
    query,
    durationMs,
    user: 'testuser',
    database: 'testdb',
  };
}

describe('computeStats', () => {
  it('returns zeroed stats for empty array', () => {
    const stats = computeStats([]);
    expect(stats.totalQueries).toBe(0);
    expect(stats.avgDurationMs).toBe(0);
    expect(stats.slowestQuery).toBeNull();
    expect(stats.fastestQuery).toBeNull();
  });

  it('computes total and average duration', () => {
    const queries = [
      makeQuery('SELECT 1', 10),
      makeQuery('SELECT 2', 20),
      makeQuery('SELECT 3', 30),
    ];
    const stats = computeStats(queries);
    expect(stats.totalQueries).toBe(3);
    expect(stats.totalDurationMs).toBe(60);
    expect(stats.avgDurationMs).toBeCloseTo(20);
  });

  it('identifies slowest and fastest queries', () => {
    const queries = [
      makeQuery('SELECT fast', 5),
      makeQuery('SELECT slow', 100),
      makeQuery('SELECT mid', 50),
    ];
    const stats = computeStats(queries);
    expect(stats.slowestQuery?.query).toBe('SELECT slow');
    expect(stats.fastestQuery?.query).toBe('SELECT fast');
    expect(stats.minDurationMs).toBe(5);
    expect(stats.maxDurationMs).toBe(100);
  });

  it('counts unique queries', () => {
    const queries = [
      makeQuery('SELECT 1', 10),
      makeQuery('SELECT 1', 15),
      makeQuery('SELECT 2', 20),
    ];
    const stats = computeStats(queries);
    expect(stats.uniqueQueries).toBe(2);
  });

  it('breaks down query types correctly', () => {
    const queries = [
      makeQuery('SELECT id FROM users', 10),
      makeQuery('INSERT INTO logs VALUES (1)', 20),
      makeQuery('UPDATE users SET name = \'a\'', 15),
      makeQuery('SELECT count(*) FROM orders', 5),
    ];
    const stats = computeStats(queries);
    expect(stats.queryTypeBreakdown['SELECT']).toBe(2);
    expect(stats.queryTypeBreakdown['INSERT']).toBe(1);
    expect(stats.queryTypeBreakdown['UPDATE']).toBe(1);
  });

  it('computes percentiles correctly', () => {
    const queries = Array.from({ length: 100 }, (_, i) =>
      makeQuery(`SELECT ${i}`, i + 1)
    );
    const stats = computeStats(queries);
    expect(stats.p50DurationMs).toBe(50);
    expect(stats.p95DurationMs).toBe(95);
    expect(stats.p99DurationMs).toBe(99);
  });
});
