import { formatStatsTable, formatStatsJSON, formatStats } from './statsFormatter';
import { QueryStats } from './queryStats';

const sampleStats: QueryStats = {
  totalQueries: 10,
  minDuration: 1.5,
  maxDuration: 120.0,
  avgDuration: 30.25,
  p50: 22.0,
  p95: 110.0,
  p99: 118.0,
  byType: {
    SELECT: { count: 7, avgDuration: 28.0 },
    INSERT: { count: 2, avgDuration: 40.0 },
    UPDATE: { count: 1, avgDuration: 15.0 },
  },
};

describe('formatStatsTable', () => {
  it('includes total queries', () => {
    const out = formatStatsTable(sampleStats);
    expect(out).toContain('Total queries');
    expect(out).toContain('10');
  });

  it('includes all duration metrics', () => {
    const out = formatStatsTable(sampleStats);
    expect(out).toContain('1.50ms');
    expect(out).toContain('120.00ms');
    expect(out).toContain('30.25ms');
    expect(out).toContain('22.00ms');
    expect(out).toContain('110.00ms');
    expect(out).toContain('118.00ms');
  });

  it('includes query type breakdown', () => {
    const out = formatStatsTable(sampleStats);
    expect(out).toContain('SELECT');
    expect(out).toContain('INSERT');
    expect(out).toContain('UPDATE');
    expect(out).toContain('7');
  });

  it('handles missing byType gracefully', () => {
    const noType: QueryStats = { ...sampleStats, byType: undefined };
    const out = formatStatsTable(noType);
    expect(out).toContain('Total queries');
    expect(out).not.toContain('Queries by type');
  });
});

describe('formatStatsJSON', () => {
  it('returns valid JSON', () => {
    const out = formatStatsJSON(sampleStats);
    const parsed = JSON.parse(out);
    expect(parsed.totalQueries).toBe(10);
    expect(parsed.p95).toBe(110.0);
  });

  it('includes byType in JSON output', () => {
    const out = formatStatsJSON(sampleStats);
    const parsed = JSON.parse(out);
    expect(parsed.byType.SELECT.count).toBe(7);
  });
});

describe('formatStats', () => {
  it('defaults to table format', () => {
    const out = formatStats(sampleStats);
    expect(out).toContain('Query Statistics');
  });

  it('returns JSON when requested', () => {
    const out = formatStats(sampleStats, 'json');
    const parsed = JSON.parse(out);
    expect(parsed.totalQueries).toBe(10);
  });
});
