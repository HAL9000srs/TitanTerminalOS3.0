# add-n8n-startup.ps1
# Adds a shortcut to the User Startup folder to launch n8n on login

$WshShell = New-Object -comObject WScript.Shell
$StartupDir = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup"
$ShortcutPath = "$StartupDir\Start n8n.lnk"
$TargetScript = "C:\Users\malco\HAL9000ai\TitanTerminalOS3.0\start-n8n.ps1"

# Create Shortcut
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = "powershell.exe"
# Run hidden and bypass execution policy
$Shortcut.Arguments = "-WindowStyle Hidden -ExecutionPolicy Bypass -File `"$TargetScript`""
$Shortcut.WorkingDirectory = "C:\Users\malco\HAL9000ai\TitanTerminalOS3.0"
$Shortcut.IconLocation = "powershell.exe,0"
$Shortcut.Description = "Starts n8n for Titan Terminal"
$Shortcut.Save()

Write-Host "Shortcut created at: $ShortcutPath" -ForegroundColor Green
Write-Host "n8n will now start automatically when you log in."
