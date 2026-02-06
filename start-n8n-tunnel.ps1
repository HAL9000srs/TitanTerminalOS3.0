# Start n8n and Cloudflare Tunnel for TitanTerminalOS
# This script starts both services with the correct configuration

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Starting TitanTerminalOS Services" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Set environment variables for n8n
$env:N8N_WEBHOOK_URL = "https://n8n.titanterminalos.cc/"
$env:WEBHOOK_URL = "https://n8n.titanterminalos.cc/"

Write-Host "[1/2] Starting n8n on port 5678..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npx n8n start"

# Wait a bit for n8n to start
Start-Sleep -Seconds 10

Write-Host "[2/2] Starting Cloudflare Tunnel..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cloudflared tunnel --config C:\Users\malco\.cloudflared\config.yml run"

Write-Host ""
Write-Host "✓ Services Started!" -ForegroundColor Green
Write-Host ""
Write-Host "n8n is accessible at:" -ForegroundColor White
Write-Host "  Local:  http://localhost:5678" -ForegroundColor Cyan
Write-Host "  Tunnel: https://n8n.titanterminalos.cc" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
