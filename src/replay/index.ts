import { ClientConfig } from 'pg';
import { filterQueries } from '../parser';
import { analyzeCosts } from '../cost';
import { formatOutput } from '../formatter/outputFormatter';
import { replayBatch, ReplayOptions, ReplayResult } from './queryReplayer';

export interface RunReplayOptions extends ReplayOptions {
  logFile: string;
  dbConfig: ClientConfig;
  filter?: string;
  format?: 'table' | 'csv' | 'json';
  showCosts?: boolean;
}

export interface ReplaySummary {
  total: number;
  succeeded: number;
  failed: number;
  totalDurationMs: number;
  results: ReplayResult[];
}

export async function runReplay(options: RunReplayOptions): Promise<ReplaySummary> {
  const { logFile, dbConfig, filter, format = 'table', showCosts = false, ...replayOpts } = options;

  const queries = filterQueries(logFile, filter ? { search: filter } : {});

  if (showCosts) {
    const costReport = analyzeCosts(queries);
    console.log(formatOutput(costReport.entries, format));
  }

  const results = await replayBatch(queries, dbConfig, replayOpts);

  const summary: ReplaySummary = {
    total: results.length,
    succeeded: results.filter((r) => !r.error).length,
    failed: results.filter((r) => !!r.error).length,
    totalDurationMs: results.reduce((sum, r) => sum + r.duration, 0),
    results,
  };

  return summary;
}

export { replayBatch, replayQuery } from './queryReplayer';
export type { ReplayResult, ReplayOptions } from './queryReplayer';
