# Clean and Reorganize PataBima Project
# This script safely moves temporary files to organized locations

Write-Host "🧹 Clean Reorganization Script" -ForegroundColor Cyan
Write-Host ""

$rootDir = "c:\Users\USER\Desktop\PATABIMA01"
Set-Location $rootDir

# Ensure directories exist
$dirs = @(
    "scripts/diagnostics",
    "scripts/fixes",
    "scripts/tests",
    "docs/troubleshooting",
    "deployment/archives"
)

foreach ($dir in $dirs) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
}

# Function to move files safely (overwrites duplicates)
function Move-FileSafely {
    param(
        [string[]]$Patterns,
        [string]$Destination,
        [string]$Description
    )
    
    $count = 0
    foreach ($pattern in $Patterns) {
        $files = Get-ChildItem -Path $rootDir -File -Filter $pattern -ErrorAction SilentlyContinue
        foreach ($file in $files) {
            $destPath = Join-Path $Destination $file.Name
            if (Test-Path $destPath) {
                Remove-Item $destPath -Force
            }
            Move-Item -Path $file.FullName -Destination $Destination -Force
            $count++
        }
    }
    
    if ($count -gt 0) {
        Write-Host "  ✅ Moved $count $Description" -ForegroundColor Green
    }
}

Write-Host "📦 Moving diagnostic scripts..." -ForegroundColor Yellow
Move-FileSafely -Patterns @("check_*.py", "verify_*.py", "show_*.py", "test_*.py") -Destination "scripts/diagnostics" -Description "diagnostic scripts"

Write-Host "🔧 Moving fix scripts..." -ForegroundColor Yellow
Move-FileSafely -Patterns @("fix_*.py", "find_*.py", "calculate_*.py") -Destination "scripts/fixes" -Description "fix scripts"

Write-Host "🧪 Moving test scripts..." -ForegroundColor Yellow
Move-FileSafely -Patterns @("test_*.js", "TEST_*.js") -Destination "scripts/tests" -Description "test scripts"

Write-Host "📝 Moving troubleshooting docs..." -ForegroundColor Yellow
Move-FileSafely -Patterns @("*ISSUES*.md", "*FIX*.md", "*DIAGNOSTIC*.md") -Destination "docs/troubleshooting" -Description "troubleshooting docs"

Write-Host "📦 Moving deployment archives..." -ForegroundColor Yellow
Move-FileSafely -Patterns @("deploy*.zip", "deploy*.tar.gz", "insurance-app-*.zip", "insurance-app-*.tar.gz") -Destination "deployment/archives" -Description "deployment archives"

Write-Host ""
Write-Host "✅ Reorganization complete!" -ForegroundColor Green
Write-Host ""

# Show summary
Write-Host "Files remaining in root:" -ForegroundColor Cyan
$remaining = Get-ChildItem -Path $rootDir -File | Where-Object { 
    $_.Extension -in '.py', '.js', '.zip', '.gz', '.tar' -and 
    $_.Name -notmatch '^(README|package|docker-compose|Dockerfile)'
}
$remaining | Select-Object Name | Format-Table -AutoSize

$remainingCount = $remaining.Count
Write-Host "Total: $remainingCount files" -ForegroundColor Yellow
