# PataBima Quick Deploy Script
# Usage: .\deploy.ps1 [commit-message]

param(
    [string]$CommitMessage = "Update deployment"
)

Write-Host "🚀 PataBima Deployment Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Check if we're in the right directory
if (-not (Test-Path "insurance-app")) {
    Write-Host "❌ Error: Must run from project root directory" -ForegroundColor Red
    exit 1
}

# 1. Stage all changes
Write-Host "`n📦 Staging changes..." -ForegroundColor Yellow
git add .

# 2. Show what will be committed
Write-Host "`n📋 Changes to commit:" -ForegroundColor Yellow
git status --short

# 3. Commit changes
Write-Host "`n💾 Committing changes..." -ForegroundColor Yellow
git commit -m "$CommitMessage"

if ($LASTEXITCODE -ne 0) {
    Write-Host "ℹ️  No changes to commit" -ForegroundColor Gray
}
else {
    Write-Host "✅ Changes committed" -ForegroundColor Green
}

# 4. Push to GitHub
Write-Host "`n🔄 Pushing to GitHub..." -ForegroundColor Yellow
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Pushed to GitHub successfully" -ForegroundColor Green
    Write-Host "`n🎯 GitHub Actions will now:" -ForegroundColor Cyan
    Write-Host "   1. Run tests" -ForegroundColor White
    Write-Host "   2. Build the application" -ForegroundColor White
    Write-Host "   3. Deploy to EC2 (if configured)" -ForegroundColor White
    Write-Host "`n📊 Check progress: https://github.com/kahoicreations-tech/Patabima-insurance-02/actions" -ForegroundColor Cyan
}
else {
    Write-Host "❌ Push failed. Check your connection and credentials." -ForegroundColor Red
    exit 1
}

Write-Host "`n✨ Deployment initiated!" -ForegroundColor Green
