import * as fs from 'fs';
import * as readline from 'readline';

export interface ParsedQuery {
  timestamp: Date;
  duration: number; // milliseconds
  query: string;
  user?: string;
  database?: string;
  pid?: number;
}

// Matches PostgreSQL log lines like:
// 2024-01-15 12:34:56.789 UTC [1234] user@db LOG:  duration: 12.345 ms  statement: SELECT ...
const LOG_LINE_REGEX =
  /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d+)[^\[]*\[(\d+)\]\s*(\w+)@(\w+)\s+LOG:\s+duration:\s+([\d.]+)\s+ms\s+statement:\s+(.+)$/;

export async function parseLogFile(filePath: string): Promise<ParsedQuery[]> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Log file not found: ${filePath}`);
  }

  const results: ParsedQuery[] = [];
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  for await (const line of rl) {
    const parsed = parseLine(line);
    if (parsed) {
      results.push(parsed);
    }
  }

  return results;
}

export function parseLine(line: string): ParsedQuery | null {
  const match = line.match(LOG_LINE_REGEX);
  if (!match) return null;

  const [, timestampStr, pidStr, user, database, durationStr, query] = match;

  return {
    timestamp: new Date(timestampStr),
    duration: parseFloat(durationStr),
    query: query.trim(),
    user,
    database,
    pid: parseInt(pidStr, 10),
  };
}
