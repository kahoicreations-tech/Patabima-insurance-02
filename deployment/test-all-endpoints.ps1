# Test All PataBima API Endpoints
# EC2 Instance: 44.200.182.180

$baseUrl = "http://44.200.182.180"
$results = @()

Write-Host "`n🧪 Testing All PataBima API Endpoints..." -ForegroundColor Cyan
Write-Host "=" * 80 -ForegroundColor DarkGray
Write-Host "Base URL: $baseUrl" -ForegroundColor White
Write-Host ""

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Endpoint,
        [string]$Method = "GET",
        [hashtable]$Body = $null,
        [hashtable]$Headers = @{"Content-Type" = "application/json"}
    )
    
    Write-Host "Testing: $Name" -ForegroundColor Yellow -NoNewline
    Write-Host " ($Method $Endpoint)" -ForegroundColor DarkGray
    
    try {
        $uri = "$baseUrl$Endpoint"
        
        if ($Method -eq "GET") {
            $response = Invoke-WebRequest -Uri $uri -Method GET -Headers $Headers -TimeoutSec 10 -ErrorAction Stop
        } else {
            $jsonBody = $Body | ConvertTo-Json -Depth 10
            $response = Invoke-WebRequest -Uri $uri -Method $Method -Headers $Headers -Body $jsonBody -TimeoutSec 10 -ErrorAction Stop
        }
        
        $statusCode = $response.StatusCode
        $content = $response.Content | ConvertFrom-Json -ErrorAction SilentlyContinue
        
        if ($statusCode -eq 200 -or $statusCode -eq 201) {
            Write-Host "  ✅ SUCCESS" -ForegroundColor Green -NoNewline
            Write-Host " (Status: $statusCode)" -ForegroundColor DarkGray
            
            # Show sample response
            if ($content) {
                $preview = ($content | ConvertTo-Json -Compress -Depth 2).Substring(0, [Math]::Min(100, ($content | ConvertTo-Json -Compress -Depth 2).Length))
                Write-Host "  📄 Response: $preview..." -ForegroundColor DarkGray
            }
            
            return @{
                Name = $Name
                Endpoint = $Endpoint
                Method = $Method
                Status = "✅ PASS"
                StatusCode = $statusCode
                ResponseTime = $response.Headers["X-Response-Time"]
                Details = "Success"
            }
        } else {
            Write-Host "  ⚠️  UNEXPECTED STATUS" -ForegroundColor Yellow -NoNewline
            Write-Host " (Status: $statusCode)" -ForegroundColor DarkGray
            
            return @{
                Name = $Name
                Endpoint = $Endpoint
                Method = $Method
                Status = "⚠️  WARN"
                StatusCode = $statusCode
                Details = "Unexpected status code"
            }
        }
    } catch {
        $errorMsg = $_.Exception.Message
        $statusCode = $_.Exception.Response.StatusCode.Value__
        
        if ($statusCode -eq 401 -or $statusCode -eq 403) {
            Write-Host "  🔒 AUTH REQUIRED" -ForegroundColor Cyan -NoNewline
            Write-Host " (Status: $statusCode)" -ForegroundColor DarkGray
            
            return @{
                Name = $Name
                Endpoint = $Endpoint
                Method = $Method
                Status = "🔒 AUTH"
                StatusCode = $statusCode
                Details = "Authentication required (expected)"
            }
        } elseif ($statusCode -eq 404) {
            Write-Host "  ❌ NOT FOUND" -ForegroundColor Red -NoNewline
            Write-Host " (Status: 404)" -ForegroundColor DarkGray
            
            return @{
                Name = $Name
                Endpoint = $Endpoint
                Method = $Method
                Status = "❌ FAIL"
                StatusCode = 404
                Details = "Endpoint not found"
            }
        } else {
            Write-Host "  ❌ ERROR" -ForegroundColor Red -NoNewline
            Write-Host " ($errorMsg)" -ForegroundColor DarkGray
            
            return @{
                Name = $Name
                Endpoint = $Endpoint
                Method = $Method
                Status = "❌ FAIL"
                StatusCode = $statusCode
                Details = $errorMsg
            }
        }
    }
    
    Write-Host ""
}

# ============================================================================
# HEALTH & STATUS ENDPOINTS
# ============================================================================
Write-Host "`n📊 HEALTH & STATUS ENDPOINTS" -ForegroundColor Magenta
Write-Host "-" * 80 -ForegroundColor DarkGray

$results += Test-Endpoint -Name "Health Check (v1)" -Endpoint "/api/v1/health/"
$results += Test-Endpoint -Name "Health Check (root)" -Endpoint "/api/health/"
$results += Test-Endpoint -Name "API Root" -Endpoint "/api/"

# ============================================================================
# VEHICLE VALIDATION ENDPOINTS
# ============================================================================
Write-Host "`n🚘 VEHICLE VALIDATION ENDPOINTS" -ForegroundColor Magenta
Write-Host "-" * 80 -ForegroundColor DarkGray

$results += Test-Endpoint -Name "Validate Vehicle Registration" -Endpoint "/api/v1/vehicle/validate-registration/" -Method "POST" -Body @{
    registration = "KDA123A"
}
$results += Test-Endpoint -Name "Validate Vehicle Chassis" -Endpoint "/api/v1/vehicle/validate-chassis/" -Method "POST" -Body @{
    chassis_number = "ABC12345678901234"
}

# ============================================================================
# MOTOR INSURANCE (MOTOR2) ENDPOINTS
# ============================================================================
Write-Host "`n🚗 MOTOR INSURANCE (MOTOR2) ENDPOINTS" -ForegroundColor Magenta
Write-Host "-" * 80 -ForegroundColor DarkGray

$results += Test-Endpoint -Name "Motor2 Categories" -Endpoint "/api/v1/motor2/categories/"
$results += Test-Endpoint -Name "Motor2 Subcategories" -Endpoint "/api/v1/motor2/subcategories/"
$results += Test-Endpoint -Name "Motor2 Field Requirements" -Endpoint "/api/v1/motor2/field-requirements/"
$results += Test-Endpoint -Name "Motor Categories (Legacy)" -Endpoint "/api/v1/motor/categories/"
$results += Test-Endpoint -Name "Motor Subcategories (Legacy)" -Endpoint "/api/v1/motor/subcategories/"

# Category-specific
$results += Test-Endpoint -Name "Private Subcategories" -Endpoint "/api/v1/motor2/subcategories/?category=PRIVATE"

# Underwriters & Pricing
$results += Test-Endpoint -Name "Get Underwriters" -Endpoint "/api/v1/public_app/insurance/get_underwriters/"
$results += Test-Endpoint -Name "Compare Motor Pricing" -Endpoint "/api/v1/public_app/insurance/compare_motor_pricing/" -Method "POST" -Body @{
    category = "PRIVATE"
    subcategory = "THIRD_PARTY"
    registration = "KDA123A"
}
$results += Test-Endpoint -Name "Calculate Motor Premium" -Endpoint "/api/v1/public_app/insurance/calculate_motor_premium/" -Method "POST" -Body @{
    category = "PRIVATE"
    subcategory = "THIRD_PARTY"
}
$results += Test-Endpoint -Name "Get Addons" -Endpoint "/api/v1/public_app/insurance/addons/"

# Quotations & Policies
$results += Test-Endpoint -Name "Submit Motor Quotation" -Endpoint "/api/v1/public_app/insurance/submit_motor_quotation/" -Method "POST" -Body @{
    category = "PRIVATE"
    subcategory_code = "PRIVATE_THIRD_PARTY"
    vehicle_details = @{
        registration = "KDA 123A"
        cover_start_date = "2025-11-20"
    }
    client_details = @{
        id_number = "12345678"
        phone_number = "0712345678"
        email = "test@example.com"
    }
}
$results += Test-Endpoint -Name "Get Public Quotations" -Endpoint "/api/v1/public_app/insurance/get_quotations/"
$results += Test-Endpoint -Name "List Motor Policies" -Endpoint "/api/v1/policies/motor/"
$results += Test-Endpoint -Name "Create Motor Policy" -Endpoint "/api/v1/policies/motor/create/" -Method "POST"
$results += Test-Endpoint -Name "Upcoming Renewals" -Endpoint "/api/v1/policies/motor/upcoming-renewals/"
$results += Test-Endpoint -Name "Upcoming Extensions" -Endpoint "/api/v1/policies/motor/upcoming-extensions/"

# ============================================================================
# DOCUMENT UPLOAD ENDPOINTS
# ============================================================================
Write-Host "`n📄 DOCUMENT UPLOAD ENDPOINTS" -ForegroundColor Magenta
Write-Host "-" * 80 -ForegroundColor DarkGray

$results += Test-Endpoint -Name "Upload KYC Document" -Endpoint "/api/v1/documents/upload-kyc/" -Method "POST"
$results += Test-Endpoint -Name "Simulate OCR Processing" -Endpoint "/api/v1/documents/ocr-process/" -Method "POST"

# ============================================================================
# POLICY MANAGEMENT ENDPOINTS
# ============================================================================
Write-Host "`n📋 POLICY MANAGEMENT ENDPOINTS" -ForegroundColor Magenta
Write-Host "-" * 80 -ForegroundColor DarkGray

$results += Test-Endpoint -Name "Create Policy Quote" -Endpoint "/api/v1/policies/create-quote/" -Method "POST"
$results += Test-Endpoint -Name "Generate Receipt" -Endpoint "/api/v1/policies/receipt/POL-2025-001234/"





# ============================================================================
# PAYMENT ENDPOINTS
# ============================================================================
Write-Host "`n💳 PAYMENT ENDPOINTS" -ForegroundColor Magenta
Write-Host "-" * 80 -ForegroundColor DarkGray

$results += Test-Endpoint -Name "Initiate M-PESA Payment" -Endpoint "/api/v1/payments/mpesa/initiate/" -Method "POST" -Body @{
    phone_number = "0712345678"
    amount = 3000
}
$results += Test-Endpoint -Name "Initiate DPO Payment" -Endpoint "/api/v1/payments/dpo/initiate/" -Method "POST"
$results += Test-Endpoint -Name "Payment Callback" -Endpoint "/api/v1/payments/callback/" -Method "POST"



# ============================================================================
# ADMIN ENDPOINTS
# ============================================================================
Write-Host "`n⚙️  ADMIN ENDPOINTS" -ForegroundColor Magenta
Write-Host "-" * 80 -ForegroundColor DarkGray

$results += Test-Endpoint -Name "Django Admin" -Endpoint "/admin/"
$results += Test-Endpoint -Name "API Admin Root" -Endpoint "/api/admin/"

# ============================================================================
# SUMMARY
# ============================================================================
Write-Host "`n" -NoNewline
Write-Host "=" * 80 -ForegroundColor DarkGray
Write-Host "`n📊 TEST SUMMARY" -ForegroundColor Cyan
Write-Host "-" * 80 -ForegroundColor DarkGray

$passCount = ($results | Where-Object { $_.Status -eq "✅ PASS" }).Count
$authCount = ($results | Where-Object { $_.Status -eq "🔒 AUTH" }).Count
$warnCount = ($results | Where-Object { $_.Status -eq "⚠️  WARN" }).Count
$failCount = ($results | Where-Object { $_.Status -eq "❌ FAIL" }).Count
$totalCount = $results.Count

Write-Host "`nTotal Endpoints Tested: $totalCount" -ForegroundColor White
Write-Host "  ✅ Passed:             $passCount" -ForegroundColor Green
Write-Host "  🔒 Auth Required:      $authCount" -ForegroundColor Cyan
Write-Host "  ⚠️  Warnings:          $warnCount" -ForegroundColor Yellow
Write-Host "  ❌ Failed:             $failCount" -ForegroundColor Red

Write-Host "`n" -NoNewline

# Detailed Results Table
Write-Host "`n📋 DETAILED RESULTS" -ForegroundColor Cyan
Write-Host "-" * 80 -ForegroundColor DarkGray
$results | Format-Table -Property @{Label="Status"; Expression={$_.Status}; Width=10}, 
                                  @{Label="Endpoint"; Expression={$_.Endpoint}; Width=50}, 
                                  @{Label="Code"; Expression={$_.StatusCode}; Width=5},
                                  @{Label="Details"; Expression={$_.Details}; Width=30} -Wrap

# Export to JSON
$jsonPath = ".\endpoint-test-results.json"
$results | ConvertTo-Json -Depth 10 | Out-File -FilePath $jsonPath -Encoding UTF8
Write-Host "💾 Results exported to: $jsonPath" -ForegroundColor Green

# Failed Endpoints
if ($failCount -gt 0) {
    Write-Host "`n⚠️  FAILED ENDPOINTS:" -ForegroundColor Red
    $results | Where-Object { $_.Status -eq "❌ FAIL" } | ForEach-Object {
        Write-Host "  • $($_.Endpoint) - $($_.Details)" -ForegroundColor Red
    }
}

Write-Host "`n"
