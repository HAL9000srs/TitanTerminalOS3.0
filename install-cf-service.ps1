# install-cf-service.ps1
# RUN AS ADMINISTRATOR

$ErrorActionPreference = "Stop"

# Check for Admin privileges
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]"Administrator")) {
    Write-Error "Please run this script as Administrator (Right-click > Run with PowerShell as Administrator)"
    Exit 1
}

Write-Host "Installing Cloudflare Tunnel Service..." -ForegroundColor Cyan

# Define paths
# source is hardcoded to ensure we get the correct user's config even if running as a different admin user
$sourceDir = "C:\Users\malco\.cloudflared"
$destDir = "C:\Windows\System32\config\systemprofile\.cloudflared"

# Create system profile directory
if (-not (Test-Path $destDir)) {
    New-Item -ItemType Directory -Path $destDir -Force | Out-Null
    Write-Host "Created system profile directory."
}

# Copy configuration and credentials
Write-Host "Copying configuration from $sourceDir..."
Copy-Item -Path "$sourceDir\*" -Destination $destDir -Force -Recurse

# Stop and remove existing service if present
Write-Host "Cleaning up existing service..."
try {
    Stop-Service cloudflared -ErrorAction SilentlyContinue
    cloudflared service uninstall 2>$null
}
catch {
    # Ignore errors if service doesn't exist
}

# Install and Start
Write-Host "Installing service..."
cloudflared service install
if ($LASTEXITCODE -ne 0) {
    Write-Warning "Service install command returned error. It might already be installed."
}

Write-Host "Starting service..."
Start-Service cloudflared
Get-Service cloudflared

Write-Host "Cloudflare Service Installed Successfully!" -ForegroundColor Green
