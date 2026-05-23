/**
 * Formatting utilities for deduplication results.
 */

import { DedupedQuery, DedupSummary } from './index';

function pad(str: string, len: number): string {
  return str.length >= len ? str.slice(0, len - 1) + '…' : str.padEnd(len);
}

export function formatDedupTable(deduped: DedupedQuery[]): string {
  const header = [
    pad('Count', 7),
    pad('Avg(ms)', 9),
    pad('Min(ms)', 9),
    pad('Max(ms)', 9),
    pad('Normalized Query', 60),
  ].join(' | ');

  const separator = '-'.repeat(header.length);

  const rows = deduped.map((d) =>
    [
      pad(String(d.count), 7),
      pad(d.avgDuration.toFixed(2), 9),
      pad(String(d.minDuration), 9),
      pad(String(d.maxDuration), 9),
      pad(d.normalized, 60),
    ].join(' | ')
  );

  return [header, separator, ...rows].join('\n');
}

export function formatDedupSummary(summary: DedupSummary): string {
  const lines: string[] = [
    `Total queries   : ${summary.totalQueries}`,
    `Unique patterns : ${summary.uniqueQueries}`,
    `Duplicate rate  : ${(((summary.totalQueries - summary.uniqueQueries) / summary.totalQueries) * 100).toFixed(1)}%`,
    '',
    '--- Top Repeated Queries ---',
    formatDedupTable(summary.topRepeated),
  ];
  return lines.join('\n');
}

export function formatDedupJSON(summary: DedupSummary): string {
  return JSON.stringify(
    {
      totalQueries: summary.totalQueries,
      uniqueQueries: summary.uniqueQueries,
      topRepeated: summary.topRepeated,
    },
    null,
    2
  );
}
