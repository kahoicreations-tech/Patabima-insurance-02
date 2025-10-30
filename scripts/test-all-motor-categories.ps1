# Test All Motor Vehicle Categories
param(
    [string]$BaseUrl = "http://localhost:8000/api/v1/public_app",
    [string]$Phone,
    [string]$Password = "P@ssw0rd!",
    [switch]$SkipSignup,
    [switch]$Quiet
)

# Generate random phone if not provided
if (-not $Phone) {
    $Phone = "7" + (Get-Random -Minimum 10000000 -Maximum 99999999)
}

function Write-Info($msg) { if (-not $Quiet) { Write-Host "[INFO]  $msg" -ForegroundColor Cyan } }
function Write-Ok($msg) { if (-not $Quiet) { Write-Host "[OK]    $msg" -ForegroundColor Green } }
function Write-Warn($msg) { if (-not $Quiet) { Write-Host "[WARN]  $msg" -ForegroundColor Yellow } }
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
        try {
            $j = $detail | ConvertFrom-Json -ErrorAction Stop
            Write-Error ("API error at $Method ${Path}: " + ($j | ConvertTo-Json -Depth 8))
        }
        catch {
            Write-Error ("API error at $Method ${Path}: $detail")
        }
        throw
    }
}

try {
    Write-Info "BaseUrl: $BaseUrl"
    Write-Info "Phone: $Phone"

    # 1) Validate phone (optional)
    if (!$SkipSignup) {
        try {
            $vp = Invoke-Api -Method POST -Path '/auth/validate_phone' -Body @{ phonenumber = $Phone }
            Write-Ok "Phone available: $($vp.detail)"
        }
        catch {
            Write-Warn "Phone may already be registered; continuing..."
        }
    }

    # 2) Signup (if not skipped)
    if (!$SkipSignup) {
        try {
            $signup = Invoke-Api -Method POST -Path '/auth/signup' -Body @{ 
                phonenumber      = $Phone
                full_names       = 'Test User'
                email            = "test$Phone@example.com"
                user_role        = 'CUSTOMER'
                password         = $Password
                confirm_password = $Password 
            }
            Write-Ok "Signup success: user_id=$($signup.user_id)"
        }
        catch {
            Write-Warn "Signup failed or user exists; proceeding to login..."
        }
    }

    # 3) Login (request OTP)
    $loginResp = Invoke-Api -Method POST -Path '/auth/login' -Body @{ phonenumber = $Phone; password = $Password }
    Write-Ok "OTP requested"
    $OTP = $loginResp.otp_code
    if (!$OTP) {
        Write-Warn "OTP not returned; check server logs or enter manually:"
        $OTP = Read-Host -Prompt 'Enter OTP code'
    }

    # 4) Exchange OTP for access token
    $auth = Invoke-Api -Method POST -Path '/auth/auth_login' -Body @{ phonenumber = $Phone; password = $Password; code = $OTP }
    $ACCESS = $auth.access
    if (!$ACCESS) { throw 'Failed to obtain access token' }
    $global:AuthHeaders = @{ Authorization = "Bearer $ACCESS" }
    Write-Ok "Authenticated successfully"

    # 5) Get all categories and subcategories
    $cats = Invoke-Api -Method GET -Path '/insurance/insurance/motor_categories'
    Write-Ok "Categories: $($cats.categories.Count)"
    
    Write-Info "=== AVAILABLE MOTOR CATEGORIES ==="
    foreach ($category in $cats.categories) {
        Write-Info "Category: $($category.code) - $($category.name)"
        foreach ($sub in $category.subcategories) {
            Write-Info "  Subcategory: $($sub.code) - $($sub.name) (Pricing: $($sub.pricing_model))"
        }
    }

    # 6) Get underwriters
    $unds = Invoke-Api -Method GET -Path '/insurance/insurance/underwriters'
    Write-Ok "Underwriters: $($unds.underwriters.Count)"

    # 7) Test calculations for various categories
    $results = @{}
    
    # Test scenarios for different vehicle types
    $testScenarios = @(
        @{
            Name        = "Private Comprehensive"
            Subcategory = "PRIVATE_COMPREHENSIVE"
            Params      = @{ sum_insured = 1500000; add_ons = @{ excess_protector = $true; windscreen_value = 50000 } }
        },
        @{
            Name        = "Private Third Party"
            Subcategory = "PRIVATE_THIRD_PARTY"
            Params      = @{}
        },
        @{
            Name        = "Private TOR"
            Subcategory = "PRIVATE_TOR"
            Params      = @{}
        },
        @{
            Name        = "Commercial Comprehensive"
            Subcategory = "COMM_COMPREHENSIVE"
            Params      = @{ sum_insured = 2000000; tonnage = 5.5 }
        },
        @{
            Name        = "Commercial Tonnage"
            Subcategory = "COMM_TONNAGE"
            Params      = @{ tonnage = 7.5 }
        },
        @{
            Name        = "Commercial Third Party"
            Subcategory = "COMM_THIRD_PARTY"
            Params      = @{ tonnage = 3.0 }
        },
        @{
            Name        = "PSV Comprehensive"
            Subcategory = "PSV_COMPREHENSIVE"
            Params      = @{ sum_insured = 1800000; passenger_count = 25; pll_rate = 500 }
        },
        @{
            Name        = "PSV Standard"
            Subcategory = "PSV_STANDARD"
            Params      = @{ passenger_count = 14; pll_rate = 500 }
        },
        @{
            Name        = "PSV Third Party"
            Subcategory = "PSV_THIRD_PARTY"
            Params      = @{ passenger_count = 18; pll_rate = 250 }
        },
        @{
            Name        = "Motorcycle Comprehensive"
            Subcategory = "MOTORCYCLE_COMPREHENSIVE"
            Params      = @{ sum_insured = 300000; engine_capacity = 150 }
        },
        @{
            Name        = "Motorcycle Third Party"
            Subcategory = "MOTORCYCLE_THIRD_PARTY"
            Params      = @{ engine_capacity = 200 }
        },
        @{
            Name        = "TukTuk Comprehensive"
            Subcategory = "TUKTUK_COMPREHENSIVE"
            Params      = @{ sum_insured = 400000; passenger_count = 3 }
        },
        @{
            Name        = "TukTuk Third Party"
            Subcategory = "TUKTUK_THIRD_PARTY"
            Params      = @{ passenger_count = 3 }
        }
    )

    Write-Info "=== TESTING PREMIUM CALCULATIONS ==="
    foreach ($scenario in $testScenarios) {
        try {
            Write-Info "Testing: $($scenario.Name) ($($scenario.Subcategory))"
            
            # Prepare request body
            $requestBody = @{
                subcategory_code = $scenario.Subcategory
                underwriter_code = "APA"
            }
            
            # Add scenario-specific parameters
            foreach ($key in $scenario.Params.Keys) {
                $requestBody[$key] = $scenario.Params[$key]
            }
            
            $result = Invoke-Api -Method POST -Path '/insurance/insurance/calculate_motor_premium' -Body $requestBody
            
            Write-Ok "$($scenario.Name): KSh $($result.total_premium) (Base: KSh $($result.base_premium))"
            Write-Info "  ITL: KSh $($result.mandatory_levies.insurance_training_levy)"
            Write-Info "  PCF: KSh $($result.mandatory_levies.pcf_levy)"
            Write-Info "  Stamp Duty: KSh $($result.mandatory_levies.stamp_duty)"
            
            $results[$scenario.Name] = $result
            
        }
        catch {
            Write-Warn "$($scenario.Name): FAILED - $($_.Exception.Message)"
        }
    }

    # 8) Test multi-underwriter comparison for some products
    Write-Info "=== TESTING MULTI-UNDERWRITER COMPARISONS ==="
    $comparisonTests = @(
        @{ Name = "Private Comprehensive"; Code = "PRIVATE_COMPREHENSIVE"; Params = @{ sum_insured = 1200000 } },
        @{ Name = "Commercial Tonnage"; Code = "COMM_TONNAGE"; Params = @{ tonnage = 5.0 } },
        @{ Name = "PSV Standard"; Code = "PSV_STANDARD"; Params = @{ passenger_count = 14; pll_rate = 500 } }
    )

    foreach ($comparison in $comparisonTests) {
        try {
            Write-Info "Comparing underwriters for: $($comparison.Name)"
            
            $compareBody = @{
                subcategory_code  = $comparison.Code
                underwriter_codes = @('APA', 'JUB')
            }
            
            foreach ($key in $comparison.Params.Keys) {
                $compareBody[$key] = $comparison.Params[$key]
            }
            
            $compResult = Invoke-Api -Method POST -Path '/insurance/insurance/compare_motor_pricing' -Body $compareBody
            
            Write-Ok "$($comparison.Name) comparison: $($compResult.comparisons.Count) underwriters"
            foreach ($comp in $compResult.comparisons) {
                Write-Info "  $($comp.underwriter_code): KSh $($comp.result.total_premium)"
            }
            
            $results["Comparison_$($comparison.Name)"] = $compResult
            
        }
        catch {
            Write-Warn "$($comparison.Name) comparison: FAILED - $($_.Exception.Message)"
        }
    }

    # 9) Save comprehensive results
    $summary = @{
        phone        = $Phone
        timestamp    = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
        categories   = $cats.categories
        underwriters = $unds.underwriters
        test_results = $results
    }
    
    $outPath = Join-Path $PSScriptRoot 'comprehensive-motor-test-results.json'
    $summary | ConvertTo-Json -Depth 15 | Out-File -FilePath $outPath -Encoding UTF8
    Write-Ok "Comprehensive results saved to: $outPath"

    return @{ success = $true; results = $results }

}
catch {
    Write-Error "Test failed: $($_.Exception.Message)"
    return @{ success = $false; error = $_.Exception.Message }
}