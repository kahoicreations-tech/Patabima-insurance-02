# Calculate Premiums for KSh 2,000,000 Car Value Across All Categories
param(
    [string]$BaseUrl = "http://localhost:8000/api/v1/public_app",
    [string]$Phone,
    [string]$Password = "P@ssw0rd!",
    [decimal]$CarValue = 2000000,
    [switch]$SkipSignup,
    [string[]]$UnderwriterCodes = @()
)

if (-not $Phone) {
    $Phone = "7" + (Get-Random -Minimum 10000000 -Maximum 99999999)
}

function Write-Info($msg) { Write-Host "[INFO]  $msg" -ForegroundColor Cyan }
function Write-Ok($msg) { Write-Host "[OK]    $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "[WARN]  $msg" -ForegroundColor Yellow }
function Write-Error($msg) { Write-Host "[ERROR] $msg" -ForegroundColor Red }
function Write-Price($msg) { Write-Host "[PRICE] $msg" -ForegroundColor Magenta }

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

Write-Info "=== CAR INSURANCE PREMIUM CALCULATOR ==="
Write-Info "Car Value: KSh $($CarValue.ToString('N0'))"
Write-Info "Phone: $Phone"

# Authentication
if (!$SkipSignup) {
    try {
        $signup = Invoke-Api -Method POST -Path '/auth/signup' -Body @{ 
            phonenumber = $Phone; full_names = 'Test User'; email = "test$Phone@example.com"
            user_role = 'CUSTOMER'; password = $Password; confirm_password = $Password 
        }
        Write-Ok "Signup success"
    }
    catch { Write-Warn "Signup failed; proceeding to login..." }
}

$loginResp = Invoke-Api -Method POST -Path '/auth/login' -Body @{ phonenumber = $Phone; password = $Password }
$auth = Invoke-Api -Method POST -Path '/auth/auth_login' -Body @{ phonenumber = $Phone; password = $Password; code = $loginResp.otp_code }
$global:AuthHeaders = @{ Authorization = "Bearer $($auth.access)" }
Write-Ok "Authenticated successfully"

Write-Info ""
Write-Info "=== PREMIUM CALCULATIONS FOR KSh 2,000,000 CAR ==="

$results = @{}

# COMPREHENSIVE COVERAGE OPTIONS
Write-Info ""
Write-Info "COMPREHENSIVE COVERAGE (Full Protection)"
Write-Info "================================================"

try {
    $private_comp = Invoke-Api -Method POST -Path '/insurance/calculate_motor_premium' -Body @{
        subcategory_code = "PRIVATE_COMPREHENSIVE"
        underwriter_code = "APA"
        sum_insured      = $CarValue
        add_ons          = @{ 
            excess_protector = $true
            windscreen_value = 100000
            radio_value      = 50000
        }
    }
    Write-Price "Private Comprehensive: KSh $($private_comp.total_premium) annually"
    Write-Info "  - Full accident coverage + theft + fire + windscreen"
    Write-Info "  - Base Premium: KSh $($private_comp.base_premium)"
    Write-Info "  - ITL Levy: KSh $($private_comp.mandatory_levies.insurance_training_levy)"
    Write-Info "  - PCF Levy: KSh $($private_comp.mandatory_levies.pcf_levy)"  
    Write-Info "  - Stamp Duty: KSh $($private_comp.mandatory_levies.stamp_duty)"
    $results["Private_Comprehensive"] = $private_comp
}
catch { Write-Error "Private Comprehensive failed: $($_.Exception.Message)" }

try {
    $executive_comp = Invoke-Api -Method POST -Path '/insurance/calculate_motor_premium' -Body @{
        subcategory_code = "PRIVATE_EXECUTIVE_COMP"
        underwriter_code = "APA"
        sum_insured      = $CarValue
        add_ons          = @{ 
            excess_protector = $true
            pvt              = $true
            windscreen_value = 150000
            radio_value      = 80000
        }
    }
    Write-Price "Private Executive Comprehensive: KSh $($executive_comp.total_premium) annually"
    Write-Info "  - Premium comprehensive + enhanced benefits"
    Write-Info "  - Base Premium: KSh $($executive_comp.base_premium)"
    $results["Executive_Comprehensive"] = $executive_comp
}
catch { Write-Error "Executive Comprehensive failed: $($_.Exception.Message)" }

try {
    $saloon_comp = Invoke-Api -Method POST -Path '/insurance/calculate_motor_premium' -Body @{
        subcategory_code = "PRIVATE_SALOON_COMP"
        underwriter_code = "APA"
        sum_insured      = $CarValue
    }
    Write-Price "Private Saloon Comprehensive: KSh $($saloon_comp.total_premium) annually"
    Write-Info "  - Tailored for saloon cars"
    Write-Info "  - Base Premium: KSh $($saloon_comp.base_premium)"
    $results["Saloon_Comprehensive"] = $saloon_comp
}
catch { Write-Error "Saloon Comprehensive failed: $($_.Exception.Message)" }

# THIRD PARTY COVERAGE
Write-Info ""
Write-Info "THIRD PARTY COVERAGE (Basic Legal Requirement)"
Write-Info "================================================"

try {
    $private_tp = Invoke-Api -Method POST -Path '/insurance/calculate_motor_premium' -Body @{
        subcategory_code = "PRIVATE_TP"
        underwriter_code = "APA"
    }
    Write-Price "Private Third Party: KSh $($private_tp.total_premium) annually"
    Write-Info "  - Covers damages to others only (no own damage)"
    Write-Info "  - Base Premium: KSh $($private_tp.base_premium)"
    Write-Info "  - ITL Levy: KSh $($private_tp.mandatory_levies.insurance_training_levy)"
    Write-Info "  - PCF Levy: KSh $($private_tp.mandatory_levies.pcf_levy)"
    Write-Info "  - Stamp Duty: KSh $($private_tp.mandatory_levies.stamp_duty)"
    $results["Private_Third_Party"] = $private_tp
}
catch { Write-Error "Private Third Party failed: $($_.Exception.Message)" }

try {
    $mini_tp = Invoke-Api -Method POST -Path '/insurance/calculate_motor_premium' -Body @{
        subcategory_code = "PRIVATE_MINI_TP"
        underwriter_code = "APA"
    }
    Write-Price "Private Mini Third Party: KSh $($mini_tp.total_premium) annually"
    Write-Info "  - For smaller/mini vehicles"
    Write-Info "  - Base Premium: KSh $($mini_tp.base_premium)"
    $results["Mini_Third_Party"] = $mini_tp
}
catch { Write-Error "Mini Third Party failed: $($_.Exception.Message)" }

# TIME ON RISK COVERAGE
Write-Info ""
Write-Info "TIME ON RISK (TOR) - Short Term Coverage"
Write-Info "================================================"

try {
    $private_tor = Invoke-Api -Method POST -Path '/insurance/calculate_motor_premium' -Body @{
        subcategory_code = "PRIVATE_TOR"
        underwriter_code = "APA"
    }
    Write-Price "Private Time on Risk: KSh $($private_tor.total_premium) for short period"
    Write-Info "  - Temporary coverage (days/weeks)"
    Write-Info "  - Base Premium: KSh $($private_tor.base_premium)"
    $results["Private_TOR"] = $private_tor
}
catch { Write-Error "Private TOR failed: $($_.Exception.Message)" }

# MULTI-UNDERWRITER COMPARISON
Write-Info ""
Write-Info "MULTI-UNDERWRITER COMPARISON FOR KSh 2M CAR"
Write-Info "================================================"

try {
    $compareBody = @{
        subcategory_code = "PRIVATE_COMPREHENSIVE"
        sum_insured      = $CarValue
        add_ons          = @{ 
            excess_protector = $true
            windscreen_value = 100000
        }
    }
    if ($UnderwriterCodes -and $UnderwriterCodes.Count -gt 0) {
        $compareBody['underwriter_codes'] = $UnderwriterCodes
    }
    $comparison = Invoke-Api -Method POST -Path '/insurance/compare_motor_pricing' -Body $compareBody
    
    Write-Info "Private Comprehensive - Price Comparison:"
    $prices = @()
    foreach ($comp in $comparison.comparisons) {
        $price = [decimal]$comp.result.total_premium
        $prices += $price
        Write-Price "  $($comp.underwriter_code): KSh $($comp.result.total_premium)"
    }
    
    if ($prices.Count -ge 2) {
        $minPrice = ($prices | Measure-Object -Minimum).Minimum
        $maxPrice = ($prices | Measure-Object -Maximum).Maximum
        $savings = $maxPrice - $minPrice
        Write-Info "  Potential Savings: KSh $savings by choosing cheapest option"
    }
    
    $results["Multi_Underwriter_Comparison"] = $comparison
}
catch { Write-Error "Multi-underwriter comparison failed: $($_.Exception.Message)" }

# SUMMARY
Write-Info ""
Write-Info "SUMMARY FOR KSh 2,000,000 CAR"
Write-Info "================================================"

$premiumSummary = @()
foreach ($key in $results.Keys) {
    if ($results[$key].total_premium) {
        $premiumSummary += @{
            Product = $key -replace '_', ' '
            Premium = [decimal]$results[$key].total_premium
            Type    = $results[$key].calculation_type
        }
    }
}

$sortedPremiums = $premiumSummary | Sort-Object Premium
Write-Info "Premiums ranked from CHEAPEST to MOST EXPENSIVE:"

foreach ($item in $sortedPremiums) {
    $monthlyEquivalent = [math]::Round($item.Premium / 12, 2)
    Write-Price "- $($item.Product): KSh $($item.Premium.ToString('N0')) annually (KSh $($monthlyEquivalent.ToString('N0'))/month)"
}

if ($sortedPremiums.Count -ge 2) {
    $cheapest = $sortedPremiums[0].Premium
    $mostExpensive = $sortedPremiums[-1].Premium
    $totalRange = $mostExpensive - $cheapest
    Write-Info ""
    Write-Info "COST RANGE: KSh $($cheapest.ToString('N0')) - KSh $($mostExpensive.ToString('N0'))"
    Write-Info "POTENTIAL SAVINGS: Up to KSh $($totalRange.ToString('N0')) by choosing the right product"
}

Write-Info ""
Write-Info "RECOMMENDATIONS FOR KSh 2M CAR:"
Write-Info "- BEST VALUE: Third Party if budget-conscious"
Write-Info "- RECOMMENDED: Comprehensive for full protection"
Write-Info "- PREMIUM OPTION: Executive Comprehensive for enhanced benefits"
Write-Info "- SHORT TERM: TOR for temporary needs"

# Save results
$carValueSummary = @{
    car_value       = $CarValue
    currency        = "KSh"
    timestamp       = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    phone           = $Phone
    premium_options = $results
    summary         = $sortedPremiums
}

$outPath = Join-Path $PSScriptRoot "car-value-2M-premiums.json"
$carValueSummary | ConvertTo-Json -Depth 15 | Out-File -FilePath $outPath -Encoding UTF8
Write-Ok ""
Write-Ok "Detailed results saved to: $outPath"
Write-Ok "Premium calculation completed for KSh 2,000,000 car"