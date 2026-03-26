# Deploy from Windows to VPS (Ubuntu + Node + PM2).
# Run from project root in PowerShell:
#   cd "C:\path\to\project"
#   powershell -ExecutionPolicy Bypass -File .\deploy\deploy-from-windows.ps1
#
# You may need to enter the SSH password twice (scp, then ssh).

param(
  [string]$Server = "138.124.90.218",
  [string]$User = "root",
  [string]$RemotePath = "/var/www/business-card-site"
)

$ErrorActionPreference = "Stop"
$archive = $null

$ProjectRoot = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path (Join-Path $ProjectRoot "package.json"))) {
  Write-Error "package.json not found. Run this script from the project folder (it must contain deploy/)."
}

Write-Host "Project: $ProjectRoot"
Write-Host "Server:  ${User}@${Server}"
Write-Host "Path:    $RemotePath"
Write-Host ""

if (-not (Get-Command ssh -ErrorAction SilentlyContinue)) {
  Write-Error "OpenSSH Client not found. Install: Windows Settings - Apps - Optional features - OpenSSH Client."
}
if (-not (Get-Command tar -ErrorAction SilentlyContinue)) {
  Write-Error "tar not found. It is included in Windows 10/11."
}

# data — БД на VPS; не копировать, иначе при деплое затираются клиенты в продакшене.
$exclude = @("node_modules", ".next", ".git", "data")
$staging = Join-Path $env:TEMP ("truweb-staging-" + [Guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $staging | Out-Null

try {
  Get-ChildItem -Path $ProjectRoot -Force | Where-Object { $exclude -notcontains $_.Name } | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination (Join-Path $staging $_.Name) -Recurse -Force
  }

  $archive = Join-Path $env:TEMP ("truweb-" + [Guid]::NewGuid().ToString("N") + ".tar.gz")
  Push-Location $staging
  tar -czf $archive .
  Pop-Location

  $remoteArchive = "/tmp/truweb-deploy.tar.gz"
  Write-Host ">>> 1/2 Upload archive (enter SSH password if asked)..."
  scp -o StrictHostKeyChecking=accept-new $archive "${User}@${Server}:${remoteArchive}"
  if ($LASTEXITCODE -ne 0) { throw "scp failed." }

  Write-Host ">>> 2/2 Extract and build on server (password again if asked)..."
  $cmd = @"
set -e
mkdir -p '$RemotePath'
cd '$RemotePath'
tar -xzf '$remoteArchive'
rm -f '$remoteArchive'
chmod +x deploy/server-build.sh 2>/dev/null || true
bash deploy/server-build.sh
"@
  $cmd | ssh -o StrictHostKeyChecking=accept-new "${User}@${Server}" "bash -s"
  if ($LASTEXITCODE -ne 0) { throw "ssh or remote build failed." }

  Write-Host ""
  Write-Host "Done. Open: http://$Server/ and http://$Server/about"
} finally {
  Remove-Item -Recurse -Force $staging -ErrorAction SilentlyContinue
  if ($archive) { Remove-Item -Force $archive -ErrorAction SilentlyContinue }
}
