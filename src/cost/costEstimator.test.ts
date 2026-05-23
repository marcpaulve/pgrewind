import { estimateCost, estimateBatch } from './costEstimator';
import { ParsedQuery } from '../parser/logParser';

const makeQuery = (query: string, durationMs: number | null = null): ParsedQuery => ({
  query,
  durationMs,
  timestamp: '2024-01-01 00:00:00',
  user: 'test',
  database: 'testdb',
});

describe('estimateCost', () => {
  it('returns low complexity for a simple query', () => {
    const result = estimateCost(makeQuery('SELECT id FROM users WHERE id = 1'));
    expect(result.complexity).toBe('low');
    expect(result.warnings).toHaveLength(0);
  });

  it('detects SELECT * and adds warning', () => {
    const result = estimateCost(makeQuery('SELECT * FROM orders'));
    expect(result.warnings).toContain('SELECT * detected — consider specifying columns');
    expect(result.score).toBeGreaterThan(0);
  });

  it('detects missing WHERE clause', () => {
    const result = estimateCost(makeQuery('SELECT id FROM users'));
    expect(result.warnings.some(w => w.includes('No WHERE clause'))).toBe(true);
    expect(result.complexity).not.toBe('low');
  });

  it('penalizes slow queries over 1000ms', () => {
    const result = estimateCost(makeQuery('SELECT id FROM users WHERE id = 1', 1500));
    expect(result.warnings.some(w => w.includes('Slow query'))).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(30);
  });

  it('assigns high complexity for joins + no where + slow', () => {
    const q = 'SELECT * FROM orders JOIN users ON orders.user_id = users.id';
    const result = estimateCost(makeQuery(q, 2000));
    expect(result.complexity).toBe('high');
  });

  it('counts multiple JOINs in score', () => {
    const q = 'SELECT a.id FROM a JOIN b ON a.id = b.a_id JOIN c ON b.id = c.b_id WHERE a.id = 1';
    const result = estimateCost(makeQuery(q));
    expect(result.score).toBeGreaterThanOrEqual(20);
  });
});

describe('estimateBatch', () => {
  it('returns an estimate for each query', () => {
    const queries = [
      makeQuery('SELECT id FROM users WHERE id = 1'),
      makeQuery('SELECT * FROM logs'),
    ];
    const results = estimateBatch(queries);
    expect(results).toHaveLength(2);
    expect(results[1].warnings.length).toBeGreaterThan(0);
  });
});
