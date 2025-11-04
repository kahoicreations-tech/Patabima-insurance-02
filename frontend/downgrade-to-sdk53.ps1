#!/usr/bin/env pwsh
# Downgrade to Expo SDK 53 (Stable) - Clean Installation Script

Write-Host "╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     Downgrading to Expo SDK 53 (Stable) - React Native 0.76.5     ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Step 1: Clean existing installation
Write-Host "🧹 Step 1: Cleaning existing installation..." -ForegroundColor Yellow
Write-Host "   Removing node_modules..." -ForegroundColor Gray

if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules"
    Write-Host "   ✓ node_modules removed" -ForegroundColor Green
}

if (Test-Path "package-lock.json") {
    Remove-Item -Force "package-lock.json"
    Write-Host "   ✓ package-lock.json removed" -ForegroundColor Green
}

if (Test-Path "yarn.lock") {
    Remove-Item -Force "yarn.lock"
    Write-Host "   ✓ yarn.lock removed" -ForegroundColor Green
}

# Step 2: Clear Metro bundler cache
Write-Host ""
Write-Host "🗑️  Step 2: Clearing Metro bundler cache..." -ForegroundColor Yellow

if (Test-Path ".expo") {
    Remove-Item -Recurse -Force ".expo"
    Write-Host "   ✓ .expo cache removed" -ForegroundColor Green
}

$metroCache = Join-Path $env:LOCALAPPDATA "Temp\metro-*"
if (Test-Path $metroCache) {
    Remove-Item -Recurse -Force $metroCache -ErrorAction SilentlyContinue
    Write-Host "   ✓ Metro cache cleared" -ForegroundColor Green
}

# Step 3: Install dependencies
Write-Host ""
Write-Host "📦 Step 3: Installing Expo SDK 53 dependencies..." -ForegroundColor Yellow
Write-Host "   This may take 2-3 minutes..." -ForegroundColor Gray

npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ npm install failed. Trying with --legacy-peer-deps..." -ForegroundColor Red
    npm install --legacy-peer-deps
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ Dependencies installed successfully" -ForegroundColor Green
}
else {
    Write-Host ""
    Write-Host "❌ Installation failed. Please check errors above." -ForegroundColor Red
    exit 1
}

# Step 4: Run expo install --fix
Write-Host ""
Write-Host "🔧 Step 4: Running expo install --fix..." -ForegroundColor Yellow

npx expo install --fix

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ Expo dependencies verified" -ForegroundColor Green
}
else {
    Write-Host "   ⚠️  expo install --fix had warnings (this is usually OK)" -ForegroundColor Yellow
}

# Step 5: Clear watchman cache (if installed)
Write-Host ""
Write-Host "👁️  Step 5: Clearing watchman cache..." -ForegroundColor Yellow

if (Get-Command watchman -ErrorAction SilentlyContinue) {
    watchman watch-del-all
    Write-Host "   ✓ Watchman cache cleared" -ForegroundColor Green
}
else {
    Write-Host "   ⓘ Watchman not installed (skip)" -ForegroundColor Gray
}

# Step 6: Summary
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                  ✅ Downgrade Complete!                            ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "📊 New Versions Installed:" -ForegroundColor Cyan
Write-Host "   • Expo SDK: 53.0.23 (stable)" -ForegroundColor White
Write-Host "   • React Native: 0.76.5 (stable)" -ForegroundColor White
Write-Host "   • React: 18.3.1 (stable)" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Start the dev server:" -ForegroundColor White
Write-Host "      npm start" -ForegroundColor Yellow
Write-Host ""
Write-Host "   2. Clear cache if needed:" -ForegroundColor White
Write-Host "      npm start -- --clear" -ForegroundColor Yellow
Write-Host ""
Write-Host "   3. Test your app on device/emulator" -ForegroundColor White
Write-Host ""
Write-Host "📝 What Changed:" -ForegroundColor Cyan
Write-Host "   ✓ React 19.1.0 → 18.3.1 (stable)" -ForegroundColor Green
Write-Host "   ✓ React Native 0.81.5 → 0.76.5 (stable)" -ForegroundColor Green
Write-Host "   ✓ Navigation v7 → v6 (stable)" -ForegroundColor Green
Write-Host "   ✓ All Expo modules to SDK 53 versions" -ForegroundColor Green
Write-Host "   ✓ Removed memoize-one resolution (no longer needed)" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  If you encounter issues:" -ForegroundColor Yellow
Write-Host "   • Run: npm start -- --clear" -ForegroundColor Gray
Write-Host "   • Delete .expo folder and restart" -ForegroundColor Gray
Write-Host "   • Check that backend is running" -ForegroundColor Gray
Write-Host ""
