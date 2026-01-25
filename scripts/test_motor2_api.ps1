# Test Motor 2 API Endpoints After Pricing Population
# =====================================================
# This script tests the Motor 2 API to verify pricing data is accessible
#
# Usage: .\scripts\test_motor2_api.ps1

$ErrorActionPreference = "Stop"

Write-Host "=" -ForegroundColor Cyan -NoNewline
Write-Host ("=" * 69) -ForegroundColor Cyan
Write-Host "MOTOR 2 API ENDPOINT TESTING" -ForegroundColor Cyan
Write-Host "=" -ForegroundColor Cyan -NoNewline
Write-Host ("=" * 69) -ForegroundColor Cyan
Write-Host ""

# Configuration
$BaseUrl = "http://localhost:8000"
$Headers = @{
    "Content-Type" = "application/json"
    "Accept"       = "application/json"
}

# Test 1: Get Motor Categories
Write-Host "TEST 1: Get Motor Categories" -ForegroundColor Yellow
Write-Host ("-" * 70) -ForegroundColor Gray

try {
    $Response = Invoke-RestMethod -Uri "$BaseUrl/api/motor2/categories/" -Method GET -Headers $Headers
    Write-Host "✓ Success: Retrieved $($Response.categories.Count) categories" -ForegroundColor Green
    
    foreach ($cat in $Response.categories) {
        Write-Host "  - $($cat.code): $($cat.name)" -ForegroundColor White
    }
}
catch {
    Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 2: Get Private Subcategories
Write-Host "TEST 2: Get Private Subcategories" -ForegroundColor Yellow
Write-Host ("-" * 70) -ForegroundColor Gray

try {
    $Response = Invoke-RestMethod -Uri "$BaseUrl/api/motor2/subcategories/?category=PRIVATE" -Method GET -Headers $Headers
    Write-Host "✓ Success: Retrieved $($Response.subcategories.Count) subcategories" -ForegroundColor Green
    
    foreach ($subcat in $Response.subcategories) {
        Write-Host "  - $($subcat.subcategory_code) ($($subcat.pricing_model))" -ForegroundColor White
    }
}
catch {
    Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 3: Compare Underwriters for Private Third Party
Write-Host "TEST 3: Compare Underwriters (Private Third Party)" -ForegroundColor Yellow
Write-Host ("-" * 70) -ForegroundColor Gray

try {
    $Body = @{
        subcategory_code = "PRIVATE_THIRD_PARTY"
        cover_start_date = (Get-Date).ToString("yyyy-MM-dd")
    } | ConvertTo-Json

    $Response = Invoke-RestMethod -Uri "$BaseUrl/api/motor2/pricing/compare-by-subcategory/" -Method POST -Headers $Headers -Body $Body
    Write-Host "✓ Success: Retrieved $($Response.comparisons.Count) underwriters" -ForegroundColor Green
    
    foreach ($comp in $Response.comparisons | Sort-Object { $_.result.base_premium }) {
        $premium = [int]$comp.result.base_premium
        Write-Host "  - $($comp.underwriter_name): KSh $($premium.ToString('N0'))" -ForegroundColor White
    }
}
catch {
    Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 4: Compare Underwriters for Comprehensive
Write-Host "TEST 4: Compare Underwriters (Private Comprehensive)" -ForegroundColor Yellow
Write-Host ("-" * 70) -ForegroundColor Gray

try {
    $Body = @{
        subcategory_code = "PRIVATE_COMPREHENSIVE"
        cover_start_date = (Get-Date).ToString("yyyy-MM-dd")
        sum_insured      = 1000000
    } | ConvertTo-Json

    $Response = Invoke-RestMethod -Uri "$BaseUrl/api/motor2/pricing/compare-by-subcategory/" -Method POST -Headers $Headers -Body $Body
    Write-Host "✓ Success: Retrieved $($Response.comparisons.Count) underwriters" -ForegroundColor Green
    
    foreach ($comp in $Response.comparisons | Sort-Object { $_.result.base_premium }) {
        $premium = [int]$comp.result.base_premium
        Write-Host "  - $($comp.underwriter_name): KSh $($premium.ToString('N0'))" -ForegroundColor White
    }
}
catch {
    Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 5: Get Commercial Subcategories
Write-Host "TEST 5: Get Commercial Subcategories" -ForegroundColor Yellow
Write-Host ("-" * 70) -ForegroundColor Gray

try {
    $Response = Invoke-RestMethod -Uri "$BaseUrl/api/motor2/subcategories/?category=COMMERCIAL" -Method GET -Headers $Headers
    Write-Host "✓ Success: Retrieved $($Response.subcategories.Count) subcategories" -ForegroundColor Green
    
    foreach ($subcat in $Response.subcategories | Select-Object -First 5) {
        Write-Host "  - $($subcat.subcategory_code) ($($subcat.pricing_model))" -ForegroundColor White
    }
    
    if ($Response.subcategories.Count -gt 5) {
        Write-Host "  ... and $($Response.subcategories.Count - 5) more" -ForegroundColor Gray
    }
}
catch {
    Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Summary
Write-Host "=" -ForegroundColor Green -NoNewline
Write-Host ("=" * 69) -ForegroundColor Green
Write-Host "API TESTING COMPLETE" -ForegroundColor Green
Write-Host "=" -ForegroundColor Green -NoNewline
Write-Host ("=" * 69) -ForegroundColor Green
Write-Host ""
Write-Host "If all tests passed, your Motor 2 pricing is ready!" -ForegroundColor Cyan
Write-Host ""
