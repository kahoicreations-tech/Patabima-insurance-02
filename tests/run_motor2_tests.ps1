# Motor 2 Flow Integration Test Runner
# PowerShell script for Windows

param(
    [string]$BackendUrl = "http://localhost:8000",
    [string]$TestUser = "testagent@patabima.com",
    [switch]$Help
)

if ($Help) {
    Write-Host @"
Motor 2 Flow Integration Test Runner
=====================================

Usage:
    .\run_motor2_tests.ps1 [-BackendUrl <url>] [-TestUser <email>]

Parameters:
    -BackendUrl    Backend server URL (default: http://localhost:8000)
    -TestUser      Test agent username (default: testagent@patabima.com)
    -Help          Show this help message

Examples:
    .\run_motor2_tests.ps1
    .\run_motor2_tests.ps1 -BackendUrl "http://192.168.1.100:8000"
    .\run_motor2_tests.ps1 -TestUser "myagent@patabima.com"

"@
    exit 0
}

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "           Motor 2 Flow Integration Test Runner                      " -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Python is installed
Write-Host "[1/5] Checking Python installation..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "      ✓ Python found: $pythonVersion" -ForegroundColor Green
}
catch {
    Write-Host "      ✗ Python not found. Please install Python 3.8+" -ForegroundColor Red
    exit 1
}

# Check if requests library is installed
Write-Host "[2/5] Checking required Python packages..." -ForegroundColor Yellow
$requestsCheck = python -c "import requests; print('OK')" 2>&1
if ($requestsCheck -ne "OK") {
    Write-Host "      ⚠ 'requests' library not found. Installing..." -ForegroundColor Yellow
    pip install requests
}
else {
    Write-Host "      ✓ Required packages installed" -ForegroundColor Green
}

# Check if backend is running
Write-Host "[3/5] Checking backend connectivity..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$BackendUrl/api/v1/motor/categories/" -Method GET -TimeoutSec 5 -ErrorAction SilentlyContinue
    Write-Host "      ✓ Backend is accessible at $BackendUrl" -ForegroundColor Green
}
catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 401) {
        Write-Host "      ✓ Backend is accessible (401 Unauthorized is expected)" -ForegroundColor Green
    }
    else {
        Write-Host "      ✗ Cannot connect to backend at $BackendUrl" -ForegroundColor Red
        Write-Host "      Please ensure Django backend is running:" -ForegroundColor Yellow
        Write-Host "        cd insurance-app" -ForegroundColor Gray
        Write-Host "        python manage.py runserver" -ForegroundColor Gray
        Write-Host ""
        $continue = Read-Host "Continue anyway? (y/n)"
        if ($continue -ne "y") {
            exit 1
        }
    }
}

# Check if test script exists
Write-Host "[4/5] Locating test script..." -ForegroundColor Yellow
$testScript = Join-Path $PSScriptRoot "motor2_flow_integration_test.py"
if (Test-Path $testScript) {
    Write-Host "      ✓ Test script found" -ForegroundColor Green
}
else {
    Write-Host "      ✗ Test script not found: $testScript" -ForegroundColor Red
    exit 1
}

# Run the test
Write-Host "[5/5] Running integration tests..." -ForegroundColor Yellow
Write-Host ""
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

# Set environment variables for the test script
$env:MOTOR2_TEST_BACKEND_URL = $BackendUrl
$env:MOTOR2_TEST_USER = $TestUser

# Execute the Python test script
python $testScript

# Capture exit code
$exitCode = $LASTEXITCODE

Write-Host ""
Write-Host "======================================================================" -ForegroundColor Cyan

if ($exitCode -eq 0) {
    Write-Host "Test execution completed successfully!" -ForegroundColor Green
}
else {
    Write-Host "Test execution completed with errors." -ForegroundColor Red
    Write-Host "Check the output above for details." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Logs and details saved in: tests/logs/" -ForegroundColor Gray
Write-Host ""

exit $exitCode
