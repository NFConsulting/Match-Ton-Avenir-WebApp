# Load Testing (k6)

This folder contains k6 scripts for image generation performance testing.

## Prerequisite

Install `k6` and make sure `k6` is available in your PATH.

## Commands

- `npm run perf:100`
- `npm run perf:100:dalle`
- `npm run perf:100:google`
- `npm run perf:dalle` (alias of `perf:dalle:10`)
- `npm run perf:google` (alias of `perf:google:10`)
- `npm run perf:urls` (alias of `perf:urls:10`)
- `npm run perf:dalle:10`
- `npm run perf:dalle:50`
- `npm run perf:dalle:100`
- `npm run perf:google:10`
- `npm run perf:google:50`
- `npm run perf:google:100`
- `npm run perf:urls:10`
- `npm run perf:urls:50`
- `npm run perf:urls:100`
- `npm run perf:dalle:live` (1 user, live request/response logs)
- `npm run perf:google:live` (1 user, live request/response logs)
- `npm run perf:urls:live` (10 calls, 1/s, live logs)
- `npm run perf:progressive:dalle`
- `npm run perf:progressive:google`
- `npm run perf:progressive:urls`
- `npm run perf:progressive`

## Optional environment variables

- `API_BASE_URL` default: `https://matchtonavenir-api-bxd2h0dnd3h9d2de.francecentral-01.azurewebsites.net/api`
- `VUS` default: `100`
- `DURATION` default: `2m`
- `MODE` values: `both` (default), `dalle`, `google`, `urls`
- `DALL_E_RATIO` default: `0.5` (used only when `MODE=both`)
- `THINK_TIME` default: `0.3` seconds
- `TOTAL_CALLS` default: `0` (if `>0`, run exactly this number of requests)
- `CONCURRENCY` default: `1` (used with `TOTAL_CALLS`)
- `MAX_DURATION` default: `30m` (used with `TOTAL_CALLS`)
- `INTERVAL_SECONDS` default: `0` (if `>0` with `TOTAL_CALLS`, starts one request every N seconds)
- `URLS_LIMIT` default: `12` (used when `MODE=urls`)
- `URLS_AFTER_ID` default: `0` (used when `MODE=urls`)
- `URLS_INCLUDE_URL` default: `true` (used when `MODE=urls`)
- `URLS_WALK_CURSOR` default: `false` (if enabled, follows `nextAfterId` page by page per VU)
- `LIVE_LOG` default: enabled
- `LIVE_LOG` values: set `0|false|no|off` to disable live call/response lines
- `LIVE_LOG_BODY_CHARS` default: `220` chars for response body preview

## Manual workflow requested

Run each step manually, in this order:

1. `npm run perf:dalle:10`
2. `npm run perf:dalle:50`
3. `npm run perf:dalle:100`
4. `npm run perf:google:10`
5. `npm run perf:google:50`
6. `npm run perf:google:100`

Behavior of these manual commands:

- exact number of backend calls (`10`, `50`, `100`)
- one request started every second (`INTERVAL_SECONDS=1`)
- calls can overlap when response time is longer than 1s
- unlike arrival-rate mode, total completed calls are fixed (`http_reqs.count` = target)

Generated files:

- `tests/perf/reports/manual/dalle-10-summary.json`
- `tests/perf/reports/manual/dalle-10-raw.json`
- `tests/perf/reports/manual/dalle-50-summary.json`
- `tests/perf/reports/manual/dalle-50-raw.json`
- `tests/perf/reports/manual/dalle-100-summary.json`
- `tests/perf/reports/manual/dalle-100-raw.json`
- `tests/perf/reports/manual/google-10-summary.json`
- `tests/perf/reports/manual/google-10-raw.json`
- `tests/perf/reports/manual/google-50-summary.json`
- `tests/perf/reports/manual/google-50-raw.json`
- `tests/perf/reports/manual/google-100-summary.json`
- `tests/perf/reports/manual/google-100-raw.json`
- `tests/perf/reports/manual/urls-10-summary.json`
- `tests/perf/reports/manual/urls-10-raw.json`
- `tests/perf/reports/manual/urls-50-summary.json`
- `tests/perf/reports/manual/urls-50-raw.json`
- `tests/perf/reports/manual/urls-100-summary.json`
- `tests/perf/reports/manual/urls-100-raw.json`

Report format:

- `*-summary.json`: aggregated metrics (count, rate, p90, p95, etc.)
- `*-raw.json`: detailed event timeline for deeper analysis

During run:

- live output appears directly in terminal by default
- you can disable live logs with `LIVE_LOG=0`
- regular k6 progress/summary always appears in terminal

## Progressive workflow (optional)

Run DALL-E first:

```powershell
npm run perf:progressive:dalle
```

Then run Google:

```powershell
npm run perf:progressive:google
```

Or run both sequentially:

```powershell
npm run perf:progressive
```

Each progressive run executes 3 load levels automatically: `10`, `50`, `100` VUs.

## Reports and metrics

Reports are written to:

- `tests/perf/reports/<mode>/<timestamp>/summary-vus10.json`
- `tests/perf/reports/<mode>/<timestamp>/summary-vus50.json`
- `tests/perf/reports/<mode>/<timestamp>/summary-vus100.json`
- `tests/perf/reports/<mode>/<timestamp>/raw-vus*.json`
- `tests/perf/reports/<mode>/<timestamp>/console-vus*.log`
- `tests/perf/reports/<mode>/<timestamp>/summary-table.csv`
- `tests/perf/reports/<mode>/<timestamp>/summary.md`

Quick pointer to the latest run:

- `tests/perf/reports/latest-dalle.txt`
- `tests/perf/reports/latest-google.txt`

Tracked metrics include:

- request count and request rate
- failure rate (`http_req_failed`)
- checks success rate (`checks`)
- API success rate (`api_success`)
- response body contains image URL rate (`api_has_url`)
- items returned per call (`api_items_count`)
- response payload size (`api_response_bytes`)
- latency: `avg`, `p90`, `p95`, `max`

## Examples

```powershell
k6 run -e API_BASE_URL=https://your-api.example.com/api -e VUS=100 -e DURATION=1m tests/perf/load-100.js
```

```powershell
k6 run -e MODE=google -e VUS=100 -e DURATION=3m tests/perf/load-100.js
```
