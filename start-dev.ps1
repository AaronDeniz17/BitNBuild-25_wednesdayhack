# GigCampus Development Environment Startup Script

Write-Host "Starting GigCampus Development Environment..." -ForegroundColor Green
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Cyan
} catch {
    Write-Host "ERROR: Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Get script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Check if server directory exists
$serverDir = Join-Path $scriptDir "server"
$clientDir = Join-Path $scriptDir "client"

if (-not (Test-Path $serverDir)) {
    Write-Host "ERROR: Server directory not found at $serverDir" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

if (-not (Test-Path $clientDir)) {
    Write-Host "ERROR: Client directory not found at $clientDir" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Function to check if port is in use
function Test-Port {
    param([int]$Port)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $true
    } catch {
        return $false
    }
}

# Check if ports are available
if (Test-Port 5000) {
    Write-Host "WARNING: Port 5000 is already in use. Backend server might already be running." -ForegroundColor Yellow
}

if (Test-Port 3000) {
    Write-Host "WARNING: Port 3000 is already in use. Frontend client might already be running." -ForegroundColor Yellow
}

Write-Host ""

# Start backend server
Write-Host "Starting backend server..." -ForegroundColor Green
$backendProcess = Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "cd /d `"$serverDir`" && npm start" -WindowStyle Normal -PassThru

# Wait for server to start
Write-Host "Waiting for backend server to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Test if backend is responding
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/health" -TimeoutSec 5
    Write-Host "✓ Backend server is running and responding" -ForegroundColor Green
} catch {
    Write-Host "⚠ Backend server may still be starting up..." -ForegroundColor Yellow
}

# Start frontend client
Write-Host "Starting frontend client..." -ForegroundColor Green
$frontendProcess = Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "cd /d `"$clientDir`" && npm run dev" -WindowStyle Normal -PassThru

Write-Host ""
Write-Host "Development environment started!" -ForegroundColor Green
Write-Host "Backend:  http://localhost:5000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Health:   http://localhost:5000/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "Both servers are running in separate windows." -ForegroundColor Yellow
Write-Host "Close those windows to stop the servers." -ForegroundColor Yellow
Write-Host ""
Read-Host "Press Enter to close this window"
