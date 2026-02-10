# install-n8n-task.ps1
# Creates a Scheduled Task to start n8n on user login

$taskName = "Startn8n"
$n8nCommand = "npx"
$n8nArgs = "n8n start"
$workingDir = "C:\Users\malco\HAL9000ai\TitanTerminalOS3.0"

# Unregister if exists
Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue

# Create Action
# We use a hidden powershell window to run it to avoid popping up a console
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-WindowStyle Hidden -Command cd '$workingDir'; $n8nCommand $n8nArgs"

# Create Trigger
$trigger = New-ScheduledTaskTrigger -AtLogon

# Register
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Description "Starts n8n for Titan Terminal"

Write-Host "Scheduled Task '$taskName' created successfully!" -ForegroundColor Green
Write-Host "It will run automatically next time you log in."
Write-Host "Starting it now..."

Start-ScheduledTask -TaskName $taskName
