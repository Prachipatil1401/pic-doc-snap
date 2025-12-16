<#
Start the camera server in mock mode (PowerShell)
Run this on Windows or use via PowerShell on the Pi if available.
#>

param()

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

$env:MOCK_MODE = 'true'
$env:PORT = $env:PORT -or '3001'

Write-Host "Starting camera server in MOCK_MODE on port $($env:PORT)..."
node camera-server.js
