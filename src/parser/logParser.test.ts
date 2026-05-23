import { parseLine, ParsedQuery } from './logParser';

describe('parseLine', () => {
  it('should parse a valid PostgreSQL log line', () => {
    const line =
      '2024-01-15 12:34:56.789 UTC [1234] admin@mydb LOG:  duration: 12.345 ms  statement: SELECT * FROM users;';

    const result = parseLine(line);

    expect(result).not.toBeNull();
    expect(result?.user).toBe('admin');
    expect(result?.database).toBe('mydb');
    expect(result?.pid).toBe(1234);
    expect(result?.duration).toBeCloseTo(12.345);
    expect(result?.query).toBe('SELECT * FROM users;');
    expect(result?.timestamp).toEqual(new Date('2024-01-15 12:34:56.789'));
  });

  it('should return null for non-matching lines', () => {
    const lines = [
      '',
      'random log line',
      '2024-01-15 12:34:56.789 UTC [1234] admin@mydb LOG:  connection received',
      '2024-01-15 12:34:56.789 UTC [1234] admin@mydb ERROR:  syntax error',
    ];

    for (const line of lines) {
      expect(parseLine(line)).toBeNull();
    }
  });

  it('should parse a slow query correctly', () => {
    const line =
      '2024-03-22 08:00:01.001 UTC [9999] app@production LOG:  duration: 5432.100 ms  statement: SELECT id, name FROM orders WHERE created_at > NOW() - INTERVAL \'7 days\';';

    const result = parseLine(line);

    expect(result).not.toBeNull();
    expect(result?.duration).toBeCloseTo(5432.1);
    expect(result?.database).toBe('production');
    expect(result?.user).toBe('app');
  });

  it('should handle sub-millisecond durations', () => {
    const line =
      '2024-01-15 09:00:00.000 UTC [42] readonly@analytics LOG:  duration: 0.123 ms  statement: SELECT 1;';

    const result = parseLine(line);
    expect(result?.duration).toBeCloseTo(0.123);
    expect(result?.query).toBe('SELECT 1;');
  });
});
