#!/usr/bin/env node
import { Command } from 'commander';
import * as fs from 'fs';
import { parseLine } from '../parser/logParser';
import { filterQueries } from '../parser/index';
import { analyzeCosts } from '../cost/index';
import { formatOutput } from '../formatter/outputFormatter';
import { ParsedQuery } from '../parser/logParser';

const program = new Command();

program
  .name('pgrewind')
  .description('Replay and inspect PostgreSQL query history from logs')
  .version('0.1.0');

program
  .command('analyze <logfile>')
  .description('Analyze a PostgreSQL log file')
  .option('-f, --format <format>', 'Output format: table, csv, json', 'table')
  .option('-u, --user <user>', 'Filter by username')
  .option('-d, --database <database>', 'Filter by database name')
  .option('--min-duration <ms>', 'Filter queries with duration >= ms', parseFloat)
  .option('--limit <n>', 'Limit number of results', parseInt)
  .action((logfile: string, options) => {
    if (!fs.existsSync(logfile)) {
      console.error(`Error: File not found: ${logfile}`);
      process.exit(1);
    }

    const lines = fs.readFileSync(logfile, 'utf-8').split('\n');
    const queries: ParsedQuery[] = lines
      .map(parseLine)
      .filter((q): q is ParsedQuery => q !== null);

    const filtered = filterQueries(queries, {
      user: options.user,
      database: options.database,
      minDuration: options.minDuration,
    });

    const limited = options.limit ? filtered.slice(0, options.limit) : filtered;
    const costAnalysis = analyzeCosts(limited);
    const output = formatOutput(limited, options.format as 'table' | 'csv' | 'json');

    console.log(output);
    console.log(`\n--- Summary ---`);
    console.log(`Total queries: ${costAnalysis.totalQueries}`);
    console.log(`Estimated total cost: ${costAnalysis.totalCost.toFixed(2)}`);
    console.log(`Average cost: ${costAnalysis.averageCost.toFixed(4)}`);
  });

program.parse(process.argv);

export { program };
