# Test Real Motor Categories Based on Available Data
param(
    [string]$BaseUrl = "http://localhost:8000/api/v1/public_app",
    [string]$Phone,
    [string]$Password = "P@ssw0rd!",
    [switch]$SkipSignup
)

# Generate random phone if not provided
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

try {
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
        catch { Write-Warn "Signup failed or user exists; proceeding to login..." }
    }

    $loginResp = Invoke-Api -Method POST -Path '/auth/login' -Body @{ phonenumber = $Phone; password = $Password }
    $OTP = $loginResp.otp_code
    $auth = Invoke-Api -Method POST -Path '/auth/auth_login' -Body @{ phonenumber = $Phone; password = $Password; code = $OTP }
    $global:AuthHeaders = @{ Authorization = "Bearer $($auth.access)" }
    Write-Ok "Authenticated successfully"

    # Real test scenarios based on actual available subcategories
    $realTests = @(
        # PRIVATE VEHICLES
        @{
            Category = "PRIVATE"
            Name     = "Private Comprehensive"
            Code     = "PRIVATE_COMPREHENSIVE"
            Params   = @{ sum_insured = 1500000; add_ons = @{ excess_protector = $true; windscreen_value = 50000 } }
        },
        @{
            Category = "PRIVATE"
            Name     = "Private Third Party"
            Code     = "PRIVATE_TP"
            Params   = @{}
        },
        @{
            Category = "PRIVATE"
            Name     = "Private Time on Risk"
            Code     = "PRIVATE_TOR"
            Params   = @{}
        },
        @{
            Category = "PRIVATE"
            Name     = "Private Executive Comprehensive"
            Code     = "PRIVATE_EXECUTIVE_COMP"
            Params   = @{ sum_insured = 3000000; add_ons = @{ excess_protector = $true; pvt = $true; windscreen_value = 100000 } }
        },
        @{
            Category = "PRIVATE"
            Name     = "Private Saloon Comprehensive"
            Code     = "PRIVATE_SALOON_COMP"
            Params   = @{ sum_insured = 1200000 }
        },
        
        # COMMERCIAL VEHICLES
        @{
            Category = "COMMERCIAL"
            Name     = "Commercial Comprehensive"
            Code     = "COMM_COMPREHENSIVE"
            Params   = @{ sum_insured = 2500000; tonnage = 5.0 }
        },
        @{
            Category = "COMMERCIAL"
            Name     = "Commercial Tonnage Scale"
            Code     = "COMM_TONNAGE"
            Params   = @{ tonnage = 7.5 }
        },
        @{
            Category = "COMMERCIAL"
            Name     = "Own Goods Comprehensive"
            Code     = "OWN_GOODS_COMP"
            Params   = @{ sum_insured = 1800000; tonnage = 3.5 }
        },
        @{
            Category = "COMMERCIAL"
            Name     = "Own Goods Third Party"
            Code     = "OWN_GOODS_TP"
            Params   = @{ tonnage = 4.0 }
        },
        @{
            Category = "COMMERCIAL"
            Name     = "General Cartage Comprehensive"
            Code     = "GENERAL_CARTAGE_COMP"
            Params   = @{ sum_insured = 2200000; tonnage = 6.0 }
        },
        @{
            Category = "COMMERCIAL"
            Name     = "Tractor Comprehensive"
            Code     = "TRACTOR_COMP"
            Params   = @{ sum_insured = 800000 }
        },
        @{
            Category = "COMMERCIAL"
            Name     = "Commercial Time on Risk"
            Code     = "COMM_TOR"
            Params   = @{}
        },
        
        # MOTORCYCLES
        @{
            Category = "MOTORCYCLE"
            Name     = "Motorcycle Comprehensive"
            Code     = "MOTORCYCLE_COMPREHENSIVE"
            Params   = @{ sum_insured = 250000; engine_capacity = 150 }
        },
        @{
            Category = "MOTORCYCLE"
            Name     = "Private Motorcycle Third Party"
            Code     = "MOTORCYCLE_PRIVATE_TP"
            Params   = @{ engine_capacity = 200 }
        },
        @{
            Category = "MOTORCYCLE"
            Name     = "Boda Boda Third Party"
            Code     = "BODA_BODA_TP"
            Params   = @{ engine_capacity = 125 }
        },
        @{
            Category = "MOTORCYCLE"
            Name     = "Courier Third Party"
            Code     = "COURIER_TP"
            Params   = @{ engine_capacity = 150 }
        },
        @{
            Category = "MOTORCYCLE"
            Name     = "Motorcycle Executive Comprehensive"
            Code     = "MOTORCYCLE_EXEC_COMP"
            Params   = @{ sum_insured = 500000; engine_capacity = 250 }
        }
    )

    $results = @{}
    $successCount = 0
    $failCount = 0

    Write-Info "=== TESTING REAL MOTOR CATEGORIES ==="
    
    foreach ($test in $realTests) {
        try {
            Write-Info "[$($test.Category)] Testing: $($test.Name)"
            
            $requestBody = @{
                subcategory_code = $test.Code
                underwriter_code = "APA"
            }
            
            foreach ($key in $test.Params.Keys) {
                $requestBody[$key] = $test.Params[$key]
            }
            
            $result = Invoke-Api -Method POST -Path '/insurance/insurance/calculate_motor_premium' -Body $requestBody
            
            Write-Ok "✓ $($test.Name): KSh $($result.total_premium) (Base: KSh $($result.base_premium))"
            Write-Info "    ITL: KSh $($result.mandatory_levies.insurance_training_levy) | PCF: KSh $($result.mandatory_levies.pcf_levy) | Stamp: KSh $($result.mandatory_levies.stamp_duty)"
            
            $results[$test.Name] = $result
            $successCount++
            
        }
        catch {
            Write-Error "✗ $($test.Name): FAILED - $($_.Exception.Message)"
            $failCount++
        }
    }

    # Test multi-underwriter comparisons
    Write-Info "=== TESTING MULTI-UNDERWRITER COMPARISONS ==="
    $comparisonTests = @(
        @{ Name = "Private Comprehensive"; Code = "PRIVATE_COMPREHENSIVE"; Params = @{ sum_insured = 1500000 } },
        @{ Name = "Commercial Tonnage"; Code = "COMM_TONNAGE"; Params = @{ tonnage = 5.0 } },
        @{ Name = "Motorcycle Comprehensive"; Code = "MOTORCYCLE_COMPREHENSIVE"; Params = @{ sum_insured = 300000; engine_capacity = 150 } }
    )

    foreach ($comparison in $comparisonTests) {
        try {
            $compareBody = @{
                subcategory_code  = $comparison.Code
                underwriter_codes = @('APA', 'JUB')
            }
            
            foreach ($key in $comparison.Params.Keys) {
                $compareBody[$key] = $comparison.Params[$key]
            }
            
            $compResult = Invoke-Api -Method POST -Path '/insurance/insurance/compare_motor_pricing' -Body $compareBody
            
            Write-Ok "✓ $($comparison.Name) comparison: $($compResult.comparisons.Count) underwriters"
            foreach ($comp in $compResult.comparisons) {
                $diff = if ($comp.underwriter_code -eq 'APA') { "" } else {
                    $apaPrice = ($compResult.comparisons | Where-Object { $_.underwriter_code -eq 'APA' }).result.total_premium
                    $priceDiff = [decimal]$comp.result.total_premium - [decimal]$apaPrice
                    if ($priceDiff -gt 0) { " (+KSh $priceDiff)" } else { " (KSh $priceDiff)" }
                }
                Write-Info "    $($comp.underwriter_code): KSh $($comp.result.total_premium)$diff"
            }
            
            $results["Comparison_$($comparison.Name)"] = $compResult
            
        }
        catch {
            Write-Error "✗ $($comparison.Name) comparison: FAILED - $($_.Exception.Message)"
        }
    }

    # Summary
    Write-Info "=== TEST SUMMARY ==="
    Write-Ok "✓ Successful tests: $successCount"
    if ($failCount -gt 0) { Write-Warn "✗ Failed tests: $failCount" }
    Write-Ok "Total categories tested: $($successCount + $failCount)"
    
    # Save results
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

    return @{ success = $true; summary = $summary }

}
catch {
    Write-Error "Test failed: $($_.Exception.Message)"
    return @{ success = $false; error = $_.Exception.Message }
}