import * as fs from 'fs';
import * as path from 'path';
import { ParsedQuery } from '../parser/logParser';

export type ExportFormat = 'sql' | 'json' | 'csv';

export interface ExportOptions {
  format: ExportFormat;
  outputPath: string;
  includeMetadata?: boolean;
}

export function exportAsSQL(queries: ParsedQuery[]): string {
  return queries
    .map((q) => {
      const comment = `-- [${q.timestamp}] duration: ${q.duration?.toFixed(3) ?? 'N/A'}ms`;
      return `${comment}\n${q.query.trim()};`;
    })
    .join('\n\n');
}

export function exportAsJSON(queries: ParsedQuery[], includeMetadata = true): string {
  const data = includeMetadata
    ? queries
    : queries.map((q) => ({ query: q.query }));
  return JSON.stringify(data, null, 2);
}

export function exportAsCSV(queries: ParsedQuery[]): string {
  const header = 'timestamp,duration_ms,query';
  const rows = queries.map((q) => {
    const ts = q.timestamp ?? '';
    const dur = q.duration?.toFixed(3) ?? '';
    const sql = `"${q.query.replace(/"/g, '""').replace(/\n/g, ' ')}"`;
    return `${ts},${dur},${sql}`;
  });
  return [header, ...rows].join('\n');
}

export function exportQueries(queries: ParsedQuery[], options: ExportOptions): void {
  let content: string;

  switch (options.format) {
    case 'sql':
      content = exportAsSQL(queries);
      break;
    case 'json':
      content = exportAsJSON(queries, options.includeMetadata ?? true);
      break;
    case 'csv':
      content = exportAsCSV(queries);
      break;
    default:
      throw new Error(`Unsupported export format: ${options.format}`);
  }

  const dir = path.dirname(options.outputPath);
  if (dir && dir !== '.') {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(options.outputPath, content, 'utf-8');
}
