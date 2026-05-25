import { normalizeQuery, deduplicateQueries, ParsedQuery } from './queryDeduplicator';

const makeQuery = (raw: string, duration: number, timestamp: string): ParsedQuery => ({
  raw,
  duration,
  timestamp,
});

describe('normalizeQuery', () => {
  it('lowercases and trims whitespace', () => {
    expect(normalizeQuery('  SELECT 1  ')).toBe('select ?');
  });

  it('replaces string literals with ?', () => {
    expect(normalizeQuery("SELECT * FROM users WHERE name = 'alice'")).toBe(
      'select * from users where name = ?'
    );
  });

  it('replaces numeric literals with ?', () => {
    expect(normalizeQuery('SELECT * FROM orders WHERE id = 42')).toBe(
      'select * from orders where id = ?'
    );
  });

  it('collapses multiple spaces', () => {
    expect(normalizeQuery('SELECT   *   FROM   t')).toBe('select * from t');
  });

  it('handles empty string', () => {
    expect(normalizeQuery('')).toBe('');
  });

  it('replaces multiple literals in one query', () => {
    expect(normalizeQuery("SELECT * FROM t WHERE a = 1 AND b = 'foo'")).toBe(
      'select * from t where a = ? and b = ?'
    );
  });
});

describe('deduplicateQueries', () => {
  const q1 = makeQuery("SELECT * FROM users WHERE id = 1", 10, '2024-01-01T00:00:00Z');
  const q2 = makeQuery("SELECT * FROM users WHERE id = 2", 20, '2024-01-01T00:01:00Z');
  const q3 = makeQuery("INSERT INTO logs VALUES ('x')", 5, '2024-01-01T00:02:00Z');

  it('groups identical normalized queries', () => {
    const result = deduplicateQueries([q1, q2]);
    expect(result).toHaveLength(1);
    expect(result[0].count).toBe(2);
  });

  it('keeps distinct queries separate', () => {
    const result = deduplicateQueries([q1, q3]);
    expect(result).toHaveLength(2);
  });

  it('computes correct avg, min, max duration', () => {
    const result = deduplicateQueries([q1, q2]);
    expect(result[0].avgDuration).toBe(15);
    expect(result[0].minDuration).toBe(10);
    expect(result[0].maxDuration).toBe(20);
  });

  it('tracks firstSeen and lastSeen', () => {
    const result = deduplicateQueries([q1, q2]);
    expect(result[0].firstSeen).toBe('2024-01-01T00:00:00Z');
    expect(result[0].lastSeen).toBe('2024-01-01T00:01:00Z');
  });

  it('stores up to 3 examples', () => {
    const queries = [
      makeQuery("SELECT * FROM t WHERE id = 1", 5, 'a'),
      makeQuery("SELECT * FROM t WHERE id = 2", 5, 'b'),
      makeQuery("SELECT * FROM t WHERE id = 3", 5, 'c'),
      makeQuery("SELECT * FROM t WHERE id = 4", 5, 'd'),
    ];
    const result = deduplicateQueries(queries);
    expect(result[0].examples).toHaveLength(3);
  });

  it('sorts by count descending', () => {
    const result = deduplicateQueries([q1, q2, q3]);
    expect(result[0].count).toBeGreaterThanOrEqual(result[result.length - 1].count);
  });

  it('returns empty array for empty input', () => {
    const result = deduplicateQueries([]);
    expect(result).toHaveLength(0);
  });

  it('handles a single query correctly', () => {
    const result = deduplicateQueries([q1]);
    expect(result).toHaveLength(1);
    expect(result[0].count).toBe(1);
    expect(result[0].avgDuration).toBe(10);
    expect(result[0].minDuration).toBe(10);
    expect(result[0].maxDuration).toBe(10);
    expect(result[0].firstSeen).toBe(result[0].lastSeen);
  });
});
