import { Client, ClientConfig } from 'pg';
import { ParsedQuery } from '../parser/logParser';

export interface ReplayResult {
  query: string;
  duration: number;
  rowCount: number;
  error?: string;
  timestamp: Date;
}

export interface ReplayOptions {
  dryRun?: boolean;
  stopOnError?: boolean;
  delayMs?: number;
}

export async function replayQuery(
  client: Client,
  parsed: ParsedQuery,
  options: ReplayOptions = {}
): Promise<ReplayResult> {
  const start = Date.now();
  const timestamp = new Date();

  if (options.dryRun) {
    return { query: parsed.query, duration: 0, rowCount: 0, timestamp };
  }

  try {
    const result = await client.query(parsed.query);
    return {
      query: parsed.query,
      duration: Date.now() - start,
      rowCount: result.rowCount ?? 0,
      timestamp,
    };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    if (options.stopOnError) throw new Error(error);
    return { query: parsed.query, duration: Date.now() - start, rowCount: 0, error, timestamp };
  }
}

export async function replayBatch(
  queries: ParsedQuery[],
  config: ClientConfig,
  options: ReplayOptions = {}
): Promise<ReplayResult[]> {
  const client = new Client(config);
  await client.connect();

  const results: ReplayResult[] = [];

  for (const parsed of queries) {
    if (options.delayMs && options.delayMs > 0) {
      await new Promise((r) => setTimeout(r, options.delayMs));
    }
    const result = await replayQuery(client, parsed, options);
    results.push(result);
  }

  await client.end();
  return results;
}
