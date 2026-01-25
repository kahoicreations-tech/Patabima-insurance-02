# Motor 2 Pricing Population - Complete Setup Script
# ==================================================
# This script:
# 1. Activates Python virtual environment
# 2. Runs Django migrations
# 3. Populates underwriter pricing for all Motor 2 subcategories
#
# Usage: .\scripts\setup_motor2_pricing.ps1

$ErrorActionPreference = "Stop"

Write-Host "=" -ForegroundColor Cyan -NoNewline
Write-Host ("=" * 69) -ForegroundColor Cyan
Write-Host "MOTOR 2 PRICING SETUP - Complete Pipeline" -ForegroundColor Cyan
Write-Host "=" -ForegroundColor Cyan -NoNewline
Write-Host ("=" * 69) -ForegroundColor Cyan
Write-Host ""

# Get project root (parent of scripts directory)
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$BackendDir = Join-Path $ProjectRoot "insurance-app"
$VenvPath = Join-Path $ProjectRoot ".venv"

Write-Host "Project Root: $ProjectRoot" -ForegroundColor Gray
Write-Host "Backend Dir:  $BackendDir" -ForegroundColor Gray
Write-Host "Venv Path:    $VenvPath" -ForegroundColor Gray
Write-Host ""

# Step 1: Check Python environment
Write-Host "STEP 1: Checking Python Environment" -ForegroundColor Yellow
Write-Host ("-" * 70) -ForegroundColor Gray

# Check if virtual environment exists
if (-Not (Test-Path $VenvPath)) {
    Write-Host "❌ Virtual environment not found at: $VenvPath" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please create virtual environment first:" -ForegroundColor Yellow
    Write-Host "  python -m venv .venv" -ForegroundColor Cyan
    Write-Host "  .\.venv\Scripts\Activate.ps1" -ForegroundColor Cyan
    Write-Host "  pip install -r insurance-app\requirements.txt" -ForegroundColor Cyan
    exit 1
}

# Check if virtual environment is already activated
$VenvActive = $env:VIRTUAL_ENV -ne $null

if ($VenvActive) {
    Write-Host "✓ Virtual environment already activated: $env:VIRTUAL_ENV" -ForegroundColor Green
}
else {
    Write-Host "⚠️  Virtual environment not activated" -ForegroundColor Yellow
    Write-Host "Please run this script with venv activated:" -ForegroundColor Yellow
    Write-Host "  .\.venv\Scripts\Activate.ps1" -ForegroundColor Cyan
    Write-Host "  .\scripts\setup_motor2_pricing.ps1" -ForegroundColor Cyan
    exit 1
}

Write-Host ""

# Step 2: Navigate to backend directory
Write-Host "STEP 2: Navigating to Backend Directory" -ForegroundColor Yellow
Write-Host ("-" * 70) -ForegroundColor Gray

if (-Not (Test-Path $BackendDir)) {
    Write-Host "❌ Backend directory not found: $BackendDir" -ForegroundColor Red
    exit 1
}

Set-Location $BackendDir
Write-Host "✓ Changed directory to: $BackendDir" -ForegroundColor Green
Write-Host ""

# Step 3: Check Django installation
Write-Host "STEP 3: Verifying Django Installation" -ForegroundColor Yellow
Write-Host ("-" * 70) -ForegroundColor Gray

python -c "import django; print(f'Django {django.get_version()}')" 2>$null

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Django is not installed in the virtual environment" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install dependencies:" -ForegroundColor Yellow
    Write-Host "  pip install -r requirements.txt" -ForegroundColor Cyan
    exit 1
}

Write-Host "✓ Django is installed" -ForegroundColor Green
Write-Host ""

# Step 4: Run migrations
Write-Host "STEP 4: Running Database Migrations" -ForegroundColor Yellow
Write-Host ("-" * 70) -ForegroundColor Gray

Write-Host "Creating new migrations (if needed)..." -ForegroundColor Cyan
python manage.py makemigrations

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Warning: makemigrations completed with warnings" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Applying migrations to database..." -ForegroundColor Cyan
python manage.py migrate

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Migration failed" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Migrations completed successfully" -ForegroundColor Green
Write-Host ""

# Step 5: Populate pricing data
Write-Host "STEP 5: Populating Underwriter Pricing Data" -ForegroundColor Yellow
Write-Host ("-" * 70) -ForegroundColor Gray

$PricingScript = Join-Path $ProjectRoot "scripts\populate_motor2_pricing.py"

if (-Not (Test-Path $PricingScript)) {
    Write-Host "❌ Pricing script not found: $PricingScript" -ForegroundColor Red
    exit 1
}

Write-Host "Executing pricing population script..." -ForegroundColor Cyan
Write-Host ""

# Run the pricing script
python -c "exec(open('$PricingScript').read())"

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Pricing population failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✓ Pricing data populated successfully" -ForegroundColor Green
Write-Host ""

# Step 6: Verify pricing data
Write-Host "STEP 6: Verifying Pricing Data" -ForegroundColor Yellow
Write-Host ("-" * 70) -ForegroundColor Gray

$VerifyScript = @"
from app.models import MotorPricing, CommercialTonnagePricing, PSVPLLPricing, InsuranceProvider, MotorSubcategory

# Count records
fixed_count = MotorPricing.objects.count()
tonnage_count = CommercialTonnagePricing.objects.count()
passenger_count = PSVPLLPricing.objects.count()
underwriter_count = InsuranceProvider.objects.filter(supported_categories__contains=['MOTOR']).count()
subcategory_count = MotorSubcategory.objects.filter(is_active=True).count()

print(f'Underwriters: {underwriter_count}')
print(f'Subcategories: {subcategory_count}')
print(f'Fixed/Bracket Pricing: {fixed_count}')
print(f'Tonnage Pricing: {tonnage_count}')
print(f'Passenger Pricing: {passenger_count}')
print(f'Total Records: {fixed_count + tonnage_count + passenger_count}')
"@

python -c $VerifyScript

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Warning: Verification script encountered issues" -ForegroundColor Yellow
}
else {
    Write-Host "✓ Verification complete" -ForegroundColor Green
}

Write-Host ""

# Final summary
Write-Host "=" -ForegroundColor Green -NoNewline
Write-Host ("=" * 69) -ForegroundColor Green
Write-Host "🎉 SETUP COMPLETE!" -ForegroundColor Green
Write-Host "=" -ForegroundColor Green -NoNewline
Write-Host ("=" * 69) -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Start Django server: python manage.py runserver" -ForegroundColor White
Write-Host "  2. Test Motor 2 flow in the frontend app" -ForegroundColor White
Write-Host "  3. Verify underwriter pricing appears correctly" -ForegroundColor White
Write-Host ""
Write-Host "API Endpoints to Test:" -ForegroundColor Cyan
Write-Host "  GET  http://localhost:8000/api/motor2/categories/" -ForegroundColor White
Write-Host "  GET  http://localhost:8000/api/motor2/subcategories/?category=PRIVATE" -ForegroundColor White
Write-Host "  POST http://localhost:8000/api/motor2/pricing/compare/" -ForegroundColor White
Write-Host ""

# Return to project root
Set-Location $ProjectRoot
