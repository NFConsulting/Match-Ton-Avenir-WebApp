# Load Testing (k6)

This folder contains k6 scripts for image generation performance testing.

## Prerequisite

Install `k6` and make sure `k6` is available in your PATH.

## Pacing policy

- All npm `perf:*` k6 commands are now paced with `INTERVAL_SECONDS=0.1` (1 call every 100ms).
- Commands using fixed call counts (`:10`, `:50`, `:100`, `:200`) keep the same `TOTAL_CALLS`, but are no longer burst mode.
- New duplicated commands are available for a long run at 1 call every 500ms during 10 minutes (`TOTAL_CALLS=1200`, `INTERVAL_SECONDS=0.5`).

## Commands

Core aliases:

- `npm run perf:dalle` (alias of `perf:dalle:10`)
- `npm run perf:google` (alias of `perf:google:10`)
- `npm run perf:careers` (alias of `perf:careers:10`)
- `npm run perf:google:careers` (alias of `perf:google:careers:10`)
- `npm run perf:urls` (alias of `perf:urls:10`)

Fixed-count suites (paced at 100ms):

- `npm run perf:dalle:10`
- `npm run perf:dalle:50`
- `npm run perf:dalle:100`
- `npm run perf:google:10`
- `npm run perf:google:50`
- `npm run perf:google:100`
- `npm run perf:careers:10`
- `npm run perf:careers:50`
- `npm run perf:careers:50:burst` (legacy alias)
- `npm run perf:careers:100`
- `npm run perf:careers:200`
- `npm run perf:google:careers:10`
- `npm run perf:google:careers:50`
- `npm run perf:google:careers:50:burst` (legacy alias)
- `npm run perf:google:careers:100`
- `npm run perf:google:careers:200`
- `npm run perf:urls:10`
- `npm run perf:urls:50`
- `npm run perf:urls:100`

Other 100ms commands:

- `npm run perf:100`
- `npm run perf:100:dalle`
- `npm run perf:100:google`
- `npm run perf:100:careers`
- `npm run perf:100:google:careers`
- `npm run perf:dalle:live`
- `npm run perf:google:live`
- `npm run perf:careers:live`
- `npm run perf:google:careers:live`
- `npm run perf:urls:live`

New duplicated 500ms / 10m commands:

- `npm run perf:dalle:500ms:10m`
- `npm run perf:google:500ms:10m`
- `npm run perf:careers:500ms:10m`
- `npm run perf:google:careers:500ms:10m`
- `npm run perf:urls:500ms:10m`

Progressive commands:

- `npm run perf:progressive:dalle`
- `npm run perf:progressive:google`
- `npm run perf:progressive:urls`
- `npm run perf:progressive`
- `npm run perf:progressive:dalle:500ms:10m`
- `npm run perf:progressive:google:500ms:10m`
- `npm run perf:progressive:urls:500ms:10m`
- `npm run perf:progressive:500ms:10m`

## Optional environment variables

- `API_BASE_URL` default: `https://matchtonavenir-api-bxd2h0dnd3h9d2de.francecentral-01.azurewebsites.net/api`
- `MODE` values: `both` (default), `dalle`, `google`, `careers`, `google_careers`, `urls`
- `DALL_E_RATIO` default: `0.5` (used only when `MODE=both`)
- `TOTAL_CALLS` default: `0` (if `>0`, run exactly this number of requests)
- `CONCURRENCY` default: `1` (used with `TOTAL_CALLS`)
- `MAX_DURATION` default: `30m` (used with `TOTAL_CALLS`)
- `INTERVAL_SECONDS` default: `0` (if `>0` with `TOTAL_CALLS`, starts one request every N seconds)
- `HTTP_TIMEOUT` default: `120s` (applied to all HTTP calls in the k6 script)
- `URLS_LIMIT` default: `12` (used when `MODE=urls`)
- `URLS_AFTER_ID` default: `0` (used when `MODE=urls`)
- `URLS_INCLUDE_URL` default: `true` (used when `MODE=urls`)
- `URLS_WALK_CURSOR` default: `false` (if enabled, follows `nextAfterId` page by page per VU)
- `LIVE_LOG` default: enabled
- `LIVE_LOG` values: set `0|false|no|off` to disable live call/response lines
- `LIVE_LOG_BODY_CHARS` default: `220` chars for response body preview

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

Progressive runs use fixed-call pacing and execute the configured concurrency steps (default: `10`, `50`, `100`).

## Reports and metrics

Manual scripts write to:

- `tests/perf/reports/manual/*-summary.json`
- `tests/perf/reports/manual/*-raw.json`
- `tests/perf/reports/manual/*-console.log`

Progressive scripts write to:

- `tests/perf/reports/<mode>/<timestamp>/summary-concurrency10.json`
- `tests/perf/reports/<mode>/<timestamp>/summary-concurrency50.json`
- `tests/perf/reports/<mode>/<timestamp>/summary-concurrency100.json`
- `tests/perf/reports/<mode>/<timestamp>/raw-concurrency*.json`
- `tests/perf/reports/<mode>/<timestamp>/console-concurrency*.log`
- `tests/perf/reports/<mode>/<timestamp>/summary-table.csv`
- `tests/perf/reports/<mode>/<timestamp>/summary.md`

Quick pointer to latest progressive run:

- `tests/perf/reports/latest-dalle.txt`
- `tests/perf/reports/latest-google.txt`

Tracked metrics include:

- request count and request rate
- failure rate (`http_req_failed`)
- checks success rate (`checks`)
- API success rate (`api_success`)
- response body contains payload rate (`api_has_url`)
- items returned per call (`api_items_count`)
- response payload size (`api_response_bytes`)
- latency: `avg`, `p90`, `p95`, `max`

## Examples

```powershell
k6 run -e MODE=google -e TOTAL_CALLS=1200 -e INTERVAL_SECONDS=0.1 -e CONCURRENCY=20 tests/perf/load-100.js
```

```powershell
k6 run -e MODE=careers -e TOTAL_CALLS=1200 -e INTERVAL_SECONDS=0.5 -e CONCURRENCY=20 tests/perf/load-100.js
```
