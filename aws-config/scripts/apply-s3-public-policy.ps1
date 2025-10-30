# Apply S3 Bucket Policy for Public Campaign Banners
# This script allows public read access to campaign_banners/* folder only

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "S3 Public Policy Setup for Campaign Banners" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$bucketName = "patabima-backend-dev-uploads"

# Step 1: Update Block Public Access settings
Write-Host "Step 1: Updating Block Public Access settings..." -ForegroundColor Yellow
Write-Host "This allows bucket policies to grant public access (but keeps ACLs blocked)" -ForegroundColor Gray

try {
    aws s3api put-public-access-block `
        --bucket $bucketName `
        --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=false,RestrictPublicBuckets=false"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Block Public Access settings updated successfully" -ForegroundColor Green
    }
    else {
        throw "Failed to update Block Public Access settings"
    }
}
catch {
    Write-Host "✗ Error updating Block Public Access: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please update manually via AWS Console:" -ForegroundColor Yellow
    Write-Host "1. Go to https://s3.console.aws.amazon.com/s3/buckets/$bucketName" -ForegroundColor Cyan
    Write-Host "2. Click Permissions tab" -ForegroundColor Cyan
    Write-Host "3. Edit Block Public Access settings" -ForegroundColor Cyan
    Write-Host "4. Uncheck 'Block public and cross-account access...policies'" -ForegroundColor Cyan
    Write-Host "5. Keep the other 3 settings checked" -ForegroundColor Cyan
    Write-Host ""
    Read-Host "Press Enter after updating manually, or Ctrl+C to exit"
}

Write-Host ""

# Step 2: Apply bucket policy
Write-Host "Step 2: Applying bucket policy for campaign_banners/*..." -ForegroundColor Yellow

try {
    aws s3api put-bucket-policy `
        --bucket $bucketName `
        --policy file://s3-campaign-banners-public-policy.json
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Bucket policy applied successfully" -ForegroundColor Green
    }
    else {
        throw "Failed to apply bucket policy"
    }
}
catch {
    Write-Host "✗ Error applying bucket policy: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✓ Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Campaign banner images are now publicly accessible at:" -ForegroundColor Green
Write-Host "https://$bucketName.s3.us-east-1.amazonaws.com/campaign_banners/*" -ForegroundColor Cyan
Write-Host ""
Write-Host "URLs will never expire and work without query parameters." -ForegroundColor Gray
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Restart your Django server (Ctrl+C and run again)" -ForegroundColor Cyan
Write-Host "2. Refresh your mobile app to see permanent URLs" -ForegroundColor Cyan
Write-Host ""
