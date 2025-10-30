# Tests Directory

This directory contains all test files for the PataBima application, organized by test type and target layer.

## 📁 Structure

```
tests/
├── backend/          # Python backend tests
├── frontend/         # JavaScript frontend tests
├── integration/      # Integration tests (frontend ↔ backend)
├── workflows/        # Test workflow scripts (.ps1, .sh)
├── data/            # Test data and fixtures
└── test-non-motor-backend-connections.js  # Non-motor insurance API tests
```

## 🧪 Test Categories

### Backend Tests (`backend/`)

Python test scripts for Django backend functionality:

- **API Tests**: Testing backend endpoints
- **Model Tests**: Testing database models and business logic
- **Pricing Tests**: Motor insurance pricing validation
- **Policy Tests**: Policy creation and management
- **Medical Tests**: Medical insurance functionality
- **Admin Tests**: Admin panel functionality
- **Profile Tests**: User profile enhancements

**Run Backend Tests:**

```bash
cd insurance-app
python manage.py test
```

### Frontend Tests (`frontend/`)

JavaScript test scripts for React Native frontend:

- **Component Tests**: UI component functionality
- **Pricing Tests**: Frontend pricing calculations
- **Form Tests**: Form data handling and validation
- **API Integration**: Frontend service layer tests
- **Motor 2 Tests**: Motor insurance flow testing
- **Admin Tests**: Admin features in frontend

**Run Frontend Tests:**

```bash
cd frontend
npm test
```

### Integration Tests (`integration/`)

End-to-end tests covering frontend and backend interaction:

- **Service Integration**: Testing DjangoAPIService
- **Data Flow**: Frontend ↔ Backend data synchronization
- **Complete Workflows**: Full user journeys

**Run Integration Tests:**

```bash
# Usually run with specific test runners or manually
node tests/integration/test_integration_simple.js
```

### Non-Motor Backend Connection Tests

**Script**: `test-non-motor-backend-connections.js`

Tests all 7 non-motor insurance products to verify backend API connectivity:

- Medical Insurance (Individual)
- WIBA Insurance
- Travel Insurance
- Personal Accident Insurance
- Professional Indemnity Insurance
- Last Expense Insurance
- Domestic Package Insurance

**Run Tests:**

```bash
# Basic usage (localhost)
node tests/test-non-motor-backend-connections.js

# With custom API URL
API_BASE_URL=http://your-backend-url:8000 node tests/test-non-motor-backend-connections.js

# With authentication
AUTH_TOKEN=your_jwt_token node tests/test-non-motor-backend-connections.js
```

**Prerequisites:**

- Django backend running
- Node.js installed (no external dependencies)
- ManualQuote endpoint active

See detailed usage in script comments.

### Workflows (`workflows/`)

Test workflow scripts for complex testing scenarios:

- **Manual Quotes Workflow**: Complete quote generation flow
- **PowerShell Workflows**: Windows-based test automation
- **Shell Workflows**: Unix-based test automation

**Run Workflows:**

```powershell
# PowerShell
.\tests\workflows\test_manual_quotes_workflow.ps1

# Bash
bash tests/workflows/test_manual_quotes_workflow.sh
```

## 🚀 Quick Start

### Run All Backend Tests

```bash
cd insurance-app
python manage.py test --verbosity=2
```

### Run Specific Backend Test

```bash
cd insurance-app
python manage.py test app.tests.test_motor2_policy_creation
```

### Run Frontend Tests

```bash
cd frontend
npm test
```

### Run Integration Tests

```bash
node tests/integration/test_frontend_backend_integration.js
```

## 📋 Test File Naming Convention

- **Backend**: `test_*.py` (Python)
- **Frontend**: `test_*.js` (JavaScript)
- **Integration**: `test_*_integration.js`
- **Workflows**: `test_*_workflow.{ps1,sh}`

## 🔍 Test Coverage

### Backend Coverage

- Motor Insurance: Pricing, categories, products
- Medical Insurance: Quotes and policies
- Commissions: Agent commission calculations
- Admin: Manual quotes, user management
- Authentication: Login, session management
- Profile: Agent profile enhancements

### Frontend Coverage

- Motor 2 Flow: Complete user journey
- Pricing Calculations: Real-time premium calculations
- Form Handling: Data validation and submission
- API Integration: Service layer communication
- UI Components: Component functionality

### Integration Coverage

- Complete Workflows: End-to-end user journeys
- Data Synchronization: Frontend ↔ Backend consistency
- Service Layer: API communication reliability

## 📝 Notes

- All test files moved from project root for better organization
- Tests organized by target layer (backend/frontend/integration)
- Workflow scripts separated for clarity
- Test data and fixtures in dedicated folder

## 🔗 Related Documentation

- [Backend Documentation](../insurance-app/README.md)
- [Frontend Documentation](../frontend/README.md)
- [Testing Guide](../docs/testing/)

---

**Last Updated**: October 17, 2025  
**Total Test Files**: 33 (11 backend, 17 frontend, 3 integration, 2 workflows)
