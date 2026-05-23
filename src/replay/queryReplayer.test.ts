import { replayQuery, replayBatch, ReplayResult } from './queryReplayer';
import { ParsedQuery } from '../parser/logParser';

const mockQuery: ParsedQuery = {
  query: 'SELECT 1',
  timestamp: new Date('2024-01-01T10:00:00Z'),
  duration: 5,
  user: 'admin',
  database: 'testdb',
};

const mockClient: any = {
  query: jest.fn().mockResolvedValue({ rowCount: 1, rows: [{ '?column?': 1 }] }),
  connect: jest.fn(),
  end: jest.fn(),
};

jest.mock('pg', () => ({
  Client: jest.fn().mockImplementation(() => mockClient),
}));

describe('replayQuery', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns dry run result without executing', async () => {
    const result = await replayQuery(mockClient, mockQuery, { dryRun: true });
    expect(mockClient.query).not.toHaveBeenCalled();
    expect(result.rowCount).toBe(0);
    expect(result.duration).toBe(0);
    expect(result.query).toBe('SELECT 1');
  });

  it('executes query and returns result', async () => {
    const result = await replayQuery(mockClient, mockQuery);
    expect(mockClient.query).toHaveBeenCalledWith('SELECT 1');
    expect(result.rowCount).toBe(1);
    expect(result.error).toBeUndefined();
  });

  it('captures error and continues when stopOnError is false', async () => {
    mockClient.query.mockRejectedValueOnce(new Error('syntax error'));
    const result = await replayQuery(mockClient, mockQuery, { stopOnError: false });
    expect(result.error).toBe('syntax error');
    expect(result.rowCount).toBe(0);
  });

  it('throws when stopOnError is true and query fails', async () => {
    mockClient.query.mockRejectedValueOnce(new Error('fatal'));
    await expect(replayQuery(mockClient, mockQuery, { stopOnError: true })).rejects.toThrow('fatal');
  });
});

describe('replayBatch', () => {
  it('replays all queries and returns results array', async () => {
    const results = await replayBatch([mockQuery, mockQuery], {});
    expect(results).toHaveLength(2);
    results.forEach((r: ReplayResult) => expect(r.query).toBe('SELECT 1'));
  });
});
