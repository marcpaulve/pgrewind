import { ParsedQuery } from '../parser/logParser';
import { ExportFormat, ExportOptions, exportQueries } from './queryExporter';

export { exportAsSQL, exportAsJSON, exportAsCSV, exportQueries } from './queryExporter';
export type { ExportFormat, ExportOptions } from './queryExporter';

export interface ExportSummary {
  format: ExportFormat;
  outputPath: string;
  queryCount: number;
  success: boolean;
  error?: string;
}

export function runExport(
  queries: ParsedQuery[],
  options: ExportOptions
): ExportSummary {
  if (queries.length === 0) {
    return {
      format: options.format,
      outputPath: options.outputPath,
      queryCount: 0,
      success: false,
      error: 'No queries to export',
    };
  }

  try {
    exportQueries(queries, options);
    return {
      format: options.format,
      outputPath: options.outputPath,
      queryCount: queries.length,
      success: true,
    };
  } catch (err) {
    return {
      format: options.format,
      outputPath: options.outputPath,
      queryCount: 0,
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
