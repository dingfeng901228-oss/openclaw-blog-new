# Setup pre-push hook for my-blog (Windows)
# Usage: powershell -File tools/hooks/setup.ps1

$ErrorActionPreference = 'Stop'

$hooksDir = '.git/hooks'
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$source = Join-Path $scriptDir 'pre-push.js'
$target = Join-Path $hooksDir 'pre-push'

if (-not (Test-Path $source)) {
  Write-Error "ERROR: $source not found"
  exit 1
}

if (-not (Test-Path $hooksDir)) {
  New-Item -ItemType Directory -Force -Path $hooksDir | Out-Null
}

Copy-Item -Path $source -Destination $target -Force

Write-Host "Installed pre-push hook at $target"
Write-Host "Test it with:"
Write-Host "  echo 'refs/heads/master HEAD refs/heads/master HEAD~1' | node $target new-origin https://test"
