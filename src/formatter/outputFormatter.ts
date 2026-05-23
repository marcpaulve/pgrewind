import { ParsedQuery } from '../parser/index';
import { CostAnalysis } from '../cost/index';

export type OutputFormat = 'table' | 'json' | 'csv';

export interface FormattedOutput {
  format: OutputFormat;
  content: string;
}

export interface ReportEntry {
  timestamp: string;
  duration: number;
  query: string;
  cost: number;
  rows?: number;
}

export function formatAsTable(entries: ReportEntry[]): string {
  if (entries.length === 0) return 'No entries to display.\n';

  const header = `${'Timestamp'.padEnd(25)} ${'Duration(ms)'.padEnd(14)} ${'Cost'.padEnd(10)} ${'Query'.padEnd(60)}`;
  const separator = '-'.repeat(header.length);

  const rows = entries.map((e) => {
    const ts = e.timestamp.padEnd(25);
    const dur = String(e.duration.toFixed(2)).padEnd(14);
    const cost = String(e.cost.toFixed(4)).padEnd(10);
    const query = e.query.length > 57 ? e.query.slice(0, 57) + '...' : e.query.padEnd(60);
    return `${ts} ${dur} ${cost} ${query}`;
  });

  return [header, separator, ...rows].join('\n') + '\n';
}

export function formatAsCSV(entries: ReportEntry[]): string {
  const headers = ['timestamp', 'duration_ms', 'cost', 'rows', 'query'];
  const escape = (val: string) => `"${val.replace(/"/g, '""')}"`;

  const rows = entries.map((e) =>
    [
      escape(e.timestamp),
      e.duration.toFixed(2),
      e.cost.toFixed(4),
      e.rows ?? 0,
      escape(e.query),
    ].join(',')
  );

  return [headers.join(','), ...rows].join('\n') + '\n';
}

export function formatAsJSON(entries: ReportEntry[]): string {
  return JSON.stringify(entries, null, 2) + '\n';
}

export function formatOutput(
  entries: ReportEntry[],
  format: OutputFormat = 'table'
): FormattedOutput {
  let content: string;

  switch (format) {
    case 'json':
      content = formatAsJSON(entries);
      break;
    case 'csv':
      content = formatAsCSV(entries);
      break;
    case 'table':
    default:
      content = formatAsTable(entries);
      break;
  }

  return { format, content };
}
