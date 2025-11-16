# Non-Motor Insurance Backend Connection Test - PowerShell Wrapper
# Usage: .\tests\test-non-motor.ps1 [-ApiUrl "http://localhost:8000"] [-AuthToken "your_token"]

param(
    [Parameter(Mandatory = $false)]
    [string]$ApiUrl = "http://localhost:8000",
    
    [Parameter(Mandatory = $false)]
    [string]$AuthToken = ""
)

Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "  NON-MOTOR INSURANCE BACKEND CONNECTION TESTS (PowerShell)" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

# Set environment variables
$env:API_BASE_URL = $ApiUrl
if ($AuthToken -ne "") {
    $env:AUTH_TOKEN = $AuthToken
    Write-Host "API Base URL:  $ApiUrl" -ForegroundColor Green
    Write-Host "Auth Token:    Provided (${AuthToken.Substring(0, [Math]::Min(20, $AuthToken.Length))}...)" -ForegroundColor Green
}
else {
    Write-Host "API Base URL:  $ApiUrl" -ForegroundColor Green
    Write-Host "Auth Token:    Not provided (testing as public)" -ForegroundColor Yellow
}
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "Node.js:       $nodeVersion" -ForegroundColor Green
}
catch {
    Write-Host "ERROR: Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Running tests..." -ForegroundColor Cyan
Write-Host ""

# Run the test script
try {
    node tests/test-non-motor-backend-connections.js
    $exitCode = $LASTEXITCODE
    
    # Clear environment variables
    Remove-Item Env:API_BASE_URL -ErrorAction SilentlyContinue
    Remove-Item Env:AUTH_TOKEN -ErrorAction SilentlyContinue
    
    exit $exitCode
}
catch {
    Write-Host ""
    Write-Host "ERROR: Failed to run test script" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    # Clear environment variables
    Remove-Item Env:API_BASE_URL -ErrorAction SilentlyContinue
    Remove-Item Env:AUTH_TOKEN -ErrorAction SilentlyContinue
    
    exit 1
}
