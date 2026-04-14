# DNS + HTTPS smoke test (apex vs www). Run from repo root:
#   powershell -NoProfile -File deploy/dns-smoke-check.ps1

$ErrorActionPreference = "Continue"
$domain = "truewebwork.ru"
$www = "www.truewebwork.ru"
$resolvers = @("8.8.8.8", "77.88.8.8", "1.1.1.1")

Write-Host "=== nslookup $domain / $www ===" -ForegroundColor Cyan
foreach ($r in $resolvers) {
    Write-Host "`n--- resolver $r ---" -ForegroundColor Yellow
    nslookup $domain $r 2>$null
    nslookup $www $r 2>$null
}

Write-Host "`n=== curl HTTPS (expect apex 301 -> www, www 200) ===" -ForegroundColor Cyan
& curl.exe -sI --max-time 20 "https://$domain/"
& curl.exe -sI --max-time 20 "https://$www/"

Write-Host "`nDone." -ForegroundColor Green
