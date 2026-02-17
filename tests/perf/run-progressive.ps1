param(
  [ValidateSet('dalle', 'google', 'urls', 'both')]
  [string]$Mode = 'both',
  [int[]]$Steps = @(10, 50, 100),
  [string]$Duration = '2m',
  [double]$ThinkTime = 0.3,
  [string]$ApiBaseUrl = 'https://matchtonavenir-api-bxd2h0dnd3h9d2de.francecentral-01.azurewebsites.net/api'
)

$ErrorActionPreference = 'Stop'

function Get-K6MetricValue {
  param(
    [Parameter(Mandatory = $true)]$Metrics,
    [Parameter(Mandatory = $true)][string]$MetricName,
    [Parameter(Mandatory = $true)][string]$ValueName
  )

  $metricProperty = $Metrics.PSObject.Properties[$MetricName]
  if ($null -eq $metricProperty) {
    return $null
  }

  $values = $metricProperty.Value.values
  if ($null -eq $values) {
    return $null
  }

  $valueProperty = $values.PSObject.Properties[$ValueName]
  if ($null -eq $valueProperty) {
    return $null
  }

  return $valueProperty.Value
}

function Round-Value {
  param(
    $Value,
    [int]$Digits = 2
  )

  if ($null -eq $Value) {
    return $null
  }

  return [math]::Round([double]$Value, $Digits)
}

if (-not (Get-Command k6 -ErrorAction SilentlyContinue)) {
  throw "k6 is not installed or not in PATH."
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$scriptPath = Join-Path $repoRoot 'tests\perf\load-100.js'
$reportsRoot = Join-Path $repoRoot 'tests\perf\reports'
New-Item -Path $reportsRoot -ItemType Directory -Force | Out-Null

$modes = if ($Mode -eq 'both') { @('dalle', 'google') } else { @($Mode) }

foreach ($currentMode in $modes) {
  $runId = Get-Date -Format 'yyyyMMdd-HHmmss'
  $runDir = Join-Path $reportsRoot "$currentMode\$runId"
  New-Item -Path $runDir -ItemType Directory -Force | Out-Null

  Write-Host ""
  Write-Host "=== Mode: $currentMode | Run: $runId ==="

  $rows = @()

  foreach ($vus in $Steps) {
    Write-Host "Running VUS=$vus, duration=$Duration, thinkTime=$ThinkTime..."

    $summaryFile = Join-Path $runDir "summary-vus$vus.json"
    $rawFile = Join-Path $runDir "raw-vus$vus.json"
    $logFile = Join-Path $runDir "console-vus$vus.log"

    $k6Args = @(
      'run',
      '-e', "MODE=$currentMode",
      '-e', "VUS=$vus",
      '-e', "DURATION=$Duration",
      '-e', "THINK_TIME=$ThinkTime",
      '-e', "API_BASE_URL=$ApiBaseUrl",
      '--summary-export', $summaryFile,
      '--out', "json=$rawFile",
      $scriptPath
    )

    & k6 @k6Args 2>&1 | Tee-Object -FilePath $logFile
    if ($LASTEXITCODE -ne 0) {
      throw "k6 failed for mode=$currentMode vus=$vus."
    }

    $summary = Get-Content -Raw -Path $summaryFile | ConvertFrom-Json
    $metrics = $summary.metrics

    $row = [PSCustomObject]@{
      mode             = $currentMode
      vus              = $vus
      duration         = $Duration
      total_requests   = [int](Get-K6MetricValue -Metrics $metrics -MetricName 'http_reqs' -ValueName 'count')
      requests_per_sec = Round-Value -Value (Get-K6MetricValue -Metrics $metrics -MetricName 'http_reqs' -ValueName 'rate')
      failed_rate      = Round-Value -Value (Get-K6MetricValue -Metrics $metrics -MetricName 'http_req_failed' -ValueName 'rate') -Digits 4
      checks_rate      = Round-Value -Value (Get-K6MetricValue -Metrics $metrics -MetricName 'checks' -ValueName 'rate') -Digits 4
      success_rate     = Round-Value -Value (Get-K6MetricValue -Metrics $metrics -MetricName 'api_success' -ValueName 'rate') -Digits 4
      has_url_rate     = Round-Value -Value (Get-K6MetricValue -Metrics $metrics -MetricName 'api_has_url' -ValueName 'rate') -Digits 4
      avg_ms           = Round-Value -Value (Get-K6MetricValue -Metrics $metrics -MetricName 'http_req_duration' -ValueName 'avg')
      p90_ms           = Round-Value -Value (Get-K6MetricValue -Metrics $metrics -MetricName 'http_req_duration' -ValueName 'p(90)')
      p95_ms           = Round-Value -Value (Get-K6MetricValue -Metrics $metrics -MetricName 'http_req_duration' -ValueName 'p(95)')
      max_ms           = Round-Value -Value (Get-K6MetricValue -Metrics $metrics -MetricName 'http_req_duration' -ValueName 'max')
      summary_file     = $summaryFile
      raw_file         = $rawFile
      log_file         = $logFile
    }

    $rows += $row
  }

  $csvFile = Join-Path $runDir 'summary-table.csv'
  $rows | Export-Csv -Path $csvFile -NoTypeInformation -Encoding UTF8

  $markdownLines = @()
  $markdownLines += "# Progressive load report ($currentMode)"
  $markdownLines += ""
  $markdownLines += "Run directory: `$runDir`"
  $markdownLines += ""
  $markdownLines += "| VUs | Requests | Req/s | Fail rate | Checks | Success | Has URL | Avg ms | p90 ms | p95 ms | Max ms |"
  $markdownLines += "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |"

  foreach ($row in $rows) {
    $markdownLines += "| $($row.vus) | $($row.total_requests) | $($row.requests_per_sec) | $($row.failed_rate) | $($row.checks_rate) | $($row.success_rate) | $($row.has_url_rate) | $($row.avg_ms) | $($row.p90_ms) | $($row.p95_ms) | $($row.max_ms) |"
  }

  $markdownLines += ""
  $markdownLines += "## Files"
  foreach ($row in $rows) {
    $markdownLines += "- VUS $($row.vus): summary=`$($row.summary_file)` raw=`$($row.raw_file)` log=`$($row.log_file)`"
  }

  $mdFile = Join-Path $runDir 'summary.md'
  Set-Content -Path $mdFile -Value $markdownLines -Encoding UTF8

  Set-Content -Path (Join-Path $reportsRoot "latest-$currentMode.txt") -Value $runDir -Encoding UTF8

  Write-Host "Report generated:"
  Write-Host " - $csvFile"
  Write-Host " - $mdFile"
}

Write-Host ""
Write-Host "All requested progressive runs completed."
