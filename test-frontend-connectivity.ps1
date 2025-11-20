# Frontend Connectivity Test
# Tests if React Native frontend can connect to EC2 backend

Write-Host "`n🧪 Testing Frontend → Backend Connectivity..." -ForegroundColor Cyan
Write-Host "=" * 80 -ForegroundColor DarkGray

# 1. Check Environment Configuration
Write-Host "`n📋 Step 1: Environment Configuration" -ForegroundColor Yellow
Write-Host "-" * 80 -ForegroundColor DarkGray

$envFile = ".\frontend\.env"
$envLocalFile = ".\frontend\.env.local"

if (Test-Path $envFile) {
    $apiUrl = Get-Content $envFile | Select-String "^EXPO_PUBLIC_API_BASE_URL=" | ForEach-Object { $_.ToString().Split('=')[1] }
    Write-Host "✅ .env file found" -ForegroundColor Green
    Write-Host "   API URL: $apiUrl" -ForegroundColor White
}
else {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    exit 1
}

if (Test-Path $envLocalFile) {
    $apiUrlLocal = Get-Content $envLocalFile | Select-String "^EXPO_PUBLIC_API_BASE_URL=" | ForEach-Object { $_.ToString().Split('=')[1] }
    Write-Host "✅ .env.local file found (overrides .env)" -ForegroundColor Green
    Write-Host "   API URL: $apiUrlLocal" -ForegroundColor White
    $finalUrl = $apiUrlLocal
}
else {
    Write-Host "⚠️  .env.local not found (using .env)" -ForegroundColor Yellow
    $finalUrl = $apiUrl
}

Write-Host "`n🎯 Active Backend: $finalUrl" -ForegroundColor Cyan

# 2. Test Backend Connectivity
Write-Host "`n📡 Step 2: Testing Backend API..." -ForegroundColor Yellow
Write-Host "-" * 80 -ForegroundColor DarkGray

$baseUrl = $finalUrl.Trim()

# Test Health Endpoint
Write-Host "Testing: $baseUrl/api/v1/health/" -ForegroundColor White
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/api/v1/health/" -Method GET -TimeoutSec 5
    if ($health.status -eq "ok") {
        Write-Host "✅ Health Check: PASS" -ForegroundColor Green
        Write-Host "   Service: $($health.service)" -ForegroundColor DarkGray
    }
    else {
        Write-Host "⚠️  Health Check: Unexpected response" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "❌ Health Check: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`n⚠️  Backend is not reachable. Frontend will not work!" -ForegroundColor Red
    exit 1
}

# Test Motor Categories (Critical for Motor 2 flow)
Write-Host "`nTesting: $baseUrl/api/v1/motor2/categories/" -ForegroundColor White
try {
    $categories = Invoke-RestMethod -Uri "$baseUrl/api/v1/motor2/categories/" -Method GET -TimeoutSec 5
    if ($categories.categories) {
        $count = $categories.categories.Count
        Write-Host "✅ Motor Categories: PASS" -ForegroundColor Green
        Write-Host "   Found $count categories" -ForegroundColor DarkGray
        
        # Show first 3 categories
        $categories.categories | Select-Object -First 3 | ForEach-Object {
            Write-Host "   - $($_.name) ($($_.code))" -ForegroundColor DarkGray
        }
    }
    else {
        Write-Host "⚠️  Motor Categories: Empty response" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "❌ Motor Categories: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test Underwriters
Write-Host "`nTesting: $baseUrl/api/v1/public_app/insurance/get_underwriters/" -ForegroundColor White
try {
    $underwriters = Invoke-RestMethod -Uri "$baseUrl/api/v1/public_app/insurance/get_underwriters/" -Method GET -TimeoutSec 5
    if ($underwriters.underwriters) {
        $count = $underwriters.underwriters.Count
        Write-Host "✅ Underwriters: PASS" -ForegroundColor Green
        Write-Host "   Found $count underwriters" -ForegroundColor DarkGray
        
        # Show first 3 underwriters
        $underwriters.underwriters | Select-Object -First 3 | ForEach-Object {
            Write-Host "   - $($_.name) ($($_.code))" -ForegroundColor DarkGray
        }
    }
    else {
        Write-Host "⚠️  Underwriters: Empty response" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "❌ Underwriters: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. Check DjangoAPIService Configuration
Write-Host "`n🔧 Step 3: DjangoAPIService Configuration" -ForegroundColor Yellow
Write-Host "-" * 80 -ForegroundColor DarkGray

$serviceFile = ".\frontend\services\DjangoAPIService.js"
if (Test-Path $serviceFile) {
    Write-Host "✅ DjangoAPIService.js found" -ForegroundColor Green
    
    # Check if it reads EXPO_PUBLIC_API_BASE_URL
    $content = Get-Content $serviceFile -Raw
    if ($content -match "EXPO_PUBLIC_API_BASE_URL") {
        Write-Host "✅ Service reads EXPO_PUBLIC_API_BASE_URL" -ForegroundColor Green
    }
    else {
        Write-Host "⚠️  Service may not read environment variable" -ForegroundColor Yellow
    }
    
    # Check fallback URL
    if ($content -match "BASE_URL.*127\.0\.0\.1:8000") {
        Write-Host "⚠️  Fallback URL is localhost (will be used in dev mode)" -ForegroundColor Yellow
    }
}
else {
    Write-Host "❌ DjangoAPIService.js not found!" -ForegroundColor Red
}

# 4. Check Motor 2 Pricing Service
Write-Host "`n🚗 Step 4: Motor Insurance Pricing Service" -ForegroundColor Yellow
Write-Host "-" * 80 -ForegroundColor DarkGray

$pricingService = ".\frontend\services\MotorInsurancePricingService.js"
if (Test-Path $pricingService) {
    Write-Host "✅ MotorInsurancePricingService.js found" -ForegroundColor Green
}
else {
    Write-Host "⚠️  MotorInsurancePricingService.js not found" -ForegroundColor Yellow
}

# 5. Test Complete Motor 2 Flow Endpoints
Write-Host "`n🎯 Step 5: Motor 2 Flow Critical Endpoints" -ForegroundColor Yellow
Write-Host "-" * 80 -ForegroundColor DarkGray

$motor2Endpoints = @(
    @{Name = "Categories"; Path = "/api/v1/motor2/categories/"; Method = "GET" },
    @{Name = "Subcategories (Private)"; Path = "/api/v1/motor2/subcategories/?category=PRIVATE"; Method = "GET" },
    @{Name = "Underwriters"; Path = "/api/v1/public_app/insurance/get_underwriters/"; Method = "GET" },
    @{Name = "Calculate Premium"; Path = "/api/v1/public_app/insurance/calculate_motor_premium/"; Method = "POST" },
    @{Name = "Submit Quotation"; Path = "/api/v1/public_app/insurance/submit_motor_quotation/"; Method = "POST" }
)

$passCount = 0
$totalCount = $motor2Endpoints.Count

foreach ($endpoint in $motor2Endpoints) {
    Write-Host "`nTesting: $($endpoint.Name)" -ForegroundColor White -NoNewline
    
    try {
        if ($endpoint.Method -eq "GET") {
            $response = Invoke-WebRequest -Uri "$baseUrl$($endpoint.Path)" -Method GET -TimeoutSec 5 -ErrorAction Stop
        }
        else {
            # POST with minimal body
            $body = @{} | ConvertTo-Json
            $response = Invoke-WebRequest -Uri "$baseUrl$($endpoint.Path)" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 5 -ErrorAction Stop
        }
        
        if ($response.StatusCode -eq 200) {
            Write-Host " ✅" -ForegroundColor Green
            $passCount++
        }
        else {
            Write-Host " ⚠️  (Status: $($response.StatusCode))" -ForegroundColor Yellow
        }
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.Value__
        if ($statusCode -eq 400 -or $statusCode -eq 401) {
            Write-Host " ⚠️  (Auth/Validation required - endpoint exists)" -ForegroundColor Cyan
            $passCount++  # Still counts as working
        }
        else {
            Write-Host " ❌ (Status: $statusCode)" -ForegroundColor Red
        }
    }
}

# 6. Summary
Write-Host "`n" -NoNewline
Write-Host "=" * 80 -ForegroundColor DarkGray
Write-Host "`n📊 FRONTEND CONNECTIVITY TEST SUMMARY" -ForegroundColor Cyan
Write-Host "-" * 80 -ForegroundColor DarkGray

Write-Host "`n🌐 Backend Configuration:" -ForegroundColor Yellow
Write-Host "   URL: $finalUrl" -ForegroundColor White
Write-Host "   Health: ✅ OK" -ForegroundColor Green

Write-Host "`n🚗 Motor 2 Flow Endpoints:" -ForegroundColor Yellow
Write-Host "   Working: $passCount / $totalCount" -ForegroundColor White

$percentage = [math]::Round(($passCount / $totalCount) * 100, 0)

if ($percentage -eq 100) {
    Write-Host "`n✅ ALL SYSTEMS OPERATIONAL - Frontend is ready!" -ForegroundColor Green -BackgroundColor DarkGreen
    Write-Host "`n📱 Next Steps:" -ForegroundColor Cyan
    Write-Host "   1. Start Expo dev server: npm start" -ForegroundColor White
    Write-Host "   2. Press 'r' to reload" -ForegroundColor White
    Write-Host "   3. Test Motor Insurance flow in app" -ForegroundColor White
}
elseif ($percentage -ge 80) {
    Write-Host "`n⚠️  MOSTLY WORKING - $percentage% endpoints operational" -ForegroundColor Yellow
    Write-Host "`n📱 Frontend can work with minor issues" -ForegroundColor Yellow
}
else {
    Write-Host "`n❌ CRITICAL ISSUES - Only $percentage% endpoints working" -ForegroundColor Red
    Write-Host "`n⚠️  Frontend will have significant problems!" -ForegroundColor Red
}

Write-Host "`n💡 Troubleshooting:" -ForegroundColor Cyan
Write-Host "   - If app shows 'Network Error', restart Expo: npm start" -ForegroundColor White
Write-Host "   - Press 'r' in Metro terminal to reload" -ForegroundColor White
Write-Host "   - Check DjangoAPIService.js logs for API calls" -ForegroundColor White
Write-Host "`n"
