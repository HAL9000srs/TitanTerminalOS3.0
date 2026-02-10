# Start n8n Only
# Use this since Cloudflare Tunnel is running as a service

$env:N8N_WEBHOOK_URL = "https://n8n.titanterminalos.cc/"
$env:WEBHOOK_URL = "https://n8n.titanterminalos.cc/"

npx n8n start
