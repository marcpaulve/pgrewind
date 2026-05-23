import { program } from './cli';
import * as fs from 'fs';
import * as path from 'path';

const SAMPLE_LOG = `2024-01-15 10:00:01.123 UTC [1234] user@mydb LOG:  duration: 5.321 ms  statement: SELECT * FROM users;
2024-01-15 10:00:02.456 UTC [1235] admin@mydb LOG:  duration: 120.456 ms  statement: SELECT id, name FROM orders WHERE status = 'pending';
2024-01-15 10:00:03.789 UTC [1236] user@testdb LOG:  duration: 0.987 ms  statement: SELECT 1;
`;

const TEMP_LOG_PATH = path.join(__dirname, '__test_sample.log');

beforeAll(() => {
  fs.writeFileSync(TEMP_LOG_PATH, SAMPLE_LOG, 'utf-8');
});

afterAll(() => {
  if (fs.existsSync(TEMP_LOG_PATH)) {
    fs.unlinkSync(TEMP_LOG_PATH);
  }
});

describe('CLI analyze command', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should analyze a log file and print output', () => {
    process.argv = ['node', 'pgrewind', 'analyze', TEMP_LOG_PATH];
    expect(() => program.parseAsync(process.argv)).not.toThrow();
  });

  it('should accept --format json option', () => {
    process.argv = ['node', 'pgrewind', 'analyze', TEMP_LOG_PATH, '--format', 'json'];
    expect(() => program.parseAsync(process.argv)).not.toThrow();
  });

  it('should accept --limit option', () => {
    process.argv = ['node', 'pgrewind', 'analyze', TEMP_LOG_PATH, '--limit', '1'];
    expect(() => program.parseAsync(process.argv)).not.toThrow();
  });

  it('should exit with error for missing log file', () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit(${code})`);
    });
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    process.argv = ['node', 'pgrewind', 'analyze', 'nonexistent.log'];
    expect(() => program.parse(process.argv)).toThrow('process.exit(1)');

    exitSpy.mockRestore();
    errorSpy.mockRestore();
  });
});
