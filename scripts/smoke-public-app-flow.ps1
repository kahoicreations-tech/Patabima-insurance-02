#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Public App (Mobile) Smoke Test

.DESCRIPTION
  Safe smoke test for the mobile/public_app API flow:
  - Health check
  - Auth login (OTP request) + auth_login (JWT)
  - Fetch current user profile
  - Underwriters list
  - Premium calculation
  - Pricing comparison
  - Payment initiate/status using a non-MPESA method (no real STK push)

  This script intentionally does NOT hardcode credentials.
  Provide credentials via parameters or env vars:
    - PB_SMOKE_PHONE
    - PB_SMOKE_PASSWORD

.PARAMETER BaseUrl
  Backend base URL (default: http://localhost:8000)

.PARAMETER Phone
  Agent phone number (Kenyan format starting with 07)

.PARAMETER Password
  Agent password

.PARAMETER ShowDetails
  Print detailed request/response payloads (password/OTP always redacted)

.EXAMPLE
  $env:PB_SMOKE_PHONE = "<your phone>"
  $env:PB_SMOKE_PASSWORD = "<your password>"
  pwsh ./scripts/smoke-public-app-flow.ps1 -BaseUrl http://localhost:8000

.EXAMPLE
  pwsh ./scripts/smoke-public-app-flow.ps1 -BaseUrl http://44.200.182.180 -Phone "<your phone>" -ShowDetails
#>

[CmdletBinding()]
param(
  [string]$BaseUrl = "http://localhost:8000",
  [string]$Phone = $env:PB_SMOKE_PHONE,
  [string]$Password = $env:PB_SMOKE_PASSWORD,
  [switch]$ShowDetails,
  [switch]$TestDocsPipeline,
  [switch]$TestMpesa
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

function Write-Step([string]$msg) { Write-Host "→ $msg" -ForegroundColor Yellow }
function Write-Ok([string]$msg) { Write-Host "✓ $msg" -ForegroundColor Green }
function Write-Warn([string]$msg) { Write-Host "⚠ $msg" -ForegroundColor Yellow }
function Write-Fail([string]$msg) { Write-Host "✗ $msg" -ForegroundColor Red }

function Mask-Json {
  param([string]$json)
  if (-not $json) { return $json }
  $masked = $json
  $masked = $masked -replace '"password"\s*:\s*".*?"', '"password":"***"'
  $masked = $masked -replace '"code"\s*:\s*".*?"', '"code":"***"'
  $masked = $masked -replace '"access"\s*:\s*".*?"', '"access":"***"'
  $masked = $masked -replace '"refresh"\s*:\s*".*?"', '"refresh":"***"'
  return $masked
}

function Invoke-Api {
  param(
    [Parameter(Mandatory=$true)][ValidateSet('GET','POST')][string]$Method,
    [Parameter(Mandatory=$true)][string]$Path,
    [hashtable]$Body,
    [hashtable]$Headers,
    [int]$TimeoutSec = 30
  )

  $uri = if ($Path -match '^https?://') { $Path } else { "$BaseUrl$Path" }

  $h = @{
    'Accept' = 'application/json'
  }
  if ($Headers) {
    foreach ($k in $Headers.Keys) { $h[$k] = $Headers[$k] }
  }

  $params = @{
    Uri = $uri
    Method = $Method
    Headers = $h
    TimeoutSec = $TimeoutSec
  }

  if ($Body) {
    $json = ($Body | ConvertTo-Json -Depth 12 -Compress)
    $params['ContentType'] = 'application/json'
    $params['Body'] = $json
    if ($ShowDetails) {
      Write-Host "  $Method $uri" -ForegroundColor DarkGray
      Write-Host "  Body: $(Mask-Json $json)" -ForegroundColor DarkGray
    }
  } elseif ($ShowDetails) {
    Write-Host "  $Method $uri" -ForegroundColor DarkGray
  }

  try {
    $resp = Invoke-RestMethod @params
    if ($ShowDetails) {
      $respJson = ($resp | ConvertTo-Json -Depth 6 -Compress)
      Write-Host "  Response: $(Mask-Json $respJson)" -ForegroundColor DarkGray
    }
    return $resp
  } catch {
    $statusCode = $null
    try { $statusCode = $_.Exception.Response.StatusCode.value__ } catch {}
    $details = $null
    try { $details = $_.ErrorDetails.Message } catch {}
    if ($ShowDetails) {
      Write-Host "  Error: HTTP $statusCode" -ForegroundColor DarkGray
      if ($details) { Write-Host "  Body: $details" -ForegroundColor DarkGray }
    }
    throw
  }
}

if (-not $Phone) {
  $Phone = Read-Host "Enter agent phone (e.g., 07XXXXXXXX)"
}
if (-not $Password) {
  $securePw = Read-Host "Enter password" -AsSecureString
  $Password = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePw)
  )
}

if (-not $Phone) {
  throw "Phone is required (pass -Phone or set PB_SMOKE_PHONE)"
}
if (-not $Password) {
  throw "Password is required (pass -Password or set PB_SMOKE_PASSWORD)"
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Public App Smoke Test" -ForegroundColor Cyan
Write-Host "  BaseUrl: $BaseUrl" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$script:Failures = @()
function Record-Failure([string]$step, [string]$msg) {
  $script:Failures += @{ step = $step; message = $msg }
}

# 0) Health
Write-Step "Health check"
try {
  $health = Invoke-Api -Method GET -Path "/api/v1/health/" -TimeoutSec 10
  Write-Ok "Health OK"
} catch {
  Record-Failure "Health" $_.Exception.Message
  throw
}

# 1) Request OTP
Write-Step "Auth: request login OTP"
try {
  $loginResp = Invoke-Api -Method POST -Path "/api/v1/public_app/auth/login" -Body @{
    phonenumber = $Phone
    password = $Password
  }
} catch {
  Record-Failure "Auth OTP" $_.Exception.Message
  throw
}
$otp = $loginResp.otp_code
if (-not $otp) {
  throw "Login did not return otp_code (cannot proceed)"
}
Write-Ok "OTP requested"

# 2) Exchange OTP for JWT
Write-Step "Auth: exchange OTP for JWT"
try {
  $authResp = Invoke-Api -Method POST -Path "/api/v1/public_app/auth/auth_login" -Body @{
    phonenumber = $Phone
    password = $Password
    code = $otp
  }
} catch {
  Record-Failure "Auth JWT" $_.Exception.Message
  throw
}
$access = $authResp.access
if (-not $access) {
  throw "Auth login did not return access token"
}
Write-Ok "Authenticated (JWT acquired)"

$authHeaders = @{ Authorization = "Bearer $access" }

# 3) Current user
Write-Step "Fetch current user profile"
try {
  $user = Invoke-Api -Method GET -Path "/api/v1/public_app/user/get_current_user" -Headers $authHeaders
} catch {
  Record-Failure "Profile" $_.Exception.Message
  throw
}
if (-not $user.phonenumber) {
  throw "Profile missing phonenumber"
}
Write-Ok "User profile OK"

# 4) Underwriters
Write-Step "Get underwriters"
try {
  $uw = Invoke-Api -Method GET -Path "/api/v1/public_app/insurance/get_underwriters/" -TimeoutSec 30
} catch {
  Record-Failure "Underwriters" $_.Exception.Message
  throw
}
Write-Ok "Underwriters endpoint OK"

# 5) Premium calculation
Write-Step "Calculate premium (PRIVATE_THIRD_PARTY)"
$today = (Get-Date).ToString('yyyy-MM-dd')
try {
  $premium = Invoke-Api -Method POST -Path "/api/v1/public_app/insurance/calculate_motor_premium/" -Body @{
    category = 'PRIVATE'
    subcategory = 'PRIVATE_THIRD_PARTY'
    cover_start_date = $today
  }
} catch {
  Record-Failure "Premium Calc" $_.Exception.Message
  throw
}
if (-not $premium.premium_breakdown -and -not $premium.premiumBreakdown) {
  Write-Warn "Premium calc response shape unexpected (still got 200)"
}
Write-Ok "Premium calculation OK"

# 6) Compare pricing
Write-Step "Compare pricing"
try {
  $compare = Invoke-Api -Method POST -Path "/api/v1/public_app/insurance/compare_motor_pricing/" -Body @{
    category = 'PRIVATE'
    subcategory = 'PRIVATE_THIRD_PARTY'
    cover_start_date = $today
  }
} catch {
  Record-Failure "Compare Pricing" $_.Exception.Message
  throw
}
Write-Ok "Pricing comparison OK"

# 6.5) Motor3 quotation create (validates strict serializer)
Write-Step "Create Motor3 third-party quotation"
$randomReg = "K" + (Get-Random -Minimum 100 -Maximum 999).ToString() + "A" + (Get-Random -Minimum 10 -Maximum 99).ToString() + "A"
$motor3Body = @{
  quoteId = ""
  clientDetails = @{
    fullName = "Smoke Test Agent"
    phone = $Phone
    email = "smoke-test@example.com"
  }
  vehicleDetails = @{
    registration = $randomReg
    make = "TOYOTA"
    model = "COROLLA"
    year = 2015
    coverStartDate = $today
  }
  productDetails = @{
    category = "PRIVATE"
    subcategory = "PRIVATE_THIRD_PARTY"
    coverage_type = "THIRD_PARTY"
  }
  premiumBreakdown = @{
    total_amount = 10
  }
  paymentDetails = @{
    method = "CARD"
    amount = 10
  }
  addons = @()
  documents = @()
}
try {
  $m3 = Invoke-Api -Method POST -Path "/api/v1/public_app/motor3/quotations/third-party/" -Headers $authHeaders -Body $motor3Body -TimeoutSec 60
  if (-not $m3.success) { throw "Motor3 create did not return success=true" }
  Write-Ok "Motor3 quotation created"
} catch {
  Record-Failure "Motor3 Create" $_.Exception.Message
  throw
}

# 7) Payments (safe: non-MPESA)
if ($TestMpesa) {
  Write-Step "Initiate payment (MPESA - will trigger STK push)"
  $payBody = @{
    amount = 10
    method = 'MPESA'
    phone = $Phone
    account_reference = 'SMOKE-TEST'
  }
} else {
  Write-Step "Initiate payment (non-MPESA safe mode)"
  $payBody = @{
    amount = 10
    method = 'CARD'
    account_reference = 'SMOKE-TEST'
  }
}

try {
  $payInit = Invoke-Api -Method POST -Path "/api/v1/public_app/payments/initiate" -Headers $authHeaders -Body $payBody
} catch {
  Record-Failure "Payment Initiate" $_.Exception.Message
  throw
}
if (-not $payInit.reference) {
  throw "Payment initiation did not return reference"
}
Write-Ok "Payment initiation OK"

Write-Step "Check payment status"
$ref = [System.Uri]::EscapeDataString([string]$payInit.reference)
try {
  $payStatus = Invoke-Api -Method GET -Path "/api/v1/public_app/payments/status?reference=$ref" -Headers $authHeaders
} catch {
  Record-Failure "Payment Status" $_.Exception.Message
  throw
}
if (-not $payStatus.status) {
  throw "Payment status missing status"
}
Write-Ok "Payment status OK"

# 8) Docs pipeline (optional)
if ($TestDocsPipeline) {
  Write-Step "Docs pipeline: presign/submit/status (requires S3 configured)"
  try {
    $presign = Invoke-Api -Method POST -Path "/api/v1/public_app/docs/presign" -Headers $authHeaders -Body @{
      filename = "smoke.jpg"
      mimeType = "image/jpeg"
      sizeBytes = 2048
      docType = "national_id"
    } -TimeoutSec 60
    if (-not $presign.uploadUrl -or -not $presign.objectKey) { throw "Presign did not return uploadUrl/objectKey" }
    $submit = Invoke-Api -Method POST -Path "/api/v1/public_app/docs/submit" -Headers $authHeaders -Body @{
      objectKey = $presign.objectKey
      docType = "national_id"
    } -TimeoutSec 60
    if (-not $submit.jobId) { throw "Submit did not return jobId" }
    $status = Invoke-Api -Method GET -Path ("/api/v1/public_app/docs/status/" + $submit.jobId) -Headers $authHeaders -TimeoutSec 60
    if (-not $status.state) { throw "Status did not return state" }
    Write-Ok "Docs endpoints OK (presign/submit/status)"
  } catch {
    Record-Failure "Docs Pipeline" $_.Exception.Message
    throw
  }
}

# 8) Commissions summary (agent-only)
Write-Step "Fetch commissions summary"
try {
  $summary = Invoke-Api -Method GET -Path "/api/v1/public_app/commissions/summary" -Headers $authHeaders
  Write-Ok "Commissions summary OK"
} catch {
  Write-Warn "Commissions summary failed (user may not be AGENT or endpoint restricted)"
}

Write-Host "" 
Write-Host "========================================" -ForegroundColor Green
Write-Host "✓ SMOKE TEST PASSED" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
