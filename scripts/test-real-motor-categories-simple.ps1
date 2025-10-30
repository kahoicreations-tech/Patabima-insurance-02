# Test Real Motor Categories Based on Available Data
param(
    [string]$BaseUrl = "http://localhost:8000/api/v1/public_app",
    [string]$Phone,
    [string]$Password = "P@ssw0rd!",
    [switch]$SkipSignup
)

if (-not $Phone) {
    $Phone = "7" + (Get-Random -Minimum 10000000 -Maximum 99999999)
}

function Write-Info($msg) { Write-Host "[INFO]  $msg" -ForegroundColor Cyan }
function Write-Ok($msg) { Write-Host "[OK]    $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "[WARN]  $msg" -ForegroundColor Yellow }
function Write-Error($msg) { Write-Host "[ERROR] $msg" -ForegroundColor Red }

function ConvertTo-JsonBody($obj) { $obj | ConvertTo-Json -Depth 8 -Compress }

$global:AuthHeaders = @{}

function Invoke-Api {
    param(
        [Parameter(Mandatory = $true)][ValidateSet('GET', 'POST', 'PUT', 'DELETE', 'PATCH')]$Method,
        [Parameter(Mandatory = $true)][string]$Path,
        [object]$Body
    )
    $uri = if ($Path -match '^https?://') { $Path } else { "$BaseUrl$Path" }
    $params = @{ Method = $Method; Uri = $uri }
    if ($Body) { $params.ContentType = 'application/json'; $params.Body = (ConvertTo-JsonBody $Body) }
    if ($global:AuthHeaders.Count -gt 0) { $params.Headers = $global:AuthHeaders }
    try {
        return Invoke-RestMethod @params
    }
    catch {
        $detail = $_.ErrorDetails.Message
        throw "API error: $detail"
    }
}

Write-Info "Testing Real Motor Categories - BaseUrl: $BaseUrl, Phone: $Phone"

# Authentication flow
if (!$SkipSignup) {
    try {
        $signup = Invoke-Api -Method POST -Path '/auth/signup' -Body @{ 
            phonenumber = $Phone; full_names = 'Test User'; email = "test$Phone@example.com"
            user_role = 'CUSTOMER'; password = $Password; confirm_password = $Password 
        }
        Write-Ok "Signup success: user_id=$($signup.user_id)"
    }
    catch { 
        Write-Warn "Signup failed or user exists; proceeding to login..." 
    }
}

$loginResp = Invoke-Api -Method POST -Path '/auth/login' -Body @{ phonenumber = $Phone; password = $Password }
$OTP = $loginResp.otp_code
$auth = Invoke-Api -Method POST -Path '/auth/auth_login' -Body @{ phonenumber = $Phone; password = $Password; code = $OTP }
$global:AuthHeaders = @{ Authorization = "Bearer $($auth.access)" }
Write-Ok "Authenticated successfully"

# Test various motor categories
$results = @{}
$successCount = 0
$failCount = 0

Write-Info "=== TESTING REAL MOTOR CATEGORIES ==="

# PRIVATE VEHICLES
Write-Info "Testing PRIVATE vehicles..."
try {
    $result1 = Invoke-Api -Method POST -Path '/insurance/insurance/calculate_motor_premium' -Body @{
        subcategory_code = "PRIVATE_COMPREHENSIVE"; underwriter_code = "APA"; sum_insured = 1500000
    }
    Write-Ok "Private Comprehensive: KSh $($result1.total_premium) (Base: $($result1.base_premium))"
    $results["Private_Comprehensive"] = $result1; $successCount++
}
catch { Write-Error "Private Comprehensive failed: $($_.Exception.Message)"; $failCount++ }

try {
    $result2 = Invoke-Api -Method POST -Path '/insurance/insurance/calculate_motor_premium' -Body @{
        subcategory_code = "PRIVATE_TP"; underwriter_code = "APA"
    }
    Write-Ok "Private Third Party: KSh $($result2.total_premium) (Base: $($result2.base_premium))"
    $results["Private_TP"] = $result2; $successCount++
}
catch { Write-Error "Private Third Party failed: $($_.Exception.Message)"; $failCount++ }

try {
    $result3 = Invoke-Api -Method POST -Path '/insurance/insurance/calculate_motor_premium' -Body @{
        subcategory_code = "PRIVATE_TOR"; underwriter_code = "APA"
    }
    Write-Ok "Private TOR: KSh $($result3.total_premium) (Base: $($result3.base_premium))"
    $results["Private_TOR"] = $result3; $successCount++
}
catch { Write-Error "Private TOR failed: $($_.Exception.Message)"; $failCount++ }

# COMMERCIAL VEHICLES
Write-Info "Testing COMMERCIAL vehicles..."
try {
    $result4 = Invoke-Api -Method POST -Path '/insurance/insurance/calculate_motor_premium' -Body @{
        subcategory_code = "COMM_TONNAGE"; underwriter_code = "APA"; tonnage = 7.5
    }
    Write-Ok "Commercial Tonnage: KSh $($result4.total_premium) (Base: $($result4.base_premium))"
    $results["Commercial_Tonnage"] = $result4; $successCount++
}
catch { Write-Error "Commercial Tonnage failed: $($_.Exception.Message)"; $failCount++ }

try {
    $result5 = Invoke-Api -Method POST -Path '/insurance/insurance/calculate_motor_premium' -Body @{
        subcategory_code = "OWN_GOODS_COMP"; underwriter_code = "APA"; sum_insured = 1800000; tonnage = 3.5
    }
    Write-Ok "Own Goods Comprehensive: KSh $($result5.total_premium) (Base: $($result5.base_premium))"
    $results["Own_Goods_Comp"] = $result5; $successCount++
}
catch { Write-Error "Own Goods Comprehensive failed: $($_.Exception.Message)"; $failCount++ }

try {
    $result6 = Invoke-Api -Method POST -Path '/insurance/insurance/calculate_motor_premium' -Body @{
        subcategory_code = "OWN_GOODS_TP"; underwriter_code = "APA"; tonnage = 4.0
    }
    Write-Ok "Own Goods Third Party: KSh $($result6.total_premium) (Base: $($result6.base_premium))"
    $results["Own_Goods_TP"] = $result6; $successCount++
}
catch { Write-Error "Own Goods Third Party failed: $($_.Exception.Message)"; $failCount++ }

# MOTORCYCLES
Write-Info "Testing MOTORCYCLE vehicles..."
try {
    $result7 = Invoke-Api -Method POST -Path '/insurance/insurance/calculate_motor_premium' -Body @{
        subcategory_code = "MOTORCYCLE_COMPREHENSIVE"; underwriter_code = "APA"; sum_insured = 250000; engine_capacity = 150
    }
    Write-Ok "Motorcycle Comprehensive: KSh $($result7.total_premium) (Base: $($result7.base_premium))"
    $results["Motorcycle_Comprehensive"] = $result7; $successCount++
}
catch { Write-Error "Motorcycle Comprehensive failed: $($_.Exception.Message)"; $failCount++ }

try {
    $result8 = Invoke-Api -Method POST -Path '/insurance/insurance/calculate_motor_premium' -Body @{
        subcategory_code = "BODA_BODA_TP"; underwriter_code = "APA"; engine_capacity = 125
    }
    Write-Ok "Boda Boda Third Party: KSh $($result8.total_premium) (Base: $($result8.base_premium))"
    $results["Boda_Boda_TP"] = $result8; $successCount++
}
catch { Write-Error "Boda Boda Third Party failed: $($_.Exception.Message)"; $failCount++ }

try {
    $result9 = Invoke-Api -Method POST -Path '/insurance/insurance/calculate_motor_premium' -Body @{
        subcategory_code = "COURIER_TP"; underwriter_code = "APA"; engine_capacity = 150
    }
    Write-Ok "Courier Third Party: KSh $($result9.total_premium) (Base: $($result9.base_premium))"
    $results["Courier_TP"] = $result9; $successCount++
}
catch { Write-Error "Courier Third Party failed: $($_.Exception.Message)"; $failCount++ }

Write-Info "=== TESTING MULTI-UNDERWRITER COMPARISONS ==="
try {
    $comp1 = Invoke-Api -Method POST -Path '/insurance/insurance/compare_motor_pricing' -Body @{
        subcategory_code = "PRIVATE_COMPREHENSIVE"; underwriter_codes = @('APA', 'JUB'); sum_insured = 1500000
    }
    Write-Ok "Private Comprehensive comparison: $($comp1.comparisons.Count) underwriters"
    foreach ($comp in $comp1.comparisons) {
        Write-Info "  $($comp.underwriter_code): KSh $($comp.result.total_premium)"
    }
    $results["Comparison_Private_Comp"] = $comp1
}
catch { Write-Error "Private Comprehensive comparison failed: $($_.Exception.Message)" }

Write-Info "=== TEST SUMMARY ==="
Write-Ok "Successful tests: $successCount"
if ($failCount -gt 0) { Write-Warn "Failed tests: $failCount" }
Write-Ok "Total categories tested: $($successCount + $failCount)"

$summary = @{
    phone        = $Phone
    timestamp    = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    summary      = @{
        total_tests = $successCount + $failCount
        successful  = $successCount  
        failed      = $failCount
    }
    test_results = $results
}

$outPath = Join-Path $PSScriptRoot 'real-motor-categories-test.json'
$summary | ConvertTo-Json -Depth 15 | Out-File -FilePath $outPath -Encoding UTF8
Write-Ok "Results saved to: $outPath"

Write-Ok "Test completed successfully!"