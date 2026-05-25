import { highlightSQL, stripHighlight, highlightBatch } from './queryHighlighter';

describe('highlightSQL', () => {
  it('uppercases and wraps SQL keywords', () => {
    const result = highlightSQL('select * from users');
    expect(result).toContain('SELECT');
    expect(result).toContain('FROM');
    // ANSI codes present
    expect(result).toMatch(/\x1b\[/);
  });

  it('highlights string literals', () => {
    const result = highlightSQL("SELECT name FROM users WHERE status = 'active'");
    expect(result).toContain("'active'");
    expect(result).toMatch(/\x1b\[32m'active'/);
  });

  it('highlights numeric values', () => {
    const result = highlightSQL('SELECT * FROM orders WHERE id = 42');
    expect(result).toMatch(/\x1b\[33m42/);
  });

  it('highlights query parameters', () => {
    const result = highlightSQL('SELECT * FROM users WHERE id = $1 AND role = $2');
    expect(result).toMatch(/\x1b\[35m\$1/);
    expect(result).toMatch(/\x1b\[35m\$2/);
  });

  it('highlights SQL comments', () => {
    const result = highlightSQL('SELECT * FROM users -- fetch all users');
    expect(result).toMatch(/\x1b\[31m-- fetch all users/);
  });

  it('returns plain string when useColor is false', () => {
    const result = highlightSQL('SELECT * FROM users', false);
    expect(result).toBe('SELECT * FROM users');
    expect(result).not.toMatch(/\x1b\[/);
  });

  it('handles INSERT statements', () => {
    const result = highlightSQL("INSERT INTO logs (msg) VALUES ('hello')");
    expect(result).toContain('INSERT');
    expect(result).toContain('INTO');
    expect(result).toContain('VALUES');
  });
});

describe('stripHighlight', () => {
  it('removes ANSI escape codes', () => {
    const highlighted = highlightSQL('SELECT id FROM users');
    const stripped = stripHighlight(highlighted);
    expect(stripped).not.toMatch(/\x1b\[/);
    expect(stripped).toContain('SELECT');
    expect(stripped).toContain('FROM');
  });

  it('returns plain string unchanged', () => {
    const plain = 'SELECT * FROM orders';
    expect(stripHighlight(plain)).toBe(plain);
  });
});

describe('highlightBatch', () => {
  it('highlights all queries in array', () => {
    const queries = ['SELECT 1', 'SELECT 2 FROM t', 'DELETE FROM logs'];
    const results = highlightBatch(queries);
    expect(results).toHaveLength(3);
    results.forEach((r) => expect(r).toMatch(/\x1b\[/));
  });

  it('returns plain strings when useColor is false', () => {
    const queries = ['SELECT 1', 'INSERT INTO t VALUES (1)'];
    const results = highlightBatch(queries, false);
    results.forEach((r) => expect(r).not.toMatch(/\x1b\[/));
  });
});
