# pgrewind

> Replay and inspect PostgreSQL query history from logs with filtering and cost estimates.

---

## Installation

```bash
npm install -g pgrewind
```

---

## Usage

Point `pgrewind` at a PostgreSQL log file to start replaying and inspecting queries:

```bash
pgrewind --log /var/log/postgresql/postgresql.log
```

Filter by time range or query pattern:

```bash
pgrewind --log pg.log --from "2024-01-15 10:00" --to "2024-01-15 11:00" --filter "SELECT"
```

Estimate query costs against a live database:

```bash
pgrewind --log pg.log --dsn "postgres://user:pass@localhost/mydb" --cost
```

### Options

| Flag | Description |
|------|-------------|
| `--log <path>` | Path to the PostgreSQL log file |
| `--from <timestamp>` | Start of time range filter |
| `--to <timestamp>` | End of time range filter |
| `--filter <pattern>` | Filter queries by string or regex |
| `--dsn <url>` | Database connection string for cost estimates |
| `--cost` | Enable query cost estimation via `EXPLAIN` |
| `--output <format>` | Output format: `table`, `json`, `csv` (default: `table`) |

---

## Requirements

- Node.js >= 18
- PostgreSQL log format: `csvlog` or `stderr` with `log_min_duration_statement` enabled

---

## License

MIT © pgrewind contributors