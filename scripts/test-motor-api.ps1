param(
  [string]$BaseUrl = "http://localhost:8000/api/v1/public_app",
  [string]$Phone,
  [string]$Password = "P@ssw0rd!",
  [string]$Underwriter = "APA",
  [string]$CompSub = "PRIVATE_COMPREHENSIVE",
  [string]$TonSub = "COMM_TONNAGE",
  [string]$PsvSub = "PSV_STANDARD",
  [decimal]$SumInsured = 1000000,
  [decimal]$Tonnage = 7.5,
  [int]$PassengerCount = 14,
  [switch]$SkipSignup,
  [switch]$Quiet
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

# Generate random phone if not provided
if (-not $Phone) {
  $Phone = "7" + (Get-Random -Minimum 10000000 -Maximum 99999999)
}

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

# 1) Validate phone
Write-Info "BaseUrl=$BaseUrl"
Write-Info "Phone=$Phone"
if (-not $SkipSignup) {
  try {
    $vp = Invoke-Api -Method POST -Path '/auth/validate_phone' -Body @{ phonenumber = $Phone }
    Write-Ok "Phone available: $($vp.detail)"
  }
  catch {
    Write-Warn "Phone may already be registered; continuing with signup/login."
  }
}

# 2) Signup (if not skipped)
if (-not $SkipSignup) {
  try {
    $signup = Invoke-Api -Method POST -Path '/auth/signup' -Body @{ 
      phonenumber = $Phone; full_names = 'Test User'; email = ''; user_role = 'CUSTOMER'; password = $Password; confirm_password = $Password 
    }
    Write-Ok "Signup success: user_id=$($signup.user_id)"
  }
  catch {
    Write-Warn "Signup failed or user exists; proceeding to login."
  }
}

# 3) Login (request OTP)
$loginResp = Invoke-Api -Method POST -Path '/auth/login' -Body @{ phonenumber = $Phone; password = $Password }
Write-Ok "OTP requested."
$OTP = $loginResp.otp_code
if (-not $OTP) {
  Write-Warn "OTP not returned in body; check server logs. You can enter it now."
  $OTP = Read-Host -Prompt 'Enter OTP code'
}

# 4) Exchange OTP for access token
$auth = Invoke-Api -Method POST -Path '/auth/auth_login' -Body @{ phonenumber = $Phone; password = $Password; code = $OTP }
$ACCESS = $auth.access
if (-not $ACCESS) { throw 'Failed to obtain access token.' }
$global:AuthHeaders = @{ Authorization = "Bearer $ACCESS" }
Write-Ok "Authenticated. Token acquired."

# 5) List resources
$cats = Invoke-Api -Method GET -Path '/insurance/insurance/motor_categories'
Write-Ok ("Categories: " + $cats.categories.Count)
$unds = Invoke-Api -Method GET -Path '/insurance/insurance/underwriters'
Write-Ok ("Underwriters: " + $unds.underwriters.Count)
$factors = Invoke-Api -Method GET -Path '/insurance/insurance/pricing_factors'
Write-Ok ("Factors keys: " + ($factors.factors | Get-Member -MemberType NoteProperty | Select -ExpandProperty Name -ErrorAction SilentlyContinue) -join ',')

# 6) Pricing: Comprehensive
$compReq = @{ subcategory_code = $CompSub; underwriter_code = $Underwriter; sum_insured = $SumInsured; add_ons = @{ excess_protector = $true; pvt = $false; windscreen_value = 50000; radio_value = 10000 } }
$comp = Invoke-Api -Method POST -Path '/insurance/insurance/calculate_motor_premium' -Body $compReq
Write-Ok ("Comprehensive total: " + $comp.total_premium + " (base=" + $comp.base_premium + ")")

# 7) Pricing: Tonnage
$tonReq = @{ subcategory_code = $TonSub; underwriter_code = $Underwriter; tonnage = $Tonnage }
$ton = Invoke-Api -Method POST -Path '/insurance/insurance/calculate_motor_premium' -Body $tonReq
Write-Ok ("Tonnage total: " + $ton.total_premium + " (base=" + $ton.base_premium + ")")

# 8) Pricing: PSV
$psvReq = @{ subcategory_code = $PsvSub; underwriter_code = $Underwriter; passenger_count = $PassengerCount }
$psv = Invoke-Api -Method POST -Path '/insurance/insurance/calculate_motor_premium' -Body $psvReq
Write-Ok ("PSV total: " + $psv.total_premium + " (base=" + $psv.base_premium + ")")

# 9) Compare APA vs JUB
$cmpReq = @{ subcategory_code = $CompSub; underwriter_codes = @('APA', 'JUB'); sum_insured = $SumInsured }
$cmp = Invoke-Api -Method POST -Path '/insurance/insurance/compare_motor_pricing' -Body $cmpReq
Write-Ok ("Comparisons: " + $cmp.comparisons.Count)

# 10) Save a summary to file
$summary = [ordered]@{
  phone         = $Phone
  underwriter   = $Underwriter
  comprehensive = $comp
  tonnage       = $ton
  psv           = $psv
  comparisons   = $cmp
}
$outPath = Join-Path $PSScriptRoot 'last-motor-api-results.json'
$summary | ConvertTo-Json -Depth 10 | Out-File -FilePath $outPath -Encoding UTF8
Write-Ok "Saved results to $outPath"
