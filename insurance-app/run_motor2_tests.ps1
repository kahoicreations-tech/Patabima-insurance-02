#!/usr/bin/env pwsh
# Motor2 Test Runner Script
# Runs comprehensive Motor2 integration tests

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "    Motor2 Integration Test Suite" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the insurance-app directory
if (-not (Test-Path "manage.py")) {
    Write-Host "Error: This script must be run from the insurance-app directory" -ForegroundColor Red
    Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow
    Write-Host "Please cd to insurance-app and try again" -ForegroundColor Yellow
    exit 1
}

Write-Host "Running Motor2 Integration Tests..." -ForegroundColor Green
Write-Host ""

# Run the tests with verbose output
python manage.py test app.tests.test_motor2_integration -v 2

$exitCode = $LASTEXITCODE

Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan

if ($exitCode -eq 0) {
    Write-Host "✓ All tests passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Test Coverage:" -ForegroundColor Cyan
    Write-Host "  ✓ Category/Subcategory Endpoints" -ForegroundColor White
    Write-Host "  ✓ Field Requirements" -ForegroundColor White
    Write-Host "  ✓ Underwriter Comparison (Third Party & Comprehensive)" -ForegroundColor White
    Write-Host "  ✓ Policy Creation (Success Flow)" -ForegroundColor White
    Write-Host "  ✓ Duplicate Policy Guard (409 Response)" -ForegroundColor White
    Write-Host "  ✓ forceCreate Override" -ForegroundColor White
    Write-Host "  ✓ DMVIC Double-Insurance Check (409 Response)" -ForegroundColor White
    Write-Host "  ✓ allowProceed Override" -ForegroundColor White
    Write-Host "  ✓ Policy Listing & Filtering" -ForegroundColor White
    Write-Host "  ✓ Single Policy Retrieval" -ForegroundColor White
    Write-Host "  ✓ Extendible Product Configuration" -ForegroundColor White
    Write-Host "  ✓ DMVIC Certificate PDF Download" -ForegroundColor White
}
else {
    Write-Host "✗ Some tests failed" -ForegroundColor Red
    Write-Host "Please review the output above for details" -ForegroundColor Yellow
}

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

exit $exitCode
