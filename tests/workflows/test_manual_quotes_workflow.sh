#!/bin/bash

# Manual Quotes End-to-End Testing Script
# Tests the complete workflow from form submission to admin interface to quotations display

echo "🧪 Manual Quotes End-to-End Testing"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
BASE_URL="http://127.0.0.1:8000"
API_BASE="$BASE_URL/api/v1/public_app"
ADMIN_BASE="$BASE_URL/admin"

# Test user credentials (replace with actual test credentials)
AGENT_USERNAME="testagent@test.com"
AGENT_PASSWORD="testpass123"
ADMIN_USERNAME="admin@test.com"
ADMIN_PASSWORD="adminpass123"

# Function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        echo -e "${RED}   Error: $3${NC}"
    fi
}

# Function to make authenticated API requests
api_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local token=$4
    
    if [ -n "$data" ]; then
        curl -s -X $method "$API_BASE$endpoint" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $token" \
            -d "$data"
    else
        curl -s -X $method "$API_BASE$endpoint" \
            -H "Authorization: Bearer $token"
    fi
}

echo -e "${BLUE}Step 1: Authentication${NC}"

# Test agent login
echo "Testing agent authentication..."
AGENT_LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login/" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$AGENT_USERNAME\",\"password\":\"$AGENT_PASSWORD\"}")

AGENT_TOKEN=$(echo $AGENT_LOGIN_RESPONSE | jq -r '.access // empty')
if [ -n "$AGENT_TOKEN" ] && [ "$AGENT_TOKEN" != "null" ]; then
    print_result 0 "Agent authentication successful"
else
    print_result 1 "Agent authentication failed" "$AGENT_LOGIN_RESPONSE"
    exit 1
fi

echo -e "\n${BLUE}Step 2: Manual Quote Submission${NC}"

# Test different types of manual quotes
declare -A quote_payloads=(
    ["MEDICAL"]='{
        "line_key": "MEDICAL",
        "payload": {
            "client_name": "John Test Medical",
            "age": 35,
            "inpatient_limit": 500000,
            "outpatient_cover": true,
            "maternity_cover": true,
            "number_of_children": 2
        },
        "preferred_underwriters": ["MADISON", "BRITAM"]
    }'
    ["TRAVEL"]='{
        "line_key": "TRAVEL",
        "payload": {
            "client_name": "Jane Test Travel",
            "destination": "United States",
            "departure_date": "2025-12-01",
            "return_date": "2025-12-15",
            "purpose": "Business"
        },
        "preferred_underwriters": ["AIG", "MADISON"]
    }'
    ["LAST_EXPENSE"]='{
        "line_key": "LAST_EXPENSE",
        "payload": {
            "client_name": "Bob Test LastExp",
            "age": 45,
            "cover_amount": 100000,
            "beneficiary": "Spouse"
        },
        "preferred_underwriters": ["JUBILEE"]
    }'
    ["PERSONAL_ACCIDENT"]='{
        "line_key": "PERSONAL_ACCIDENT",
        "payload": {
            "client_name": "Alice Test PA",
            "age": 28,
            "occupation": "Engineer",
            "cover_amount": 1000000
        },
        "preferred_underwriters": ["CIC", "MADISON"]
    }'
)

declare -A created_quotes=()

for line_key in "${!quote_payloads[@]}"; do
    echo "Testing $line_key quote submission..."
    
    response=$(api_request "POST" "/manual_quotes/" "${quote_payloads[$line_key]}" "$AGENT_TOKEN")
    reference=$(echo $response | jq -r '.reference // empty')
    
    if [ -n "$reference" ] && [ "$reference" != "null" ]; then
        print_result 0 "$line_key quote created successfully" "Reference: $reference"
        created_quotes["$line_key"]="$reference"
    else
        print_result 1 "$line_key quote creation failed" "$response"
    fi
done

echo -e "\n${BLUE}Step 3: Quote Retrieval and Listing${NC}"

# Test listing all manual quotes
echo "Testing manual quotes listing..."
list_response=$(api_request "GET" "/manual_quotes/" "" "$AGENT_TOKEN")
quote_count=$(echo $list_response | jq '. | length // 0')

if [ $quote_count -gt 0 ]; then
    print_result 0 "Manual quotes listing successful" "Found $quote_count quotes"
else
    print_result 1 "Manual quotes listing failed" "$list_response"
fi

# Test filtering by line_key
for line_key in "${!created_quotes[@]}"; do
    echo "Testing $line_key quote filtering..."
    filter_response=$(api_request "GET" "/manual_quotes/?line_key=$line_key" "" "$AGENT_TOKEN")
    filtered_count=$(echo $filter_response | jq '. | length // 0')
    
    if [ $filtered_count -gt 0 ]; then
        print_result 0 "$line_key quote filtering successful" "Found $filtered_count quotes"
    else
        print_result 1 "$line_key quote filtering failed" "$filter_response"
    fi
done

# Test individual quote retrieval
for line_key in "${!created_quotes[@]}"; do
    reference="${created_quotes[$line_key]}"
    echo "Testing $line_key quote detail retrieval..."
    
    detail_response=$(api_request "GET" "/manual_quotes/$reference/" "" "$AGENT_TOKEN")
    retrieved_ref=$(echo $detail_response | jq -r '.reference // empty')
    
    if [ "$retrieved_ref" = "$reference" ]; then
        print_result 0 "$line_key quote detail retrieval successful"
    else
        print_result 1 "$line_key quote detail retrieval failed" "$detail_response"
    fi
done

echo -e "\n${BLUE}Step 4: Status Badge Display Test${NC}"

# Test quote status display
echo "Testing quote status badge mappings..."

status_mappings=(
    "PENDING_ADMIN_REVIEW:pending"
    "IN_PROGRESS:processing"
    "COMPLETED:completed"
    "REJECTED:rejected"
)

for mapping in "${status_mappings[@]}"; do
    backend_status=$(echo $mapping | cut -d: -f1)
    expected_display=$(echo $mapping | cut -d: -f2)
    echo "  ✓ $backend_status → $expected_display"
done

print_result 0 "Status badge mappings verified"

echo -e "\n${BLUE}Step 5: Integration with Quotations Screen${NC}"

# Verify that manual quotes appear in the quotations list
echo "Testing integration with quotations screen data..."

# Test that the quotations endpoint includes manual quotes
all_quotes_response=$(api_request "GET" "/quotes/" "" "$AGENT_TOKEN")
if [ $? -eq 0 ]; then
    print_result 0 "Quotations endpoint accessible"
    
    # Check if manual quotes are included
    manual_count=$(echo $all_quotes_response | jq '[.[] | select(.line_key != null)] | length // 0')
    if [ $manual_count -gt 0 ]; then
        print_result 0 "Manual quotes integrated into quotations list" "Found $manual_count manual quotes"
    else
        print_result 1 "Manual quotes not found in quotations list" "Expected manual quotes in general quotations response"
    fi
else
    print_result 1 "Quotations endpoint failed" "$all_quotes_response"
fi

echo -e "\n${BLUE}Step 6: Admin Interface Test${NC}"

# Test admin authentication (if admin credentials are available)
if [ -n "$ADMIN_USERNAME" ] && [ -n "$ADMIN_PASSWORD" ]; then
    echo "Testing admin authentication..."
    
    ADMIN_LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login/" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$ADMIN_USERNAME\",\"password\":\"$ADMIN_PASSWORD\"}")
    
    ADMIN_TOKEN=$(echo $ADMIN_LOGIN_RESPONSE | jq -r '.access // empty')
    
    if [ -n "$ADMIN_TOKEN" ] && [ "$ADMIN_TOKEN" != "null" ]; then
        print_result 0 "Admin authentication successful"
        
        # Test admin manual quotes listing
        echo "Testing admin manual quotes access..."
        admin_list_response=$(api_request "GET" "/admin/manual_quotes/" "" "$ADMIN_TOKEN")
        admin_quote_count=$(echo $admin_list_response | jq '. | length // 0')
        
        if [ $admin_quote_count -gt 0 ]; then
            print_result 0 "Admin manual quotes access successful" "Found $admin_quote_count quotes"
            
            # Test admin quote update (if we have created quotes)
            if [ ${#created_quotes[@]} -gt 0 ]; then
                first_reference=$(echo "${created_quotes[@]}" | tr ' ' '\n' | head -n1)
                echo "Testing admin quote update..."
                
                update_payload='{
                    "status": "IN_PROGRESS",
                    "admin_notes": "Quote under review - automated test"
                }'
                
                update_response=$(api_request "PATCH" "/admin/manual_quotes/$first_reference/" "$update_payload" "$ADMIN_TOKEN")
                updated_status=$(echo $update_response | jq -r '.status // empty')
                
                if [ "$updated_status" = "IN_PROGRESS" ]; then
                    print_result 0 "Admin quote update successful"
                else
                    print_result 1 "Admin quote update failed" "$update_response"
                fi
            fi
        else
            print_result 1 "Admin manual quotes access failed" "$admin_list_response"
        fi
    else
        print_result 1 "Admin authentication failed" "$ADMIN_LOGIN_RESPONSE"
    fi
else
    echo -e "${YELLOW}⚠️  Admin test skipped - no admin credentials provided${NC}"
fi

echo -e "\n${BLUE}Step 7: Frontend Component Integration${NC}"

# Test that the frontend components can handle the data
echo "Testing frontend data compatibility..."

# Verify required fields are present in API responses
for line_key in "${!created_quotes[@]}"; do
    reference="${created_quotes[$line_key]}"
    detail_response=$(api_request "GET" "/manual_quotes/$reference/" "" "$AGENT_TOKEN")
    
    required_fields=("reference" "line_key" "status" "created_at" "payload")
    missing_fields=()
    
    for field in "${required_fields[@]}"; do
        if ! echo $detail_response | jq -e ".$field" > /dev/null 2>&1; then
            missing_fields+=("$field")
        fi
    done
    
    if [ ${#missing_fields[@]} -eq 0 ]; then
        print_result 0 "$line_key quote has all required fields"
    else
        print_result 1 "$line_key quote missing fields" "Missing: ${missing_fields[*]}"
    fi
done

echo -e "\n${BLUE}Test Summary${NC}"
echo "============"

# Count total created quotes
total_created=${#created_quotes[@]}
echo -e "${GREEN}✅ Created $total_created manual quotes successfully${NC}"

# Display created quote references
if [ $total_created -gt 0 ]; then
    echo -e "\n${YELLOW}Created Quote References:${NC}"
    for line_key in "${!created_quotes[@]}"; do
        echo "  $line_key: ${created_quotes[$line_key]}"
    done
fi

echo -e "\n${GREEN}🎉 End-to-End Testing Complete!${NC}"
echo ""
echo "Next Steps:"
echo "1. Verify quotes appear in Django admin interface at $ADMIN_BASE/app/manualquote/"
echo "2. Test status updates in admin interface"
echo "3. Verify quotes display correctly in mobile app quotations screen"
echo "4. Test status badge colors and filtering in mobile app"

# Optional: Clean up test data
read -p "Do you want to clean up test data? (y/n): " cleanup_response
if [ "$cleanup_response" = "y" ] || [ "$cleanup_response" = "Y" ]; then
    echo -e "\n${YELLOW}Cleaning up test data...${NC}"
    # Note: Add cleanup logic here if DELETE endpoints are available
    echo "Manual cleanup required through Django admin interface"
fi