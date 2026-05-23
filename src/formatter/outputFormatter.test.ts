import { formatAsTable, formatAsCSV, formatAsJSON, formatOutput, ReportEntry } from './outputFormatter';

const sampleEntries: ReportEntry[] = [
  {
    timestamp: '2024-01-15T10:00:00.000Z',
    duration: 12.5,
    query: 'SELECT * FROM users WHERE id = 1',
    cost: 0.0042,
    rows: 1,
  },
  {
    timestamp: '2024-01-15T10:01:00.000Z',
    duration: 345.8,
    query: 'SELECT u.id, u.name, o.total FROM users u JOIN orders o ON u.id = o.user_id WHERE o.created_at > NOW() - INTERVAL \'30 days\'',
    cost: 1.2300,
    rows: 42,
  },
];

describe('formatAsTable', () => {
  it('returns a no-entries message for empty input', () => {
    const result = formatAsTable([]);
    expect(result).toBe('No entries to display.\n');
  });

  it('includes header and separator', () => {
    const result = formatAsTable(sampleEntries);
    expect(result).toContain('Timestamp');
    expect(result).toContain('Duration(ms)');
    expect(result).toContain('Cost');
    expect(result).toContain('Query');
  });

  it('truncates long queries with ellipsis', () => {
    const result = formatAsTable(sampleEntries);
    expect(result).toContain('...');
  });

  it('renders all entries', () => {
    const result = formatAsTable(sampleEntries);
    expect(result).toContain('2024-01-15T10:00:00.000Z');
    expect(result).toContain('2024-01-15T10:01:00.000Z');
  });
});

describe('formatAsCSV', () => {
  it('includes CSV headers', () => {
    const result = formatAsCSV(sampleEntries);
    expect(result.startsWith('timestamp,duration_ms,cost,rows,query')).toBe(true);
  });

  it('escapes quotes in query strings', () => {
    const entry: ReportEntry = {
      timestamp: '2024-01-15T10:02:00.000Z',
      duration: 5,
      query: 'SELECT "name" FROM users',
      cost: 0.001,
    };
    const result = formatAsCSV([entry]);
    expect(result).toContain('""name""');
  });

  it('produces correct number of lines', () => {
    const result = formatAsCSV(sampleEntries);
    const lines = result.trim().split('\n');
    expect(lines.length).toBe(sampleEntries.length + 1);
  });
});

describe('formatAsJSON', () => {
  it('produces valid JSON', () => {
    const result = formatAsJSON(sampleEntries);
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it('preserves all fields', () => {
    const parsed = JSON.parse(formatAsJSON(sampleEntries));
    expect(parsed[0].rows).toBe(1);
    expect(parsed[1].duration).toBe(345.8);
  });
});

describe('formatOutput', () => {
  it('defaults to table format', () => {
    const output = formatOutput(sampleEntries);
    expect(output.format).toBe('table');
  });

  it('returns the requested format', () => {
    expect(formatOutput(sampleEntries, 'json').format).toBe('json');
    expect(formatOutput(sampleEntries, 'csv').format).toBe('csv');
  });
});
