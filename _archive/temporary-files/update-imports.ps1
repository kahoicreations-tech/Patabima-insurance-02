# PowerShell script to update import paths in React Native project
# This script updates all import paths from '../services' to '../../shared/services'

$frontendPath = "frontend"
$filesToUpdate = @()

# Find all JavaScript/TypeScript files in frontend directory
$jsFiles = Get-ChildItem -Path $frontendPath -Include "*.js", "*.jsx", "*.ts", "*.tsx" -Recurse

foreach ($file in $jsFiles) {
    $content = Get-Content $file.FullName -Raw
    $updated = $false
    
    # Replace import paths
    if ($content -match "from\s+['\`]\.\.\/services") {
        $content = $content -replace "from\s+(['\`])\.\.\/services", "from `$1../../shared/services"
        $updated = $true
    }
    
    if ($content -match "from\s+['\`]\.\.\/\.\.\/services") {
        $content = $content -replace "from\s+(['\`])\.\.\/\.\.\/services", "from `$1../../../shared/services"
        $updated = $true
    }
    
    if ($content -match "from\s+['\`]\.\.\/\.\.\/\.\.\/services") {
        $content = $content -replace "from\s+(['\`])\.\.\/\.\.\/\.\.\/services", "from `$1../../../../shared/services"
        $updated = $true
    }
    
    if ($updated) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Updated: $($file.FullName)"
        $filesToUpdate += $file.FullName
    }
}

Write-Host "Import path updates completed!"
Write-Host "Files updated: $($filesToUpdate.Count)"
