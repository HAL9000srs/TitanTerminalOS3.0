# fix-service-config.ps1
# RUN AS ADMINISTRATOR

$ErrorActionPreference = "Stop"

# Check for Admin privileges
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]"Administrator")) {
    Write-Error "Please run this script as Administrator (Right-click > Run with PowerShell as Administrator)"
    Exit 1
}

Write-Host "Fixing Cloudflare Service Configuration..." -ForegroundColor Cyan

$systemDir = "C:\Windows\System32\config\systemprofile\.cloudflared"
$configPath = "$systemDir\config.yml"

if (-not (Test-Path $configPath)) {
    Write-Error "Config file not found at $configPath. Is the service installed?"
    Exit 1
}

# Find the credentials file in the system directory
$jsonFile = Get-ChildItem $systemDir -Filter "*.json" | Sort-Object LastWriteTime -Descending | Select-Object -First 1

if (-not $jsonFile) {
    Write-Error "No credentials file found in $systemDir."
    Exit 1
}

Write-Host "Found credentials file: $($jsonFile.Name)"

# Read config
$content = Get-Content $configPath -Raw

# Replace the user-path credentials file with the system-path one
# We look for "credentials-file: <path>" and replace it
if ($content -match "credentials-file: .*") {
    $newContent = $content -replace "credentials-file: .*", "credentials-file: $($jsonFile.FullName)"
    Set-Content $configPath $newContent
    Write-Host "Updated config.yml to point to system credentials path." -ForegroundColor Green
}
else {
    Write-Warning "Could not find 'credentials-file' entry in config.yml"
}

# Restart Service
Write-Host "Restarting Cloudflare Service..."
Restart-Service cloudflared
Get-Service cloudflared

Write-Host "Fix Applied! Service restarted." -ForegroundColor Green
