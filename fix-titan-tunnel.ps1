# fix-titan-tunnel.ps1
# This script repairs the Cloudflare Tunnel by creating a new one and routing both app and n8n.

$ErrorActionPreference = "Stop"

$cloudflaredDir = "$env:USERPROFILE\.cloudflared"
if (-not (Test-Path $cloudflaredDir)) {
    New-Item -ItemType Directory -Path $cloudflaredDir | Out-Null
}

# 1. Backup
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupDir = "$env:USERPROFILE\.cloudflared_backup_$timestamp"
Write-Host "Backing up existing configuration to $backupDir..." -ForegroundColor Cyan
if (Test-Path $cloudflaredDir) {
    Copy-Item -Path $cloudflaredDir -Destination $backupDir -Recurse
}

# 2. Login
Write-Host "`nWARNING: A browser window will open. Please log in to Cloudflare and select the 'titanterminalos.cc' domain." -ForegroundColor Yellow
Write-Host "Press any key to continue to login..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

cloudflared tunnel login

# 3. Create new tunnel
$tunnelName = "titan-terminal-fixed-$timestamp"
Write-Host "`nCreating new tunnel: $tunnelName..." -ForegroundColor Cyan
cloudflared tunnel create $tunnelName

# 4. Find new credentials
$newCredFile = Get-ChildItem -Path $cloudflaredDir -Filter "*.json" | Sort-Object LastWriteTime -Descending | Select-Object -First 1

if (-not $newCredFile) {
    Write-Error "Could not find the new tunnel credentials file!"
}

try {
    $jsonContent = Get-Content -Path $newCredFile.FullName | ConvertFrom-Json
    $tunnelId = $jsonContent.TunnelID
}
catch {
    Write-Error "Failed to parse credentials file: $($newCredFile.FullName)"
}

Write-Host "New Tunnel ID: $tunnelId" -ForegroundColor Green

# 5. Update config.yml
$configPath = "$cloudflaredDir\config.yml"
$configContent = @"
tunnel: $tunnelId
credentials-file: $($newCredFile.FullName)

ingress:
  - hostname: app.titanterminalos.cc
    service: http://localhost:3002
  - hostname: n8n.titanterminalos.cc
    service: http://localhost:5678
    originRequest:
      noTLSVerify: true
  - service: http_status:404
"@

Write-Host "Updating $configPath..." -ForegroundColor Cyan
Set-Content -Path $configPath -Value $configContent

# 6. Route DNS
Write-Host "Routing DNS for app.titanterminalos.cc..." -ForegroundColor Cyan
try {
    cloudflared tunnel route dns -f $tunnelName app.titanterminalos.cc
}
catch {
    Write-Warning "Failed to route DNS for app.titanterminalos.cc"
}

Write-Host "Routing DNS for n8n.titanterminalos.cc..." -ForegroundColor Cyan
try {
    cloudflared tunnel route dns -f $tunnelName n8n.titanterminalos.cc
}
catch {
    Write-Warning "Failed to route DNS for n8n.titanterminalos.cc"
}

Write-Host "`n--------------------------------------------------" -ForegroundColor Green
Write-Host "Repair Complete!" -ForegroundColor Green
Write-Host "You can now run 'start-n8n-tunnel.ps1' to start the tunnel." -ForegroundColor Green
Write-Host "--------------------------------------------------" -ForegroundColor Green
