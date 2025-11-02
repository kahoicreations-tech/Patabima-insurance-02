# PataBima Project Reorganization Script
# This script moves files to their organized locations

Write-Host "🚀 Starting PataBima Project Reorganization..." -ForegroundColor Cyan
Write-Host ""

# Get root directory
$rootDir = "c:\Users\USER\Desktop\PATABIMA01"
Set-Location $rootDir

# Create directory structure
Write-Host "📁 Creating directory structure..." -ForegroundColor Yellow

$directories = @(
    "docs/api",
    "docs/architecture",
    "docs/deployment",
    "docs/troubleshooting",
    "docs/features",
    "docs/changelog",
    "scripts/diagnostics",
    "scripts/fixes",
    "scripts/tests",
    "scripts/verification",
    "scripts/deployment",
    "scripts/data-migration",
    "deployment/archives",
    "deployment/docker",
    "deployment/nginx",
    "tests/integration/frontend",
    "tests/integration/backend",
    "tests/e2e"
)

foreach ($dir in $directories) {
    $fullPath = Join-Path $rootDir $dir
    if (!(Test-Path $fullPath)) {
        New-Item -ItemType Directory -Force -Path $fullPath | Out-Null
        Write-Host "  ✅ Created: $dir" -ForegroundColor Green
    } else {
        Write-Host "  ⏭️  Exists: $dir" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "📦 Moving diagnostic scripts..." -ForegroundColor Yellow

# Move diagnostic scripts
$diagnosticScripts = @(
    "check_admin_display.py",
    "check_extendible_policies.py",
    "check_extendible_policy.py",
    "check_full_policy.py",
    "check_full_policy_927901.py",
    "check_madison_config.py",
    "check_motor2_fields.py",
    "check_policy_560572.py",
    "check_policy_834912.py",
    "check_policy_927901.py",
    "check_policy_dates.py",
    "check_pricing_discrepancy.py",
    "check_which_extensions.py",
    "show_frontend_data.py",
    "verify_backend_api_data.py",
    "verify_extendible_data.py",
    "verify_extendible_save.py",
    "verify_frontend_will_receive.py",
    "verify_payment_processed.py",
    "test_api_response.py",
    "test_claims_policies_endpoint.py",
    "test_extendible_api.py",
    "test_extendible_filtering.py",
    "test_extensions_api.py",
    "test_extensions_api_direct.py",
    "test_extensions_endpoint.py",
    "test_extensions_endpoint_direct.py",
    "test_extensions_filtering.py",
    "test_policy_extension_eligibility.py",
    "test_underwriter_fetching.py",
    "test_underwriter_http.py"
)

$movedCount = 0
foreach ($script in $diagnosticScripts) {
    $source = Join-Path $rootDir $script
    if (Test-Path $source) {
        Move-Item -Path $source -Destination "scripts/diagnostics/" -Force
        Write-Host "  ✅ Moved: $script" -ForegroundColor Green
        $movedCount++
    }
}
Write-Host "  📊 Moved $movedCount diagnostic scripts" -ForegroundColor Cyan

Write-Host ""
Write-Host "🔧 Moving fix scripts..." -ForegroundColor Yellow

# Move fix scripts
$fixScripts = @(
    "calculate_extendible_levies.py",
    "find_20k_config.py",
    "fix_madison_extendible.py",
    "fix_policy_220820.py",
    "fix_policy_834912.py",
    "fix_policy_927901.py",
    "fix_policy_927901_amounts.py"
)

$movedCount = 0
foreach ($script in $fixScripts) {
    $source = Join-Path $rootDir $script
    if (Test-Path $source) {
        Move-Item -Path $source -Destination "scripts/fixes/" -Force
        Write-Host "  ✅ Moved: $script" -ForegroundColor Green
        $movedCount++
    }
}
Write-Host "  📊 Moved $movedCount fix scripts" -ForegroundColor Cyan

Write-Host ""
Write-Host "🧪 Moving test scripts..." -ForegroundColor Yellow

# Move test scripts
$testScripts = @(
    "test_comprehensive_quote_save.js",
    "test-extendible-backend.js",
    "TEST_DUPLICATE_FETCH_FIX.js"
)

$movedCount = 0
foreach ($script in $testScripts) {
    $source = Join-Path $rootDir $script
    if (Test-Path $source) {
        Move-Item -Path $source -Destination "scripts/tests/" -Force
        Write-Host "  ✅ Moved: $script" -ForegroundColor Green
        $movedCount++
    }
}
Write-Host "  📊 Moved $movedCount test scripts" -ForegroundColor Cyan

Write-Host ""
Write-Host "📝 Moving troubleshooting documentation..." -ForegroundColor Yellow

# Move troubleshooting docs
$troubleshootingDocs = @(
    "BLOCKING_ISSUES_FIXED.md",
    "DUPLICATE_FETCH_FIX.md",
    "KEYBOARD_DISMISSAL_FIX.md",
    "UNDERWRITER_FETCHING_DIAGNOSTIC.md"
)

$movedCount = 0
foreach ($doc in $troubleshootingDocs) {
    $source = Join-Path $rootDir $doc
    if (Test-Path $source) {
        Move-Item -Path $source -Destination "docs/troubleshooting/" -Force
        Write-Host "  ✅ Moved: $doc" -ForegroundColor Green
        $movedCount++
    }
}
Write-Host "  📊 Moved $movedCount troubleshooting docs" -ForegroundColor Cyan

Write-Host ""
Write-Host "📋 Moving feature documentation..." -ForegroundColor Yellow

# Move feature docs
$featureDocs = @(
    "MOTOR2_POLICY_CREATION_FLOW_KENYA.md",
    "MOTOR2_SUBCATEGORY_PRICING_REPORT.md"
)

$movedCount = 0
foreach ($doc in $featureDocs) {
    $source = Join-Path $rootDir $doc
    if (Test-Path $source) {
        Move-Item -Path $source -Destination "docs/features/" -Force
        Write-Host "  ✅ Moved: $doc" -ForegroundColor Green
        $movedCount++
    }
}
Write-Host "  📊 Moved $movedCount feature docs" -ForegroundColor Cyan

Write-Host ""
Write-Host "🚀 Moving deployment documentation..." -ForegroundColor Yellow

# Move deployment docs
$deploymentDocs = @(
    "SDK53_DOWNGRADE_GUIDE.md",
    "QUICK_START.md",
    "EC2_ENDPOINT_HEALTH_REPORT.md",
    "COMPREHENSIVE_FLOW_TEST_RESULTS.md"
)

$movedCount = 0
foreach ($doc in $deploymentDocs) {
    $source = Join-Path $rootDir $doc
    if (Test-Path $source) {
        Move-Item -Path $source -Destination "docs/deployment/" -Force
        Write-Host "  ✅ Moved: $doc" -ForegroundColor Green
        $movedCount++
    }
}
Write-Host "  📊 Moved $movedCount deployment docs" -ForegroundColor Cyan

Write-Host ""
Write-Host "📦 Moving deployment archives..." -ForegroundColor Yellow

# Move deployment archives
$archives = @(
    "deploy-minimal.zip",
    "deploy.tar.gz",
    "insurance-app-deploy-20251021-161411.zip",
    "insurance-app-update.tar.gz"
)

$movedCount = 0
foreach ($archive in $archives) {
    $source = Join-Path $rootDir $archive
    if (Test-Path $source) {
        Move-Item -Path $source -Destination "deployment/archives/" -Force
        Write-Host "  ✅ Moved: $archive" -ForegroundColor Green
        $movedCount++
    }
}
Write-Host "  📊 Moved $movedCount deployment archives" -ForegroundColor Cyan

Write-Host ""
Write-Host "📖 Creating README files..." -ForegroundColor Yellow

# Create README files for new directories
$readmeContent = @{
    "scripts/diagnostics/README.md" = @"
# Diagnostic Scripts

This directory contains scripts used to diagnose issues and inspect data in the PataBima system.

## Script Categories

- `check_*.py` - Scripts to check status or configuration
- `verify_*.py` - Scripts to verify data integrity
- `test_*.py` - Scripts to test API endpoints
- `show_*.py` - Scripts to display data

## Usage

These scripts are typically run directly against the Django database or API:

``````powershell
python scripts/diagnostics/check_policy_dates.py
``````

## Requirements

Most scripts require:
- Django environment configured
- Database access
- Python dependencies from backend/requirements.txt
"@

    "scripts/fixes/README.md" = @"
# Fix Scripts

This directory contains one-time fix scripts used to resolve specific data or configuration issues.

## Usage

These scripts are typically run once to fix a specific issue:

``````powershell
python scripts/fixes/fix_policy_927901.py
``````

## ⚠️ Warning

These scripts modify data. Always:
1. Backup database before running
2. Test on development environment first
3. Review script code before executing
4. Document what was fixed in commit message
"@

    "scripts/tests/README.md" = @"
# Test Scripts

This directory contains standalone test scripts for testing specific functionality.

## Types of Tests

- JavaScript tests (`.js`) - Frontend/API integration tests
- Python tests (`.py`) - Backend API tests

## Running Tests

JavaScript tests:
``````powershell
node scripts/tests/test_comprehensive_quote_save.js
``````

Python tests:
``````powershell
python scripts/tests/test_extendible_backend.py
``````
"@

    "deployment/archives/README.md" = @"
# Deployment Archives

This directory contains archived deployment packages from previous deployments.

## Contents

- `*.zip` - Zipped deployment packages
- `*.tar.gz` - Tarball deployment packages

## Purpose

These archives are kept for:
1. Historical reference
2. Rollback capability (if needed)
3. Comparison with current deployment

## Maintenance

Archives older than 6 months can typically be deleted unless they represent significant milestones.
"@
}

foreach ($path in $readmeContent.Keys) {
    $fullPath = Join-Path $rootDir $path
    Set-Content -Path $fullPath -Value $readmeContent[$path] -Force
    Write-Host "  ✅ Created: $path" -ForegroundColor Green
}

Write-Host ""
Write-Host "✨ Reorganization Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Summary:" -ForegroundColor Cyan
Write-Host "  ✅ Directory structure created" -ForegroundColor Green
Write-Host "  ✅ Diagnostic scripts moved to scripts/diagnostics/" -ForegroundColor Green
Write-Host "  ✅ Fix scripts moved to scripts/fixes/" -ForegroundColor Green
Write-Host "  ✅ Test scripts moved to scripts/tests/" -ForegroundColor Green
Write-Host "  ✅ Documentation organized in docs/" -ForegroundColor Green
Write-Host "  ✅ Deployment archives moved to deployment/archives/" -ForegroundColor Green
Write-Host "  ✅ README files created for new directories" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Review the new structure" -ForegroundColor White
Write-Host "  2. Update any import paths in code" -ForegroundColor White
Write-Host "  3. Update .gitignore if needed" -ForegroundColor White
Write-Host "  4. Commit changes: git add . && git commit -m 'Reorganize project structure'" -ForegroundColor White
Write-Host ""
