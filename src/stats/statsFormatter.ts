import { QueryStats } from './queryStats';

function pad(str: string, len: number): string {
  return str.length >= len ? str.slice(0, len) : str + ' '.repeat(len - str.length);
}

function fmtMs(ms: number): string {
  return ms.toFixed(2) + 'ms';
}

export function formatStatsTable(stats: QueryStats): string {
  const lines: string[] = [];

  lines.push('=== Query Statistics ===');
  lines.push('');
  lines.push(`Total queries : ${stats.totalQueries}`);
  lines.push(`Unique types  : ${stats.byType ? Object.keys(stats.byType).length : 0}`);
  lines.push('');

  lines.push(pad('Metric', 20) + pad('Value', 15));
  lines.push('-'.repeat(35));
  lines.push(pad('Min duration', 20) + pad(fmtMs(stats.minDuration), 15));
  lines.push(pad('Max duration', 20) + pad(fmtMs(stats.maxDuration), 15));
  lines.push(pad('Avg duration', 20) + pad(fmtMs(stats.avgDuration), 15));
  lines.push(pad('p50 duration', 20) + pad(fmtMs(stats.p50), 15));
  lines.push(pad('p95 duration', 20) + pad(fmtMs(stats.p95), 15));
  lines.push(pad('p99 duration', 20) + pad(fmtMs(stats.p99), 15));
  lines.push('');

  if (stats.byType && Object.keys(stats.byType).length > 0) {
    lines.push('Queries by type:');
    lines.push(pad('Type', 12) + pad('Count', 10) + pad('Avg (ms)', 12));
    lines.push('-'.repeat(34));
    for (const [type, info] of Object.entries(stats.byType)) {
      lines.push(
        pad(type, 12) +
        pad(String(info.count), 10) +
        pad(fmtMs(info.avgDuration), 12)
      );
    }
    lines.push('');
  }

  return lines.join('\n');
}

export function formatStatsJSON(stats: QueryStats): string {
  return JSON.stringify(stats, null, 2);
}

export function formatStats(stats: QueryStats, format: 'table' | 'json' = 'table'): string {
  if (format === 'json') return formatStatsJSON(stats);
  return formatStatsTable(stats);
}
