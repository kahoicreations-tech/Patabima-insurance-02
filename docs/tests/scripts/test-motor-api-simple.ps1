#!/usr/bin/env pwsh
# Motor Insurance API Test Script
# Tests signup, login, and all motor insurance endpoints

[CmdletBinding()]
param(
    [string]$BaseUrl,
    [string]$Phone,
    [string]$Password,
    [string]$Underwriter,
    [switch]$SkipSignup,
    [switch]$Quiet
)

# Set defaults
if (!$BaseUrl) { $BaseUrl = "http://localhost:8000/api/v1/public_app" }
if (!$Phone) { $Phone = "7" + (Get-Random -Minimum 10000000 -Maximum 99999999) }
if (!$Password) { $Password = "Best254#" }
if (!$Underwriter) { $Underwriter = "APA" }

$CompSub = "PRIVATE_COMPREHENSIVE"
$TonSub = "COMM_TONNAGE" 
$PsvSub = "PSV_STANDARD"
$SumInsured = 1000000
$Tonnage = 7.5
$PassengerCount = 14

$ErrorActionPreference = 'Stop'

function Write-Info($msg) { if (!$Quiet) { Write-Host "[INFO]  $msg" -ForegroundColor Cyan } }
function Write-Ok($msg) { if (!$Quiet) { Write-Host "[OK]    $msg" -ForegroundColor Green } }
function Write-Warn($msg) { if (!$Quiet) { Write-Host "[WARN]  $msg" -ForegroundColor Yellow } }
function Write-Err($msg) { Write-Host "[ERROR] $msg" -ForegroundColor Red }

$global:AuthHeaders = @{}

function Invoke-Api {
    param([string]$Method, [string]$Path, [object]$Body)
    $uri = if ($Path -match '^https?://') { $Path } else { "$BaseUrl$Path" }
    $params = @{ Method = $Method; Uri = $uri }
    if ($Body) { 
        $params.ContentType = 'application/json'
        $params.Body = ($Body | ConvertTo-Json -Depth 8)
    }
    if ($global:AuthHeaders.Count -gt 0) { $params.Headers = $global:AuthHeaders }
    
    try {
        return Invoke-RestMethod @params
    }
    catch {
        $detail = $_.ErrorDetails.Message
        try {
            $j = $detail | ConvertFrom-Json
            Write-Err "API error at $Method $Path`: $($j | ConvertTo-Json)"
        }
        catch {
            Write-Err "API error at $Method $Path`: $detail"
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

    # 5) List resources
    $cats = Invoke-Api -Method GET -Path '/insurance/insurance/motor_categories'
    Write-Ok "Categories: $($cats.categories.Count)"
    
    $unds = Invoke-Api -Method GET -Path '/insurance/insurance/underwriters'
    Write-Ok "Underwriters: $($unds.underwriters.Count)"
    
    $factors = Invoke-Api -Method GET -Path '/insurance/insurance/pricing_factors'
    Write-Ok "Pricing factors retrieved"

    # 6) Pricing tests
    $compReq = @{
        subcategory_code = $CompSub
        underwriter_code = $Underwriter
        sum_insured      = $SumInsured
        add_ons          = @{
            excess_protector = $true
            pvt              = $false
            windscreen_value = 50000
            radio_value      = 10000
        }
    }
    $comp = Invoke-Api -Method POST -Path '/insurance/insurance/calculate_motor_premium' -Body $compReq
    Write-Ok "Comprehensive total: $($comp.total_premium) (base: $($comp.base_premium))"

    $tonReq = @{ subcategory_code = $TonSub; underwriter_code = $Underwriter; tonnage = $Tonnage }
    $ton = Invoke-Api -Method POST -Path '/insurance/insurance/calculate_motor_premium' -Body $tonReq
    Write-Ok "Tonnage total: $($ton.total_premium) (base: $($ton.base_premium))"

    $psvReq = @{ subcategory_code = $PsvSub; underwriter_code = $Underwriter; passenger_count = $PassengerCount }
    $psv = Invoke-Api -Method POST -Path '/insurance/insurance/calculate_motor_premium' -Body $psvReq
    Write-Ok "PSV total: $($psv.total_premium) (base: $($psv.base_premium))"

    # 7) Compare pricing
    $cmpReq = @{ subcategory_code = $CompSub; underwriter_codes = @('APA', 'JUB'); sum_insured = $SumInsured }
    $cmp = Invoke-Api -Method POST -Path '/insurance/insurance/compare_motor_pricing' -Body $cmpReq
    Write-Ok "Comparisons: $($cmp.comparisons.Count)"

    # 8) Save results
    $summary = @{
        phone         = $Phone
        underwriter   = $Underwriter
        comprehensive = $comp
        tonnage       = $ton
        psv           = $psv
        comparisons   = $cmp
    }
    
    $outPath = Join-Path $PSScriptRoot 'last-motor-api-results.json'
    $summary | ConvertTo-Json -Depth 10 | Out-File -FilePath $outPath -Encoding UTF8
    Write-Ok "Results saved to: $outPath"

}
catch {
    Write-Err "Script failed: $($_.Exception.Message)"
    exit 1
}