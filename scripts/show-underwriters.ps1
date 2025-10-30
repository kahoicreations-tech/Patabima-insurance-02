#!/usr/bin/env pwsh
# Show Underwriters (auth + print names)

[CmdletBinding()]
param(
    [string]$BaseUrl = "http://localhost:8000/api/v1/public_app",
    [string]$Phone,
    [string]$Password = "P@ssw0rd!",
    [switch]$SkipSignup,
    [switch]$Quiet,
    [switch]$Json
)

if (-not $Phone) {
    $Phone = "7" + (Get-Random -Minimum 10000000 -Maximum 99999999)
}

$ErrorActionPreference = 'Stop'

function Write-Info($msg) { if (-not $Quiet) { Write-Host "[INFO]  $msg" -ForegroundColor Cyan } }
function Write-Ok($msg) { if (-not $Quiet) { Write-Host "[OK]    $msg" -ForegroundColor Green } }
function Write-Warn($msg) { if (-not $Quiet) { Write-Host "[WARN]  $msg" -ForegroundColor Yellow } }
function Write-Err($msg) { Write-Host "[ERROR] $msg" -ForegroundColor Red }

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
            Write-Err ("API error at $Method ${Path}: " + ($j | ConvertTo-Json -Depth 8))
        }
        catch {
            Write-Err ("API error at $Method ${Path}: $detail")
        }
        throw
    }
}

try {
    Write-Info "BaseUrl: $BaseUrl"
    Write-Info "Phone: $Phone"

    if (!$SkipSignup) {
        try {
            $vp = Invoke-Api -Method POST -Path '/auth/validate_phone' -Body @{ phonenumber = $Phone }
            Write-Ok "Phone available: $($vp.detail)"
        }
        catch {
            Write-Warn "Phone may already be registered; continuing..."
        }
    }

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

    $loginResp = Invoke-Api -Method POST -Path '/auth/login' -Body @{ phonenumber = $Phone; password = $Password }
    Write-Ok "OTP requested"
    $OTP = $loginResp.otp_code
    if (!$OTP) {
        Write-Warn "OTP not returned; enter manually if required"
        $OTP = Read-Host -Prompt 'Enter OTP code'
    }

    $auth = Invoke-Api -Method POST -Path '/auth/auth_login' -Body @{ phonenumber = $Phone; password = $Password; code = $OTP }
    $ACCESS = $auth.access
    if (!$ACCESS) { throw 'Failed to obtain access token' }
    $global:AuthHeaders = @{ Authorization = "Bearer $ACCESS" }
    Write-Ok "Authenticated successfully"

    $unds = Invoke-Api -Method GET -Path '/insurance/insurance/underwriters'
    $list = $unds.underwriters

    if ($Json) {
        $list | ConvertTo-Json -Depth 8
        return
    }

    if (-not $list) {
        Write-Host "Underwriters: 0"
        return
    }

    Write-Host ("Underwriters ({0}):" -f $list.Count)
    foreach ($u in $list) {
        $name = $u.name
        $code = $u.code
        if ($code) { Write-Host (" - {0} [{1}]" -f $name, $code) } else { Write-Host (" - {0}" -f $name) }
    }

    # Save last result for quick reference
    $outPath = Join-Path $PSScriptRoot 'last-underwriters.json'
    @{ phone = $Phone; underwriters = $list } | ConvertTo-Json -Depth 8 | Out-File -FilePath $outPath -Encoding UTF8
    Write-Ok "Saved: $outPath"

}
catch {
    Write-Err "Failed: $($_.Exception.Message)"
    exit 1
}
