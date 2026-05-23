import { formatDedupTable, formatDedupSummary, formatDedupJSON } from './dedupFormatter';
import { DedupedQuery, DedupSummary } from './index';

const makeDedupedQuery = (overrides: Partial<DedupedQuery> = {}): DedupedQuery => ({
  normalized: 'select * from users where id = ?',
  count: 5,
  totalDuration: 50,
  avgDuration: 10,
  minDuration: 5,
  maxDuration: 20,
  firstSeen: '2024-01-01T00:00:00Z',
  lastSeen: '2024-01-01T01:00:00Z',
  examples: ['SELECT * FROM users WHERE id = 1'],
  ...overrides,
});

const makeSummary = (overrides: Partial<DedupSummary> = {}): DedupSummary => ({
  totalQueries: 10,
  uniqueQueries: 3,
  topRepeated: [makeDedupedQuery()],
  deduped: [makeDedupedQuery()],
  ...overrides,
});

describe('formatDedupTable', () => {
  it('includes header columns', () => {
    const result = formatDedupTable([makeDedupedQuery()]);
    expect(result).toContain('Count');
    expect(result).toContain('Avg(ms)');
    expect(result).toContain('Normalized Query');
  });

  it('includes query data', () => {
    const result = formatDedupTable([makeDedupedQuery()]);
    expect(result).toContain('5');
    expect(result).toContain('10.00');
  });

  it('returns empty table body for empty input', () => {
    const result = formatDedupTable([]);
    const lines = result.split('\n');
    expect(lines.length).toBe(2); // header + separator only
  });
});

describe('formatDedupSummary', () => {
  it('includes total and unique query counts', () => {
    const result = formatDedupSummary(makeSummary());
    expect(result).toContain('Total queries   : 10');
    expect(result).toContain('Unique patterns : 3');
  });

  it('calculates duplicate rate', () => {
    const result = formatDedupSummary(makeSummary());
    expect(result).toContain('70.0%');
  });

  it('includes top repeated section', () => {
    const result = formatDedupSummary(makeSummary());
    expect(result).toContain('Top Repeated Queries');
  });
});

describe('formatDedupJSON', () => {
  it('produces valid JSON', () => {
    const result = formatDedupJSON(makeSummary());
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it('includes expected fields', () => {
    const parsed = JSON.parse(formatDedupJSON(makeSummary()));
    expect(parsed).toHaveProperty('totalQueries');
    expect(parsed).toHaveProperty('uniqueQueries');
    expect(parsed).toHaveProperty('topRepeated');
  });
});
