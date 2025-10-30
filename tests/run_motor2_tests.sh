#!/bin/bash

# Motor 2 Flow Integration Test Runner
# Bash script for Unix/Linux/Mac

set -e

# Default configuration
BACKEND_URL="${MOTOR2_TEST_BACKEND_URL:-http://localhost:8000}"
TEST_USER="${MOTOR2_TEST_USER:-testagent@patabima.com}"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Help function
show_help() {
    cat << EOF
Motor 2 Flow Integration Test Runner
=====================================

Usage:
    ./run_motor2_tests.sh [options]

Options:
    -u, --url <url>        Backend server URL (default: http://localhost:8000)
    -t, --user <email>     Test agent username (default: testagent@patabima.com)
    -h, --help             Show this help message

Environment Variables:
    MOTOR2_TEST_BACKEND_URL    Override default backend URL
    MOTOR2_TEST_USER           Override default test user

Examples:
    ./run_motor2_tests.sh
    ./run_motor2_tests.sh --url http://192.168.1.100:8000
    ./run_motor2_tests.sh --user myagent@patabima.com

EOF
    exit 0
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -u|--url)
            BACKEND_URL="$2"
            shift 2
            ;;
        -t|--user)
            TEST_USER="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

echo -e "${CYAN}======================================================================${NC}"
echo -e "${CYAN}           Motor 2 Flow Integration Test Runner                      ${NC}"
echo -e "${CYAN}======================================================================${NC}"
echo ""

# Check if Python is installed
echo -e "${YELLOW}[1/5] Checking Python installation...${NC}"
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
    PYTHON_VERSION=$(python3 --version)
    echo -e "${GREEN}      ✓ Python found: $PYTHON_VERSION${NC}"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
    PYTHON_VERSION=$(python --version)
    echo -e "${GREEN}      ✓ Python found: $PYTHON_VERSION${NC}"
else
    echo -e "${RED}      ✗ Python not found. Please install Python 3.8+${NC}"
    exit 1
fi

# Check if pip is installed
echo -e "${YELLOW}[2/5] Checking required Python packages...${NC}"
if $PYTHON_CMD -c "import requests" &> /dev/null; then
    echo -e "${GREEN}      ✓ Required packages installed${NC}"
else
    echo -e "${YELLOW}      ⚠ 'requests' library not found. Installing...${NC}"
    $PYTHON_CMD -m pip install requests
fi

# Check if backend is running
echo -e "${YELLOW}[3/5] Checking backend connectivity...${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/v1/motor/categories/" || echo "000")

if [ "$HTTP_CODE" == "200" ] || [ "$HTTP_CODE" == "401" ]; then
    echo -e "${GREEN}      ✓ Backend is accessible at $BACKEND_URL${NC}"
elif [ "$HTTP_CODE" == "000" ]; then
    echo -e "${RED}      ✗ Cannot connect to backend at $BACKEND_URL${NC}"
    echo -e "${YELLOW}      Please ensure Django backend is running:${NC}"
    echo -e "        cd insurance-app"
    echo -e "        python manage.py runserver"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${YELLOW}      ⚠ Unexpected response code: $HTTP_CODE${NC}"
fi

# Check if test script exists
echo -e "${YELLOW}[4/5] Locating test script...${NC}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEST_SCRIPT="$SCRIPT_DIR/motor2_flow_integration_test.py"

if [ -f "$TEST_SCRIPT" ]; then
    echo -e "${GREEN}      ✓ Test script found${NC}"
else
    echo -e "${RED}      ✗ Test script not found: $TEST_SCRIPT${NC}"
    exit 1
fi

# Run the test
echo -e "${YELLOW}[5/5] Running integration tests...${NC}"
echo ""
echo -e "${CYAN}======================================================================${NC}"
echo ""

# Set environment variables and run test
export MOTOR2_TEST_BACKEND_URL="$BACKEND_URL"
export MOTOR2_TEST_USER="$TEST_USER"

$PYTHON_CMD "$TEST_SCRIPT"
EXIT_CODE=$?

echo ""
echo -e "${CYAN}======================================================================${NC}"

if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}Test execution completed successfully!${NC}"
else
    echo -e "${RED}Test execution completed with errors.${NC}"
    echo -e "${YELLOW}Check the output above for details.${NC}"
fi

echo ""
echo -e "Logs and details saved in: tests/logs/"
echo ""

exit $EXIT_CODE
