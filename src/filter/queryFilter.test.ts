import { applyFilters, filterByDuration, filterByPattern, filterByTimeRange } from './queryFilter';
import { ParsedQuery } from '../parser/logParser';

const mockQueries: ParsedQuery[] = [
  {
    timestamp: new Date('2024-01-15T10:00:00Z'),
    query: 'SELECT * FROM users',
    duration: 50,
    user: 'alice',
    database: 'mydb',
  },
  {
    timestamp: new Date('2024-01-15T11:00:00Z'),
    query: 'INSERT INTO orders VALUES ($1, $2)',
    duration: 200,
    user: 'bob',
    database: 'mydb',
  },
  {
    timestamp: new Date('2024-01-15T12:00:00Z'),
    query: 'DELETE FROM sessions WHERE expired = true',
    duration: 15,
    user: 'alice',
    database: 'analytics',
  },
];

describe('filterByTimeRange', () => {
  it('filters queries after startTime', () => {
    const result = filterByTimeRange(mockQueries, new Date('2024-01-15T10:30:00Z'));
    expect(result).toHaveLength(2);
    expect(result[0].user).toBe('bob');
  });

  it('filters queries before endTime', () => {
    const result = filterByTimeRange(mockQueries, undefined, new Date('2024-01-15T11:30:00Z'));
    expect(result).toHaveLength(2);
  });

  it('filters queries within a time range', () => {
    const result = filterByTimeRange(
      mockQueries,
      new Date('2024-01-15T10:30:00Z'),
      new Date('2024-01-15T11:30:00Z'),
    );
    expect(result).toHaveLength(1);
    expect(result[0].user).toBe('bob');
  });

  it('returns all queries when no range specified', () => {
    expect(filterByTimeRange(mockQueries)).toHaveLength(3);
  });
});

describe('filterByDuration', () => {
  it('filters by minimum duration', () => {
    const result = filterByDuration(mockQueries, 100);
    expect(result).toHaveLength(1);
    expect(result[0].duration).toBe(200);
  });

  it('filters by maximum duration', () => {
    const result = filterByDuration(mockQueries, undefined, 100);
    expect(result).toHaveLength(2);
  });

  it('filters by both min and max duration', () => {
    const result = filterByDuration(mockQueries, 20, 100);
    expect(result).toHaveLength(1);
    expect(result[0].duration).toBe(50);
  });
});

describe('filterByPattern', () => {
  it('includes only matching queries', () => {
    const result = filterByPattern(mockQueries, 'SELECT');
    expect(result).toHaveLength(1);
    expect(result[0].query).toContain('SELECT');
  });

  it('excludes matching queries', () => {
    const result = filterByPattern(mockQueries, undefined, 'DELETE');
    expect(result).toHaveLength(2);
  });
});

describe('applyFilters', () => {
  it('filters by user', () => {
    const result = applyFilters(mockQueries, { user: 'alice' });
    expect(result).toHaveLength(2);
    expect(result.every((q) => q.user === 'alice')).toBe(true);
  });

  it('filters by database', () => {
    const result = applyFilters(mockQueries, { database: 'analytics' });
    expect(result).toHaveLength(1);
  });

  it('combines multiple filters', () => {
    const result = applyFilters(mockQueries, { user: 'alice', minDuration: 20 });
    expect(result).toHaveLength(1);
    expect(result[0].query).toContain('SELECT');
  });

  it('returns empty array when no queries match', () => {
    const result = applyFilters(mockQueries, { user: 'nonexistent' });
    expect(result).toHaveLength(0);
  });
});
