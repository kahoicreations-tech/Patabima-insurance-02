#!/usr/bin/env pwsh
[CmdletBinding()]
param(
  [string]$Base = 'http://127.0.0.1:8000',
  [ValidateSet('PRIVATE', 'COMMERCIAL', 'PSV', 'MOTORCYCLE', 'TUKTUK', 'SPECIAL')]
  [string]$Category = 'PRIVATE',
  [string]$SubcategoryCode = 'PRIVATE_THIRD_PARTY',
  [string]$CoverType = 'THIRD_PARTY',
  [string]$VehicleMake = 'Toyota',
  [string]$VehicleModel = 'Axio',
  [int]$VehicleYear = 2020,
  [string]$Registration = 'KCA123A',
  [int]$DurationDays = 365,
  [int]$SumInsured = 1000000,
  [switch]$Json,
  [switch]$ShowEndpoints
)

$ErrorActionPreference = 'Stop'

function Out-Obj($label, $obj) {
  if ($Json) { $obj | ConvertTo-Json -Depth 8; return }
  Write-Host "==== $label ====" -ForegroundColor Cyan
  if ($obj -is [string]) { Write-Host $obj; return }
  try { $obj | ConvertTo-Json -Depth 6 } catch { $obj | Out-String }
}

function GET($path) {
  $uri = if ($path -match '^https?://') { $path } else { "$Base$path" }
  if ($ShowEndpoints) { Write-Host ("→ GET  {0}" -f $uri) -ForegroundColor DarkGray }
  return Invoke-RestMethod -Uri $uri -Method GET
}
function POST($path, $body) {
  $uri = if ($path -match '^https?://') { $path } else { "$Base$path" }
  if ($ShowEndpoints) { Write-Host ("→ POST {0}" -f $uri) -ForegroundColor DarkGray }
  return Invoke-RestMethod -Uri $uri -Method POST -ContentType 'application/json' -Body ($body | ConvertTo-Json -Depth 8 -Compress)
}

try {
  # 1) Motor2 discovery
  $cats = GET '/api/v1/motor/categories/'
  Out-Obj 'Categories' $cats
  if (-not $Json) {
    $catCount = $cats.total_count
    if (-not $catCount -and $cats.categories) { $catCount = $cats.categories.Count }
    Write-Host ("Categories found: {0}" -f $catCount) -ForegroundColor Yellow
  }

  $subs = GET ("/api/v1/motor/subcategories/?category=$Category")
  Out-Obj 'Subcategories' $subs
  if (-not $Json) {
    $subCount = $subs.total_count
    if (-not $subCount -and $subs.subcategories) { $subCount = $subs.subcategories.Count }

    # Strict filtering: only show subcategories relevant to the selected Category.
    $items = @()
    if ($subs.subcategories) { $items = @($subs.subcategories) }

    # Basic category-prefix filter (e.g., PRIVATE_, COMMERCIAL_, PSV_, TUKTUK_, SPECIAL_, MOTORCYCLE_)
    $prefix = "$Category".ToUpper() + '_'
    $byPrefix = $items | Where-Object { $_.subcategory_code -and ($_.subcategory_code.ToUpper().StartsWith($prefix)) }

    # Curated allowlist for PRIVATE from Motor Vehicle categories fields.md
    $allow = @{
      'PRIVATE' = @('PRIVATE_TOR', 'PRIVATE_THIRD_PARTY', 'PRIVATE_THIRD_PARTY_EXT', 'PRIVATE_MOTORCYCLE_TP', 'PRIVATE_COMPREHENSIVE')
    }
    $filtered = $byPrefix
    if ($allow.ContainsKey($Category)) {
      $set = [System.Collections.Generic.HashSet[string]]::new([string[]]$allow[$Category])
      $filtered = $byPrefix | Where-Object { $set.Contains( ($_.subcategory_code + '') ) }
    }

    $hasChosen = $false
    if ($filtered) {
      $hasChosen = $filtered | Where-Object { $_.subcategory_code -eq $SubcategoryCode } | ForEach-Object { $true } | Select-Object -First 1
    }

    $filteredCount = ($filtered | Measure-Object).Count
    Write-Host ("Subcategories for {0}: {1} → filtered: {2} (contains '{3}': {4})" -f $Category, $subCount, $filteredCount, $SubcategoryCode, ($hasChosen -as [bool])) -ForegroundColor Yellow

    if ($subCount -gt $filteredCount) {
      # Show which were kept (concise)
      $kept = ($filtered | Select-Object -ExpandProperty subcategory_code)
      Write-Host ("Kept: {0}" -f (($kept -join ', '))) -ForegroundColor DarkYellow
    }

    # Print a few example items to show fields from the filtered list
    if ($filtered) {
      $take = ($filtered | Select-Object -First 5)
      Write-Host "Examples (code | name | cover_type | pricing_model | has_fixed_premium | base_premium)" -ForegroundColor DarkYellow
      foreach ($it in $take) {
        Write-Host (" - {0} | {1} | {2} | {3} | {4} | {5}" -f $it.subcategory_code, $it.subcategory_name, $it.cover_type, $it.pricing_model, $it.has_fixed_premium, ($it.base_premium -as [string])) -ForegroundColor Gray
      }
    }
  }

  $covers = GET ("/api/v1/motor/cover-types/?category=$Category")
  Out-Obj 'Cover Types' $covers
  if (-not $Json) {
    $coverCount = if ($covers.cover_types) { $covers.cover_types.Count } else { 0 }
    Write-Host ("Cover types for {0}: {1}" -f $Category, $coverCount) -ForegroundColor Yellow
    if ($covers.cover_types) {
      $takeCT = ($covers.cover_types | Select-Object -First 5)
      Write-Host "Examples (code | cover_type | has_fixed_premium | requires_sum_insured | min_sum_insured | max_sum_insured)" -ForegroundColor DarkYellow
      foreach ($ct in $takeCT) {
        Write-Host (" - {0} | {1} | {2} | {3} | {4} | {5}" -f $ct.code, $ct.cover_type, $ct.has_fixed_premium, $ct.requires_sum_insured, $ct.min_sum_insured, $ct.max_sum_insured) -ForegroundColor Gray
      }
    }
  }

  # NOTE: cover_type should be the cover type (e.g., COMPREHENSIVE), not the subcategory code
  $fields = GET ("/api/v1/motor/field-requirements/?category=$Category&subcategory_code=$SubcategoryCode&cover_type=$CoverType")
  Out-Obj 'Field Requirements' $fields
  if (-not $Json) {
    $coreFields = $fields.field_requirements.core_fields.PSObject.Properties.Name
    $coverFields = $fields.field_requirements.cover_type_fields.PSObject.Properties.Name
    Write-Host ("Core fields: {0}" -f ($coreFields -join ', ')) -ForegroundColor Yellow
    if ($coverFields) { Write-Host ("Cover-type fields: {0}" -f ($coverFields -join ', ')) -ForegroundColor Yellow }
  }

  # 2) Addons (public)
  $addons = GET ("/api/v1/public_app/insurance/addons?category=$Category&subcategory_code=$SubcategoryCode")
  Out-Obj 'Addons' $addons
  if (-not $Json) {
    $addonIds = @()
    if ($addons.addons) { $addonIds = $addons.addons | ForEach-Object { $_.id } }
    if ($addonIds.Count -gt 0) { Write-Host ("Available addons: {0}" -f ($addonIds -join ', ')) -ForegroundColor Yellow }
  }

  # 3) Calculate
  $calcBody = @{ category = $Category; subcategory_code = $SubcategoryCode; cover_type = $CoverType; vehicle_make = $VehicleMake; vehicle_model = $VehicleModel; vehicle_year = $VehicleYear; duration_days = $DurationDays }
  if ($CoverType -eq 'COMPREHENSIVE' -or $SumInsured -gt 0) {
    # Include both common keys some backends accept
    $calcBody.sum_insured = $SumInsured
    $calcBody.vehicle_valuation = $SumInsured
  }
  $calc = POST '/api/v1/public_app/insurance/calculate_motor_premium' $calcBody
  Out-Obj 'Calculate Premium' $calc
  if (-not $Json) {
    $bp = $calc.base_premium
    if (-not $bp -and $calc.premium_breakdown) { $bp = $calc.premium_breakdown.base_premium }
    $itl = if ($calc.premium_breakdown) { $calc.premium_breakdown.training_levy } else { $null }
    $pcf = if ($calc.premium_breakdown) { $calc.premium_breakdown.pcf_levy } else { $null }
    $sd = if ($calc.premium_breakdown) { $calc.premium_breakdown.stamp_duty } else { $null }
    $tot = $calc.total_premium
    if (-not $tot -and $calc.premium_breakdown) { $tot = $calc.premium_breakdown.total_premium }
    $si = if ($calc.sum_insured) { $calc.sum_insured } else { $SumInsured }
    Write-Host ("Sum Insured: {0:N0}" -f $si) -ForegroundColor Yellow
    Write-Host ("Base Premium: {0:N2}" -f $bp) -ForegroundColor Yellow
    if ($null -ne $itl -and $null -ne $pcf -and $null -ne $sd) {
      Write-Host ("Levies: ITL {0:N2} + PCF {1:N2} + Stamp {2:N2}" -f $itl, $pcf, $sd) -ForegroundColor Yellow
    }
    Write-Host ("Total Premium: {0:N2}" -f $tot) -ForegroundColor Green
  }

  # 4) Underwriters discovery
  $uw = GET ("/api/v1/public_app/insurance/get_underwriters?category_code=$Category&subcategory_code=$SubcategoryCode")
  Out-Obj 'Underwriters' $uw
  if (-not $Json) {
    $uwCount = if ($uw.count) { $uw.count } elseif ($uw.underwriters) { $uw.underwriters.Count } else { 0 }
    $codes = @()
    if ($uw.underwriters) { $codes = $uw.underwriters | ForEach-Object { $_.code } }
    Write-Host ("Underwriters available: {0} [{1}]" -f $uwCount, ($codes -join ', ')) -ForegroundColor Yellow
  }

  # 5) Compare
  $cmpBody = @{ category = $Category; subcategory_code = $SubcategoryCode; cover_type = $CoverType; vehicle_make = $VehicleMake; vehicle_model = $VehicleModel; vehicle_year = $VehicleYear; registration_number = $Registration }
  if ($CoverType -eq 'COMPREHENSIVE' -or $SumInsured -gt 0) {
    $cmpBody.sum_insured = $SumInsured
    $cmpBody.vehicle_valuation = $SumInsured
  }
  $cmp = POST '/api/v1/public_app/insurance/compare_motor_pricing' $cmpBody
  Out-Obj 'Compare Pricing' $cmp
  if (-not $Json) {
    $rows = @()
    if ($cmp.comparisons) {
      foreach ($c in $cmp.comparisons) {
        $uwc = $c.underwriter_code
        $bp = $c.result.premium_breakdown.base_premium
        if (-not $bp) { $bp = $c.result.base_premium }
        $tot = $c.result.premium_breakdown.total_premium
        if (-not $tot) { $tot = $c.result.total_premium }
        $rows += [PSCustomObject]@{ underwriter = $uwc; base = [decimal]$bp; total = [decimal]$tot }
      }
      $i = 1
      Write-Host "Underwriter ranking (by total):" -ForegroundColor Yellow
      foreach ($r in ($rows | Sort-Object total, base)) {
        Write-Host ("{0}) {1,-8}  Base={2,10:N2}  Total={3,10:N2}" -f $i, $r.underwriter, $r.base, $r.total) -ForegroundColor Green
        $i++
      }
    }
  }

  # 6) Quotation create (public submit)
  $quoteBody = @{ vehicle_make = $VehicleMake; vehicle_model = $VehicleModel; vehicle_year = $VehicleYear; vehicle_registration = $Registration; cover_type = $CoverType; owner_name = 'Test User'; owner_id_number = '12345678'; owner_phone = '0712345678'; cover_start_date = (Get-Date).ToString('yyyy-MM-dd') }
  if ($CoverType -eq 'COMPREHENSIVE' -or $SumInsured -gt 0) {
    $quoteBody.sum_insured = $SumInsured
    $quoteBody.vehicle_valuation = $SumInsured
  }
  $q = POST '/api/v1/public_app/insurance/submit_motor_quotation' $quoteBody
  Out-Obj 'Submit Motor Quotation' $q
  if (-not $Json) {
    $qid = $q.quotation.quote_id
    $qst = $q.quotation.status
    Write-Host ("Quotation: {0}  Status: {1}" -f $qid, $qst) -ForegroundColor Yellow
  }

}
catch {
  Write-Host "[ERROR] $($_.Exception.Message)" -ForegroundColor Red
  if ($_.ErrorDetails.Message) { Write-Host $_.ErrorDetails.Message }
  exit 1
}
