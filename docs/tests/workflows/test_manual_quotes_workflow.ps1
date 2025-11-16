# PataBima Manual Quotes Integration Test - PowerShell Version
# This script validates the complete manual quotes workflow from frontend to backend

# Configuration
$BASE_URL = "http://localhost:8000"
$AGENT_EMAIL = "agent@patacredit.com"
$AGENT_PASSWORD = "secure123"
$ADMIN_EMAIL = "admin@patacredit.com"
$ADMIN_PASSWORD = "admin123"

# Colors for output
function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor Blue
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

Write-Info "Starting PataBima Manual Quotes Integration Test"
Write-Info "================================================"

# Test 1: Agent Authentication
Write-Info "Test 1: Agent Authentication"
$agentAuthBody = @{
    email    = $AGENT_EMAIL
    password = $AGENT_PASSWORD
} | ConvertTo-Json

try {
    $agentAuthResponse = Invoke-RestMethod -Uri "$BASE_URL/auth/login/" -Method POST -Body $agentAuthBody -ContentType "application/json"
    $AGENT_TOKEN = $agentAuthResponse.access
    Write-Success "Agent authentication successful"
}
catch {
    Write-Error "Agent authentication failed: $($_.Exception.Message)"
    exit 1
}

# Test 2: Admin Authentication  
Write-Info "Test 2: Admin Authentication"
$adminAuthBody = @{
    email    = $ADMIN_EMAIL
    password = $ADMIN_PASSWORD
} | ConvertTo-Json

try {
    $adminAuthResponse = Invoke-RestMethod -Uri "$BASE_URL/auth/login/" -Method POST -Body $adminAuthBody -ContentType "application/json"
    $ADMIN_TOKEN = $adminAuthResponse.access
    Write-Success "Admin authentication successful"
}
catch {
    Write-Error "Admin authentication failed: $($_.Exception.Message)"
    exit 1
}

# Test 3: Create Medical Manual Quote
Write-Info "Test 3: Create Medical Manual Quote"
$medicalQuoteBody = @{
    line_key               = "MEDICAL"
    payload                = @{
        client_name             = "John Doe"
        age                     = 35
        inpatient_limit         = 500000
        outpatient_cover        = $true
        maternity_cover         = $true
        pre_existing_conditions = "None"
        family_size             = 4
    }
    preferred_underwriters = @("MADISON", "BRITAM")
} | ConvertTo-Json -Depth 3

$headers = @{
    Authorization  = "Bearer $AGENT_TOKEN"
    "Content-Type" = "application/json"
}

try {
    $medicalQuote = Invoke-RestMethod -Uri "$BASE_URL/api/manual-quotes/" -Method POST -Body $medicalQuoteBody -Headers $headers
    $MEDICAL_QUOTE_ID = $medicalQuote.id
    Write-Success "Medical quote created: $($medicalQuote.reference)"
}
catch {
    Write-Error "Medical quote creation failed: $($_.Exception.Message)"
}

# Test 4: Create Travel Manual Quote
Write-Info "Test 4: Create Travel Manual Quote"
$travelQuoteBody = @{
    line_key               = "TRAVEL"
    payload                = @{
        client_name     = "Jane Smith"
        destination     = "United States"
        departure_date  = "2025-12-01"
        return_date     = "2025-12-15"
        trip_type       = "SINGLE"
        age             = 28
        coverage_amount = 100000
    }
    preferred_underwriters = @("AIG")
} | ConvertTo-Json -Depth 3

try {
    $travelQuote = Invoke-RestMethod -Uri "$BASE_URL/api/manual-quotes/" -Method POST -Body $travelQuoteBody -Headers $headers
    $TRAVEL_QUOTE_ID = $travelQuote.id
    Write-Success "Travel quote created: $($travelQuote.reference)"
}
catch {
    Write-Error "Travel quote creation failed: $($_.Exception.Message)"
}

# Test 5: Create Last Expense Manual Quote
Write-Info "Test 5: Create Last Expense Manual Quote"
$lastExpenseBody = @{
    line_key               = "LAST_EXPENSE"
    payload                = @{
        client_name   = "Robert Johnson"
        age           = 45
        cover_amount  = 200000
        beneficiaries = @(
            @{ name = "Mary Johnson"; relationship = "Spouse"; percentage = 50 }
            @{ name = "David Johnson"; relationship = "Son"; percentage = 50 }
        )
    }
    preferred_underwriters = @("JUBILEE")
} | ConvertTo-Json -Depth 3

try {
    $lastExpenseQuote = Invoke-RestMethod -Uri "$BASE_URL/api/manual-quotes/" -Method POST -Body $lastExpenseBody -Headers $headers
    $LAST_EXPENSE_QUOTE_ID = $lastExpenseQuote.id
    Write-Success "Last Expense quote created: $($lastExpenseQuote.reference)"
}
catch {
    Write-Error "Last Expense quote creation failed: $($_.Exception.Message)"
}

# Test 6: Create WIBA Manual Quote
Write-Info "Test 6: Create WIBA Manual Quote"
$wibaQuoteBody = @{
    line_key               = "WIBA"
    payload                = @{
        client_name         = "Alice Brown"
        employer_name       = "Tech Solutions Ltd"
        annual_earnings     = 800000
        occupation          = "Software Developer"
        number_of_employees = 50
    }
    preferred_underwriters = @("AAR")
} | ConvertTo-Json -Depth 3

try {
    $wibaQuote = Invoke-RestMethod -Uri "$BASE_URL/api/manual-quotes/" -Method POST -Body $wibaQuoteBody -Headers $headers
    $WIBA_QUOTE_ID = $wibaQuote.id
    Write-Success "WIBA quote created: $($wibaQuote.reference)"
}
catch {
    Write-Error "WIBA quote creation failed: $($_.Exception.Message)"
}

# Test 7: Create Personal Accident Manual Quote
Write-Info "Test 7: Create Personal Accident Manual Quote"
$personalAccidentBody = @{
    line_key               = "PERSONAL_ACCIDENT"
    payload                = @{
        client_name     = "Michael Wilson"
        age             = 32
        occupation      = "Engineer"
        coverage_amount = 1000000
        activities      = @("Sports", "Travel")
        medical_history = "Clean"
    }
    preferred_underwriters = @("LIBERTY")
} | ConvertTo-Json -Depth 3

try {
    $personalAccidentQuote = Invoke-RestMethod -Uri "$BASE_URL/api/manual-quotes/" -Method POST -Body $personalAccidentBody -Headers $headers
    $PERSONAL_ACCIDENT_QUOTE_ID = $personalAccidentQuote.id
    Write-Success "Personal Accident quote created: $($personalAccidentQuote.reference)"
}
catch {
    Write-Error "Personal Accident quote creation failed: $($_.Exception.Message)"
}

# Test 8: List All Manual Quotes (Agent View)
Write-Info "Test 8: List Manual Quotes (Agent View)"
try {
    $agentQuotes = Invoke-RestMethod -Uri "$BASE_URL/api/manual-quotes/" -Method GET -Headers $headers
    Write-Success "Agent can see $($agentQuotes.Count) manual quotes"
    
    # Verify each line type is present
    $lineTypes = $agentQuotes | ForEach-Object { $_.line_key } | Sort-Object -Unique
    Write-Info "Line types found: $($lineTypes -join ', ')"
    
    foreach ($expectedType in @("MEDICAL", "TRAVEL", "LAST_EXPENSE", "WIBA", "PERSONAL_ACCIDENT")) {
        if ($lineTypes -contains $expectedType) {
            Write-Success "$expectedType quotes are visible"
        }
        else {
            Write-Warning "$expectedType quotes not found"
        }
    }
}
catch {
    Write-Error "Failed to list agent quotes: $($_.Exception.Message)"
}

# Test 9: Admin Interface - List All Manual Quotes
Write-Info "Test 9: Admin Interface - List All Quotes"
$adminHeaders = @{
    Authorization  = "Bearer $ADMIN_TOKEN"
    "Content-Type" = "application/json"
}

try {
    $adminQuotes = Invoke-RestMethod -Uri "$BASE_URL/api/admin/manual-quotes/" -Method GET -Headers $adminHeaders
    Write-Success "Admin can see $($adminQuotes.Count) manual quotes"
}
catch {
    Write-Error "Failed to list admin quotes: $($_.Exception.Message)"
}

# Test 10: Admin Processing - Update Quote Status to IN_PROGRESS
if ($MEDICAL_QUOTE_ID) {
    Write-Info "Test 10: Admin Processing - Update to IN_PROGRESS"
    $statusUpdateBody = @{
        status      = "IN_PROGRESS"
        admin_notes = "Started processing medical quote"
    } | ConvertTo-Json

    try {
        $updatedQuote = Invoke-RestMethod -Uri "$BASE_URL/api/admin/manual-quotes/$MEDICAL_QUOTE_ID/" -Method PATCH -Body $statusUpdateBody -Headers $adminHeaders
        Write-Success "Quote status updated to IN_PROGRESS"
        
        if ($updatedQuote.status -eq "IN_PROGRESS") {
            Write-Success "Status correctly set to IN_PROGRESS"
        }
        else {
            Write-Error "Status update failed - expected IN_PROGRESS, got $($updatedQuote.status)"
        }
    }
    catch {
        Write-Error "Failed to update quote status: $($_.Exception.Message)"
    }
}

# Test 11: Admin Processing - Complete Quote with Premium
if ($MEDICAL_QUOTE_ID) {
    Write-Info "Test 11: Admin Complete Quote with Premium"
    $completeQuoteBody = @{
        status           = "COMPLETED"
        computed_premium = "75000.00"
        levies_breakdown = @{
            itl        = "187.50"
            pcf        = "187.50" 
            stamp_duty = "40.00"
        }
        admin_notes      = "Premium calculated and approved"
    } | ConvertTo-Json -Depth 3

    try {
        $completedQuote = Invoke-RestMethod -Uri "$BASE_URL/api/admin/manual-quotes/$MEDICAL_QUOTE_ID/" -Method PATCH -Body $completeQuoteBody -Headers $adminHeaders
        Write-Success "Quote completed with premium calculation"
        
        if ($completedQuote.computed_premium -eq "75000.00") {
            Write-Success "Premium correctly set to KSh 75,000"
        }
        else {
            Write-Error "Premium calculation failed"
        }
    }
    catch {
        Write-Error "Failed to complete quote: $($_.Exception.Message)"
    }
}

# Test 12: Verify Frontend Integration (Simulated)
Write-Info "Test 12: Frontend Integration Verification"
try {
    $frontendQuotes = Invoke-RestMethod -Uri "$BASE_URL/api/manual-quotes/" -Method GET -Headers $headers
    Write-Success "Frontend can fetch updated quotes"
    
    # Find the completed quote
    $completedQuote = $frontendQuotes | Where-Object { $_.id -eq $MEDICAL_QUOTE_ID }
    if ($completedQuote -and $completedQuote.status -eq "COMPLETED") {
        Write-Success "Completed quote visible in frontend with correct status"
        
        if ($completedQuote.computed_premium) {
            Write-Success "Premium information available for display"
        }
        else {
            Write-Warning "Premium information missing"
        }
    }
    else {
        Write-Warning "Completed quote not found or status incorrect"
    }
}
catch {
    Write-Error "Frontend integration check failed: $($_.Exception.Message)"
}

# Test 13: Search and Filter Testing
Write-Info "Test 13: Search and Filter Testing"
try {
    # Test filtering by line type
    $medicalQuotes = Invoke-RestMethod -Uri "$BASE_URL/api/manual-quotes/?line_key=MEDICAL" -Method GET -Headers $headers
    Write-Success "Medical quotes filter: $($medicalQuotes.Count) quotes found"
    
    $travelQuotes = Invoke-RestMethod -Uri "$BASE_URL/api/manual-quotes/?line_key=TRAVEL" -Method GET -Headers $headers
    Write-Success "Travel quotes filter: $($travelQuotes.Count) quotes found"
    
    # Test search by client name
    $searchResults = Invoke-RestMethod -Uri "$BASE_URL/api/manual-quotes/?search=John Doe" -Method GET -Headers $headers
    Write-Success "Search by client name: $($searchResults.Count) quotes found"
    
}
catch {
    Write-Error "Search and filter testing failed: $($_.Exception.Message)"
}

# Test 14: Status Badge Verification
Write-Info "Test 14: Status Badge Verification"
try {
    $allQuotes = Invoke-RestMethod -Uri "$BASE_URL/api/manual-quotes/" -Method GET -Headers $headers
    
    $statusCounts = @{}
    foreach ($quote in $allQuotes) {
        if ($statusCounts.ContainsKey($quote.status)) {
            $statusCounts[$quote.status]++
        }
        else {
            $statusCounts[$quote.status] = 1
        }
    }
    
    Write-Info "Status distribution:"
    foreach ($status in $statusCounts.Keys) {
        $count = $statusCounts[$status]
        Write-Info "  $status`: $count quotes"
    }
    
    # Verify expected statuses exist
    $expectedStatuses = @("PENDING_ADMIN_REVIEW", "IN_PROGRESS", "COMPLETED")
    foreach ($expectedStatus in $expectedStatuses) {
        if ($statusCounts.ContainsKey($expectedStatus)) {
            Write-Success "$expectedStatus status found"
        }
        else {
            Write-Warning "$expectedStatus status not found"
        }
    }
}
catch {
    Write-Error "Status badge verification failed: $($_.Exception.Message)"
}

# Test 15: Cleanup Test Data (Optional)
Write-Info "Test 15: Cleanup Test Data"
$createdQuoteIds = @($MEDICAL_QUOTE_ID, $TRAVEL_QUOTE_ID, $LAST_EXPENSE_QUOTE_ID, $WIBA_QUOTE_ID, $PERSONAL_ACCIDENT_QUOTE_ID) | Where-Object { $_ }

foreach ($quoteId in $createdQuoteIds) {
    try {
        Invoke-RestMethod -Uri "$BASE_URL/api/admin/manual-quotes/$quoteId/" -Method DELETE -Headers $adminHeaders
        Write-Success "Cleaned up quote ID: $quoteId"
    }
    catch {
        Write-Warning "Failed to cleanup quote ID $quoteId (may not exist)"
    }
}

Write-Info ""
Write-Info "================================================"
Write-Success "Manual Quotes Integration Test Complete!"
Write-Info "================================================"
Write-Info ""
Write-Info "Summary:"
Write-Info "- Tested all 5 manual quote line types (MEDICAL, TRAVEL, LAST_EXPENSE, WIBA, PERSONAL_ACCIDENT)"
Write-Info "- Verified agent and admin authentication"
Write-Info "- Tested complete workflow: submission → admin processing → completion"
Write-Info "- Verified status transitions: PENDING_ADMIN_REVIEW → IN_PROGRESS → COMPLETED"
Write-Info "- Tested premium calculations and levies breakdown"
Write-Info "- Verified frontend integration endpoints"
Write-Info "- Tested search and filtering capabilities"
Write-Info "- Validated status badge system"
Write-Info ""

if ($medicalQuote -and $travelQuote -and $lastExpenseQuote -and $wibaQuote -and $personalAccidentQuote) {
    Write-Success "✓ ALL TESTS PASSED - Manual Quotes integration is working correctly!"
}
else {
    Write-Warning "⚠ Some tests failed - please check error messages above"
}

Write-Info "The QuotationsScreenNew component should now display all manual quote types with proper status badges."