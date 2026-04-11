# Build a .tar.gz on your PC (no SSH). Upload the printed file with WinSCP, then run commands on the server.
# Run in PowerShell from ANY folder:
#   powershell -ExecutionPolicy Bypass -File "C:\Users\...\сайт визитка\deploy\pack-for-upload.ps1"

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path (Join-Path $ProjectRoot "package.json"))) {
  Write-Error "package.json not found next to deploy/ folder."
}
if (-not (Get-Command tar -ErrorAction SilentlyContinue)) {
  Write-Error "tar not found."
}

# data — БД на VPS; не класть в архив, чтобы не затереть продакшен при распаковке.
$exclude = @("node_modules", ".next", ".git", "data")
$staging = Join-Path $env:TEMP ("truweb-staging-" + [Guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $staging | Out-Null

try {
  Get-ChildItem -Path $ProjectRoot -Force | Where-Object { $exclude -notcontains $_.Name } | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination (Join-Path $staging $_.Name) -Recurse -Force
  }
  $out = Join-Path ([Environment]::GetFolderPath("Desktop")) ("truweb-deploy-" + (Get-Date -Format "yyyyMMdd-HHmm") + ".tar.gz")
  Push-Location $staging
  tar -czf $out .
  Pop-Location
  Write-Host ""
  Write-Host "OK. Archive path:"
  Write-Host $out
  Write-Host ""
  Write-Host "Next: WinSCP -> upload this file to server /tmp/truweb-deploy.tar.gz"
  Write-Host "Then SSH and run the commands from deploy/WINSCP-STEPS.txt"
} finally {
  Remove-Item -Recurse -Force $staging -ErrorAction SilentlyContinue
}
