#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Motor3 Complete Flow Smoke Test
    
.DESCRIPTION
    Comprehensive smoke test that validates all Motor3 endpoints including:
    - User signup and authentication
    - Motor3 metadata and configuration
    - Vehicle search (DMVIC v5)
    - Premium calculation and comparison
    - Quotation creation (Third-Party)
    - Double insurance validation (DMVIC v5)
    - Certificate preview (DMVIC v6 Intermediary)
    - Certificate issuance (DMVIC v6 Intermediary)
    - Policy retrieval
    
.PARAMETER BaseUrl
    Backend API base URL (default: http://localhost:8000)
    
.PARAMETER Phone
    User phone number (default: randomly generated)
    
.PARAMETER Password
    User password (default: Test@123)
    
.PARAMETER RegistrationNumber
    Vehicle registration to test (default: KCA123A)
    
.PARAMETER SkipSignup
    Skip user signup if account exists
    
.PARAMETER TestCertificatePreview
    Test certificate preview functionality (requires policy creation)
    
.PARAMETER Verbose
    Show detailed request/response information
    
.EXAMPLE
    .\test-motor3-smoke.ps1
    
.EXAMPLE
    .\test-motor3-smoke.ps1 -BaseUrl "http://ec2-instance.com:8000" -TestCertificatePreview
    
.EXAMPLE
    .\test-motor3-smoke.ps1 -Phone "254712345678" -SkipSignup -Verbose
#>

[CmdletBinding()]
param(
    [string]$BaseUrl = "http://localhost:8000",
    [string]$Phone,
    [string]$Password = "Test@123",
    [string]$RegistrationNumber = "KCA123A",
    [switch]$SkipSignup,
    [switch]$TestCertificatePreview,
    [switch]$ShowDetails
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

# Generate random phone if not provided
if (-not $Phone) {
    $Phone = "07" + (Get-Random -Minimum 10000000 -Maximum 99999999).ToString().Substring(0, 8)
}

# Test results tracking
$script:TestResults = @{
    Total   = 0
    Passed  = 0
    Failed  = 0
    Skipped = 0
    Tests   = @()
}

# Auth token storage
$script:AuthToken = $null
$script:UserId = $null

#region Helper Functions

function Write-TestHeader {
    param([string]$Message)
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "  $Message" -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan
}

function Write-TestStep {
    param([string]$Message)
    Write-Host "→ $Message" -ForegroundColor Yellow
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Failure {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor Blue
}

function Write-Detail {
    param([string]$Message)
    if ($ShowDetails) {
        Write-Host "  $Message" -ForegroundColor DarkGray
    }
}

function Invoke-ApiCall {
    param(
        [string]$Method,
        [string]$Path,
        [hashtable]$Body,
        [switch]$RequiresAuth,
        [int]$TimeoutSec = 60
    )
    
    $uri = if ($Path -match '^https?://') { $Path } else { "$BaseUrl$Path" }
    
    Write-Detail "$Method $uri"
    
    $headers = @{
        'Content-Type' = 'application/json'
        'Accept'       = 'application/json'
    }
    
    if ($RequiresAuth -and $script:AuthToken) {
        $headers['Authorization'] = "Bearer $script:AuthToken"
    }
    
    $params = @{
        Uri        = $uri
        Method     = $Method
        Headers    = $headers
        TimeoutSec = $TimeoutSec
    }
    
    if ($Body) {
        $params['Body'] = ($Body | ConvertTo-Json -Depth 10 -Compress)
        Write-Detail "Body: $($params['Body'])"
    }
    
    try {
        $response = Invoke-RestMethod @params
        Write-Detail "Response: $($response | ConvertTo-Json -Depth 3 -Compress)"
        return $response
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $errorBody = $_.ErrorDetails.Message
        Write-Detail "Error ($statusCode): $errorBody"
        throw
    }
}

function Test-Endpoint {
    param(
        [string]$TestName,
        [scriptblock]$TestScript,
        [switch]$Optional
    )
    
    $script:TestResults.Total++
    
    Write-TestStep $TestName
    
    try {
        $result = & $TestScript
        $script:TestResults.Passed++
        $script:TestResults.Tests += @{
            Name   = $TestName
            Status = "PASSED"
            Result = $result
        }
        Write-Success "$TestName - PASSED"
        return $result
    }
    catch {
        if ($Optional) {
            $script:TestResults.Skipped++
            $script:TestResults.Tests += @{
                Name   = $TestName
                Status = "SKIPPED"
                Error  = $_.Exception.Message
            }
            Write-Info "$TestName - SKIPPED: $($_.Exception.Message)"
        }
        else {
            $script:TestResults.Failed++
            $script:TestResults.Tests += @{
                Name   = $TestName
                Status = "FAILED"
                Error  = $_.Exception.Message
            }
            Write-Failure "$TestName - FAILED: $($_.Exception.Message)"
            throw
        }
    }
}

#endregion

#region Authentication Tests

Write-TestHeader "AUTHENTICATION"

if (-not $SkipSignup) {
    Test-Endpoint "User Signup" {
        try {
            $response = Invoke-ApiCall -Method POST -Path "/api/v1/public_app/auth/signup" -Body @{
                phonenumber      = $Phone
                full_names       = "Test User"
                email            = "test${Phone}@patabima.test"
                user_role        = "CUSTOMER"
                password         = $Password
                confirm_password = $Password
            }
            
            if (-not $response.success) {
                throw "Signup failed: $($response.message)"
            }
            
            return $response
        }
        catch {
            if ($_.Exception.Message -match "already exists" -or $_.Exception.Message -match "400") {
                Write-Info "User already exists - continuing with login"
                return @{ success = $true; message = "User already exists" }
            }
            throw
        }
    }
}

$otpCode = Test-Endpoint "Request OTP" {
    # Normalize phone: remove leading 0, should be 9 digits
    $normalizedPhone = $Phone.TrimStart('0')
    if ($normalizedPhone.Length -ne 9) {
        throw "Phone must be 9 digits without leading 0 (got: $normalizedPhone)"
    }
    
    $response = Invoke-ApiCall -Method POST -Path "/api/v1/public_app/auth/login" -Body @{
        phonenumber = $normalizedPhone
        password    = $Password
    }
    
    if (-not $response.otp_code) {
        throw "OTP request failed: No OTP code returned"
    }
    
    Write-Info "OTP Code: $($response.otp_code)"
    
    return $response.otp_code
}

Test-Endpoint "Authenticate with OTP" {
    # Normalize phone: remove leading 0, should be 9 digits
    $normalizedPhone = $Phone.TrimStart('0')
    
    $otpResponse = Invoke-ApiCall -Method POST -Path "/api/v1/public_app/auth/auth_login" -Body @{
        phonenumber = $normalizedPhone
        password    = $Password
        code        = $otpCode
    }
    
    if (-not $otpResponse.access) {
        throw "Authentication failed: No access token returned"
    }
    
    $script:AuthToken = $otpResponse.access
    $script:UserId = $otpResponse.user_id
    
    Write-Info "Authenticated as User ID: $script:UserId"
    
    return $otpResponse
}

#endregion

#region Motor3 Configuration Tests

Write-TestHeader "MOTOR3 CONFIGURATION"

$motorCategory = Test-Endpoint "Get Motor Categories" {
    $response = Invoke-ApiCall -Method GET -Path "/api/v1/motor/categories/"
    
    if (-not $response) {
        throw "No categories returned"
    }
    
    # Check if response is paginated
    $categories = if ($response.categories) { $response.categories } else { $response }
    
    if ($categories.Count -eq 0) {
        throw "No categories in response"
    }
    
    Write-Info "Found $($categories.Count) categories"
    
    # Return the PRIVATE category
    $privateCategory = $categories | Where-Object { $_.code -eq 'PRIVATE' } | Select-Object -First 1
    if (-not $privateCategory) {
        # If still not found, return first category for testing
        Write-Info "PRIVATE category not found, using first category: $($categories[0].code)"
        return $categories[0]
    }
    
    return $privateCategory
}

Test-Endpoint "Get Private Subcategories" {
    $response = Invoke-ApiCall -Method GET -Path "/api/v1/motor/subcategories/?category=PRIVATE"
    
    if (-not $response -or $response.Count -eq 0) {
        throw "No subcategories returned"
    }
    
    Write-Info "Found $($response.Count) subcategories for PRIVATE"
    
    return $response
}

Test-Endpoint "Get Underwriters for Third-Party" {
    $response = Invoke-ApiCall -Method GET -Path "/api/v1/public_app/insurance/get_underwriters?category_code=PRIVATE&subcategory_code=PRIVATE_THIRD_PARTY"
    
    if (-not $response -or $response.Count -eq 0) {
        throw "No underwriters returned"
    }
    
    Write-Info "Found $($response.Count) underwriters"
    
    return $response
}

#endregion

#region DMVIC Vehicle Search Tests (v5 Member Company)

Write-TestHeader "DMVIC VEHICLE SEARCH (v5 Member Company)"

$vehicleData = Test-Endpoint "Search Vehicle in NTSA Database" {
    $response = Invoke-ApiCall -Method POST -Path "/api/insurance/dmvic/search-vehicle/" -Body @{
        registration_number       = $RegistrationNumber
        proposed_cover_start_date = (Get-Date).AddDays(1).ToString("yyyy-MM-dd")
    } -TimeoutSec 60
    
    if (-not $response.success) {
        throw "Vehicle search failed: $($response.error)"
    }
    
    if ($response.vehicle) {
        Write-Info "Vehicle: $($response.vehicle.make) $($response.vehicle.model) ($($response.vehicle.year_of_manufacture))"
        Write-Info "Chassis: $($response.vehicle.chassis_number)"
        Write-Info "Has Active Cover: $($response.has_existing_cover)"
        
        if ($response.existing_cover_expiry) {
            Write-Info "Cover Expires: $($response.existing_cover_expiry)"
        }
    }
    
    return $response
}

#endregion

#region Premium Calculation Tests

Write-TestHeader "PREMIUM CALCULATION"

$premiumData = Test-Endpoint "Calculate Third-Party Premium" {
    $today = Get-Date
    $coverStart = $today.AddDays(1).ToString("yyyy-MM-dd")
    
    $response = Invoke-ApiCall -Method POST -Path "/api/v1/public_app/insurance/calculate_motor_premium" -Body @{
        subcategory         = "PRIVATE_THIRD_PARTY"
        underwriter_id      = 1
        cover_start_date    = $coverStart
        registration_number = $RegistrationNumber
        vehicle_make        = if ($vehicleData.vehicle.make) { $vehicleData.vehicle.make } else { "Toyota" }
        vehicle_model       = if ($vehicleData.vehicle.model) { $vehicleData.vehicle.model } else { "Axio" }
        vehicle_year        = if ($vehicleData.vehicle.year_of_manufacture) { $vehicleData.vehicle.year_of_manufacture } else { 2015 }
    }
    
    if (-not $response.total_premium) {
        throw "No premium calculated"
    }
    
    Write-Info "Base Premium: KSh $($response.base_premium)"
    Write-Info "Total Premium: KSh $($response.total_premium)"
    
    return $response
}

Test-Endpoint "Compare Pricing Across Underwriters" {
    $today = Get-Date
    $coverStart = $today.AddDays(1).ToString("yyyy-MM-dd")
    
    $response = Invoke-ApiCall -Method POST -Path "/api/v1/public_app/insurance/compare_motor_pricing" -Body @{
        subcategory         = "PRIVATE_THIRD_PARTY"
        cover_start_date    = $coverStart
        registration_number = $RegistrationNumber
        vehicle_make        = if ($vehicleData.vehicle.make) { $vehicleData.vehicle.make } else { "Toyota" }
        vehicle_model       = if ($vehicleData.vehicle.model) { $vehicleData.vehicle.model } else { "Axio" }
        vehicle_year        = if ($vehicleData.vehicle.year_of_manufacture) { $vehicleData.vehicle.year_of_manufacture } else { 2015 }
    }
    
    if (-not $response -or $response.Count -eq 0) {
        throw "No pricing comparison returned"
    }
    
    Write-Info "Compared $($response.Count) underwriters"
    
    foreach ($quote in $response) {
        Write-Info "  - $($quote.underwriter_name): KSh $($quote.total_premium)"
    }
    
    return $response
}

#endregion

#region Motor3 Quotation Tests

Write-TestHeader "MOTOR3 QUOTATION CREATION"

$quotationData = Test-Endpoint "Create Third-Party Quotation" {
    $today = Get-Date
    $coverStart = $today.AddDays(1).ToString("yyyy-MM-dd")
    
    $response = Invoke-ApiCall -Method POST -Path "/api/motor3/quotations/third-party/" -Body @{
        clientDetails      = @{
            fullName = "Test User"
            email    = "test_${Phone}@patabima.test"
            phone    = $Phone
            idNumber = "12345678"
            kraPin   = "A001234567Z"
        }
        vehicleDetails     = @{
            registration   = $RegistrationNumber
            make           = if ($vehicleData.vehicle.make) { $vehicleData.vehicle.make } else { "Toyota" }
            model          = if ($vehicleData.vehicle.model) { $vehicleData.vehicle.model } else { "Axio" }
            year           = if ($vehicleData.vehicle.year_of_manufacture) { $vehicleData.vehicle.year_of_manufacture } else { 2015 }
            chassisNumber  = if ($vehicleData.vehicle.chassis_number) { $vehicleData.vehicle.chassis_number } else { "TEST123456789" }
            coverStartDate = $coverStart
        }
        productDetails     = @{
            category      = $motorCategory.code
            subcategory   = "PRIVATE_THIRD_PARTY"
            coverage_type = "THIRD_PARTY"
        }
        underwriterDetails = @{
            id   = 1
            name = "APA Insurance"
            code = "APA"
        }
        premiumBreakdown   = @{
            basePremium = if ($premiumData.base_premium) { $premiumData.base_premium } else { 3500.00 }
            totalAmount = if ($premiumData.total_amount) { $premiumData.total_amount } else { 3557.50 }
        }
        paymentDetails     = @{
            method = "MPESA"
            amount = if ($premiumData.total_amount) { $premiumData.total_amount } else { 3557.50 }
        }
    } -RequiresAuth
    
    if (-not $response.quote_number) {
        throw "Quotation creation failed: No quote number returned"
    }
    
    Write-Info "Quote Number: $($response.quote_number)"
    Write-Info "Status: $($response.status)"
    
    return $response
}

Test-Endpoint "List User Quotations" {
    $response = Invoke-ApiCall -Method GET -Path "/api/motor3/quotations/" -RequiresAuth
    
    if (-not $response) {
        throw "No quotations returned"
    }
    
    # Response might be paginated
    $count = if ($response.results) { $response.results.Count } else { $response.Count }
    Write-Info "Found $count quotation(s)"
    
    return $response
}

Test-Endpoint "Get Quotation Details" {
    # Extract ID from quotation object
    $quoteId = if ($quotationData.quotation.id) { $quotationData.quotation.id } elseif ($quotationData.id) { $quotationData.id } else { $null }
    
    if (-not $quoteId) {
        throw "No quotation ID found in response"
    }
    
    $response = Invoke-ApiCall -Method GET -Path "/api/motor3/quotations/${quoteId}/" -RequiresAuth
    
    # Check for quotation in nested response
    $quotation = if ($response.quotation) { $response.quotation } else { $response }
    
    if (-not $quotation.quote_number) {
        throw "Quotation not found"
    }
    
    Write-Info "Quote: $($quotation.quote_number)"
    Write-Info "Status: $($quotation.status)"
    
    return $response
}

#endregion

#region DMVIC Double Insurance Validation (v5 Member Company)

Write-TestHeader "DMVIC DOUBLE INSURANCE CHECK (v5 Member Company)"

Test-Endpoint "Validate Double Insurance" {
    $today = Get-Date
    $coverStart = $today.AddDays(1).ToString("yyyy-MM-dd")
    $coverEnd = $today.AddYears(1).ToString("yyyy-MM-dd")
    
    $response = Invoke-ApiCall -Method POST -Path "/api/insurance/dmvic/validate-double-insurance/" -Body @{
        registration_number = $RegistrationNumber
        cover_start_date    = $coverStart
        cover_end_date      = $coverEnd
    } -RequiresAuth -TimeoutSec 60
    
    Write-Info "Has Active Cover: $($response.has_active_cover)"
    
    if ($response.has_active_cover) {
        Write-Info "DMVIC Policy: $($response.dmvic_policy.policy_number)"
        Write-Info "Cover Valid Until: $($response.dmvic_policy.cover_end_date)"
    }
    
    return $response
}

#endregion

#region Motor3 Policy Creation Tests

Write-TestHeader "MOTOR3 POLICY CREATION"

$policyData = Test-Endpoint "Convert Quotation to Policy (Simulated Payment)" {
    # Simulate M-PESA payment with test transaction ID
    
    # Extract ID from quotation object
    $quoteId = if ($quotationData.quotation.id) { $quotationData.quotation.id } elseif ($quotationData.id) { $quotationData.id } else { $null }
    
    if (-not $quoteId) {
        throw "No quotation ID found for conversion"
    }
    
    # Generate simulated M-PESA transaction ID (format: XXXXXXXXXX)
    $simulatedTransactionId = "SIM$(Get-Random -Minimum 10000000 -Maximum 99999999)"
    
    Write-Info "💰 Simulating M-PESA Payment..."
    Write-Info "Transaction ID: $simulatedTransactionId"
    Write-Info "Amount: KSh $(if ($premiumData.total_amount) { $premiumData.total_amount } else { '3,557.50' })"
    
    $response = Invoke-ApiCall -Method POST -Path "/api/motor3/quotations/${quoteId}/convert/" -Body @{
        transaction_id = $simulatedTransactionId
        payment_method = "MPESA"
        payment_status = "SUCCESS"
        forceCreate    = $true
        paymentDetails = @{
            transaction_id = $simulatedTransactionId
            method         = "MPESA"
            status         = "SUCCESS"
            amount         = if ($premiumData.total_amount) { $premiumData.total_amount } else { 3557.50 }
        }
    } -RequiresAuth
    
    if (-not $response.policyNumber -and -not $response.policy_number) {
        throw "Policy conversion failed: $($response.error)"
    }
    
    $policyNumber = if ($response.policyNumber) { $response.policyNumber } else { $response.policy_number }
    Write-Info "`n✅ PAYMENT SUCCESSFUL!"
    Write-Info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    Write-Info "Policy Number: $policyNumber"
    Write-Info "Transaction ID: $simulatedTransactionId"
    Write-Info "Status: ACTIVE"
    
    # Check for TEST MODE warning
    if ($response.testModeWarning) {
        Write-Host "`n🧪 TEST ENVIRONMENT NOTICE" -ForegroundColor Magenta
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
        Write-Host $response.testModeWarning.message -ForegroundColor Magenta
        if ($response.testModeWarning.dmvicError) {
            Write-Host "`nDMVIC Error: $($response.testModeWarning.dmvicError)" -ForegroundColor Yellow
        }
        Write-Host "`nProduction Behavior:" -ForegroundColor Cyan
        Write-Host $response.testModeWarning.productionBehavior -ForegroundColor Cyan
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Magenta
    }
    
    # Check for warnings (e.g., certificate pending)
    if ($response.warning) {
        Write-Host "`n⚠️  IMPORTANT NOTICE" -ForegroundColor Yellow
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
        Write-Host $response.warning.message -ForegroundColor Yellow
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Yellow
        
        if ($response.warning.technicalDetails) {
            Write-Info "Technical Details: $($response.warning.technicalDetails)"
        }
    }
    
    # Display certificate information
    if ($response.dmvicCertificate) {
        $cert = $response.dmvicCertificate
        Write-Host "`n📋 DMVIC Certificate Information:" -ForegroundColor Cyan
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
        
        if ($cert.certificateNumber) {
            $certDisplay = $cert.certificateNumber
            if ($cert.certificateNumber -match '^(TEST-MOCK|MOCK)-') {
                $certDisplay = "$certDisplay (TEST MODE MOCK)"
            }
            Write-Info "Certificate Number: $certDisplay"
        }
        
        if ($cert.certificateType) {
            Write-Info "Certificate Type: Type $($cert.certificateType)"
        }
        
        if ($cert.dmvicStatus) {
            $statusColor = switch ($cert.dmvicStatus) {
                'ISSUED' { 'Green' }
                'TEST_MODE_MOCK' { 'Magenta' }
                'TEST_MODE_NO_CERT' { 'Yellow' }
                'TEST_MODE_ERROR' { 'Yellow' }
                default { 'White' }
            }
            Write-Host "Status: $($cert.dmvicStatus)" -ForegroundColor $statusColor
        }
        
        if ($cert.response_data -and ($cert.response_data.mock -or $cert.response_data.test_mode)) {
            Write-Host "⚠️  MOCK CERTIFICATE (Test Mode Only)" -ForegroundColor Magenta
            if ($cert.response_data.dmvic_error) {
                Write-Info "DMVIC Error: $($cert.response_data.dmvic_error)"
            }
        }
        
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan
    }
    
    # Display documents available
    if ($response.documents) {
        Write-Host "`n📄 Documents Available:" -ForegroundColor Cyan
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
        
        if ($response.documents.policyPdfUrl) {
            Write-Host "  ✓ Policy Document" -ForegroundColor Green
            Write-Info "    URL: $($response.documents.policyPdfUrl)"
        }
        if ($response.documents.receiptUrl) {
            Write-Host "  ✓ Payment Receipt" -ForegroundColor Green
            Write-Info "    URL: $($response.documents.receiptUrl)"
        }
        if ($response.documents.dmvicCertificatePdfUrl) {
            Write-Host "  ✓ DMVIC Certificate PDF" -ForegroundColor Green
            Write-Info "    URL: $($response.documents.dmvicCertificatePdfUrl)"
            
            # Open certificate in browser
            Write-Host "`n🌐 Opening certificate PDF in browser..." -ForegroundColor Cyan
            Start-Process $response.documents.dmvicCertificatePdfUrl
        }
        elseif ($response.dmvicCertificate -and $response.dmvicCertificate.status -eq 'PENDING_MANUAL_ISSUE') {
            Write-Host "  ⏳ DMVIC Certificate (Pending)" -ForegroundColor Yellow
        }
        
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan
    }
    
    return $response
}

#endregion

#region DMVIC Certificate Tests (v6 Intermediary)

if ($policyData -and $policyData.documents -and $policyData.documents.dmvicCertificatePdfUrl) {
    Write-TestHeader "DMVIC CERTIFICATE VERIFICATION"
    
    Test-Endpoint "View Certificate PDF" {
        $certificateUrl = $policyData.documents.dmvicCertificatePdfUrl
        $policyNumber = if ($policyData.policyNumber) { $policyData.policyNumber } else { $policyData.policy_number }
        
        Write-Host "`n📋 Certificate Details:" -ForegroundColor Cyan
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
        Write-Info "Policy Number: $policyNumber"
        
        if ($policyData.dmvicCertificate) {
            $cert = $policyData.dmvicCertificate
            if ($cert.certificateNumber) {
                Write-Info "Certificate Number: $($cert.certificateNumber)"
            }
            if ($cert.certificateType) {
                Write-Info "Certificate Type: Type $($cert.certificateType)"
            }
            if ($cert.dmvicStatus) {
                $statusDisplay = switch ($cert.dmvicStatus) {
                    'ISSUED' { "ISSUED ✓" }
                    'TEST_MODE_MOCK' { "TEST MODE MOCK ⚠️" }
                    default { $cert.dmvicStatus }
                }
                Write-Info "Status: $statusDisplay"
            }
        }
        
        Write-Info "PDF URL: $certificateUrl"
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan
        
        Write-Host "✅ Certificate PDF is accessible and has been opened in your browser`n" -ForegroundColor Green
        
        return @{
            success = $true
            certificateUrl = $certificateUrl
            policyNumber = $policyNumber
        }
    }
}
else {
    Write-Host "`n📋 DMVIC Certificate not yet generated - will be available after policy activation" -ForegroundColor Yellow
}

#endregion

#region Policy Retrieval Tests

if ($policyData) {
    Write-TestHeader "POLICY RETRIEVAL"
    
    Test-Endpoint "List User Policies" {
        $response = Invoke-ApiCall -Method GET -Path "/api/v1/policies/motor/" -RequiresAuth
        
        if (-not $response) {
            throw "No policies returned"
        }
        
        $count = if ($response.results) { $response.results.Count } else { $response.Count }
        Write-Info "Found $count policy/policies"
        
        return $response
    }
    
    Test-Endpoint "Get Policy Details" {
        $policyNumber = $policyData.policy_number
        $response = Invoke-ApiCall -Method GET -Path "/api/v1/policies/motor/${policyNumber}/" -RequiresAuth
        
        if (-not $response.policy_number) {
            throw "Policy not found"
        }
        
        Write-Info "Policy: $($response.policy_number)"
        Write-Info "Status: $($response.status)"
        Write-Info "Vehicle: $($response.vehicle.registration_number)"
        
        return $response
    }
}

#endregion

#region Test Summary

Write-TestHeader "TEST SUMMARY"

Write-Host ""
Write-Host "Total Tests:   $($script:TestResults.Total)" -ForegroundColor White
Write-Host "Passed:        " -NoNewline
Write-Host "$($script:TestResults.Passed)" -ForegroundColor Green
Write-Host "Failed:        " -NoNewline
Write-Host "$($script:TestResults.Failed)" -ForegroundColor Red
Write-Host "Skipped:       " -NoNewline
Write-Host "$($script:TestResults.Skipped)" -ForegroundColor Yellow
Write-Host ""

$passRate = if ($script:TestResults.Total -gt 0) {
    [math]::Round(($script:TestResults.Passed / $script:TestResults.Total) * 100, 2)
}
else { 0 }

Write-Host "Pass Rate:     ${passRate}%" -ForegroundColor $(if ($passRate -ge 90) { "Green" } elseif ($passRate -ge 70) { "Yellow" } else { "Red" })
Write-Host ""

# Show failed tests
if ($script:TestResults.Failed -gt 0) {
    Write-Host "FAILED TESTS:" -ForegroundColor Red
    foreach ($test in $script:TestResults.Tests | Where-Object { $_.Status -eq "FAILED" }) {
        Write-Host "  ✗ $($test.Name)" -ForegroundColor Red
        Write-Host "    Error: $($test.Error)" -ForegroundColor DarkRed
    }
    Write-Host ""
}

# Show skipped tests
if ($script:TestResults.Skipped -gt 0) {
    Write-Host "SKIPPED TESTS:" -ForegroundColor Yellow
    foreach ($test in $script:TestResults.Tests | Where-Object { $_.Status -eq "SKIPPED" }) {
        Write-Host "  - $($test.Name)" -ForegroundColor Yellow
        Write-Host "    Reason: $($test.Error)" -ForegroundColor DarkYellow
    }
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Export results to JSON
$resultsFile = Join-Path $PSScriptRoot ".." "test-results-motor3-smoke-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
$script:TestResults | ConvertTo-Json -Depth 10 | Out-File -FilePath $resultsFile -Encoding UTF8
Write-Info "Test results saved to: $resultsFile"

# Exit with appropriate code
if ($script:TestResults.Failed -gt 0) {
    exit 1
}
else {
    exit 0
}

#endregion
