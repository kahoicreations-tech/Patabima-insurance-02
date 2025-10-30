# Project Root Organization Plan

**Date**: October 17, 2025  
**Scope**: Organize scattered files in project root (outside frontend/ and insurance-app/)

---

## 📊 Current State Analysis

### Test Files (30+ files)
- `test_*.py` - Python test scripts (14 files)
- `test_*.js` - JavaScript test scripts (16 files)
- `test_*.ps1` - PowerShell test workflows (2 files)
- `test_*.sh` - Shell test workflows (1 file)

### AWS Configuration Files (8 files)
- `*.json` - AWS policy files (6 files)
- `*.ps1` - AWS PowerShell scripts (1 file)
- `lambda.zip`, `lambda-deployed.zip` - Lambda deployment packages (2 files)

### Data/Analysis Files (4 files)
- `motor2_*.json` - Motor 2 data files (2 files)
- `pataBima_pricing_features_preview.json` - Pricing data (1 file)
- `detailed_pricing_analysis.py`, `final_pricing_verification.py` - Analysis scripts (2 files)

### Utility Scripts (2 files)
- `promote_agent_to_staff.py` - Admin utility
- `simple_pricing_test.py`, `simple_tor_test.js` - Simple test utilities

### Other Files (1 file)
- `SYNTAX_FIX_INSTRUCTIONS.txt` - Development notes

---

## 🎯 Proposed Organization

### 1. Create `tests/` Folder Structure
```
tests/
├── backend/           # Python backend tests
├── frontend/          # JavaScript frontend tests
├── integration/       # Integration tests
├── workflows/         # Test workflow scripts (.ps1, .sh)
└── data/             # Test data and fixtures
```

### 2. Create `aws-config/` Folder
```
aws-config/
├── policies/         # IAM policies, bucket policies
├── lambda/          # Lambda deployment packages
└── scripts/         # AWS deployment scripts
```

### 3. Create `data/` Folder
```
data/
├── motor2/          # Motor 2 data files
├── pricing/         # Pricing data and analysis
└── fixtures/        # Test fixtures and sample data
```

### 4. Update `scripts/` Folder
```
scripts/
├── aws/             # AWS scripts (existing)
├── utils/           # Utility scripts (promote_agent, etc.)
├── testing/         # Testing utilities
└── analysis/        # Data analysis scripts
```

---

## 📋 File Movement Plan

### Phase 1: Test Files → `tests/`

**Backend Tests (Python):**
- `test_backend_medical.py` → `tests/backend/`
- `test_admin_manual_quotes.py` → `tests/backend/`
- `test_final_api.py` → `tests/backend/`
- `test_hybrid_document_system.py` → `tests/backend/`
- `test_medical_quotes.py` → `tests/backend/`
- `test_motor2_policy_creation.py` → `tests/backend/`
- `test_pricing_comparison.py` → `tests/backend/`
- `test_profile_enhancements.py` → `tests/backend/`
- `simple_pricing_test.py` → `tests/backend/`
- `detailed_pricing_analysis.py` → `tests/backend/analysis/`
- `final_pricing_verification.py` → `tests/backend/analysis/`
- `promote_agent_to_staff.py` → `scripts/utils/`

**Frontend Tests (JavaScript):**
- `test_admin_practical_usage.js` → `tests/frontend/`
- `test_admin_pricing_capabilities.js` → `tests/frontend/`
- `test_comprehensive_pricing.js` → `tests/frontend/`
- `test_cover_type_integration.js` → `tests/frontend/`
- `test_endpoints.js` → `tests/frontend/`
- `test_field_mapping.js` → `tests/frontend/`
- `test_form_data_isolation.js` → `tests/frontend/`
- `test_frontend_backend_integration.js` → `tests/integration/`
- `test_frontend_field_mapping.js` → `tests/frontend/`
- `test_frontend_pricing.js` → `tests/frontend/`
- `test_frontend_service_integration.js` → `tests/integration/`
- `test_frontend_workaround.js` → `tests/frontend/`
- `test_integration_simple.js` → `tests/integration/`
- `test_motor2_endpoints.js` → `tests/frontend/`
- `test_pricing_builder_fix.js` → `tests/frontend/`
- `test_subcategory_pricing_validation.js` → `tests/frontend/`
- `test_tor_api.js` → `tests/frontend/`
- `test_tor_live_api.js` → `tests/frontend/`
- `test_underwriter_comparison.js` → `tests/frontend/`
- `simple_tor_test.js` → `tests/frontend/`

**Test Workflows:**
- `test_manual_quotes_workflow.ps1` → `tests/workflows/`
- `test_manual_quotes_workflow.sh` → `tests/workflows/`

### Phase 2: AWS Files → `aws-config/`

**Policies:**
- `claims-signer-inline-policy.json` → `aws-config/policies/`
- `lambda-inline-policy.json` → `aws-config/policies/`
- `s3-bucket-policy-uploads.json` → `aws-config/policies/`
- `s3-campaign-banners-public-policy.json` → `aws-config/policies/`
- `s3-cors-uploads.json` → `aws-config/policies/`
- `trust-policy.json` → `aws-config/policies/`

**Lambda Packages:**
- `lambda.zip` → `aws-config/lambda/`
- `lambda-deployed.zip` → `aws-config/lambda/`

**Test Payloads:**
- `test-lambda-payload.json` → `aws-config/lambda/`
- `test-lambda-response.json` → `aws-config/lambda/`
- `test-lambda-response2.json` → `aws-config/lambda/`

**Scripts:**
- `apply-s3-public-policy.ps1` → `aws-config/scripts/`

### Phase 3: Data Files → `data/`

**Motor 2 Data:**
- `motor2_private_comp_1m.json` → `data/motor2/`
- `motor2_sweep.json` → `data/motor2/`

**Pricing Data:**
- `pataBima_pricing_features_preview.json` → `data/pricing/`

### Phase 4: Development Notes → `docs/`

**Development Notes:**
- `SYNTAX_FIX_INSTRUCTIONS.txt` → `docs/development-notes/`

---

## 📁 Final Structure

```
project-root/
├── frontend/                    # React Native app (unchanged)
├── insurance-app/               # Django backend (unchanged)
├── docs/                        # Documentation (existing + 1 new file)
├── tests/                       # ALL test files (NEW)
│   ├── backend/                # Python tests
│   ├── frontend/               # JavaScript tests
│   ├── integration/            # Integration tests
│   ├── workflows/              # Test workflows
│   └── data/                   # Test fixtures
├── aws-config/                  # AWS configuration (NEW)
│   ├── policies/               # IAM/S3 policies
│   ├── lambda/                 # Lambda packages
│   └── scripts/                # AWS scripts
├── data/                        # Data files (NEW)
│   ├── motor2/                 # Motor 2 data
│   └── pricing/                # Pricing data
├── scripts/                     # Utility scripts (existing + organized)
│   ├── aws/                    # AWS scripts
│   ├── utils/                  # Utility scripts
│   └── testing/                # Testing utilities
├── assets/                      # Assets (unchanged)
├── amplify/                     # Amplify config (unchanged)
├── backend/                     # Backend index (unchanged)
├── lambda_build/                # Lambda build (unchanged)
├── lambda-deployed/             # Lambda deployed (unchanged)
├── src/                         # Source (unchanged)
├── _archive/                    # Archive (unchanged)
└── [config files]              # .env, package.json, etc.
```

---

## ✅ Benefits

1. **Clean Root Directory** - Only essential config files remain in root
2. **Test Organization** - All tests grouped by type (backend/frontend/integration)
3. **AWS Centralization** - All AWS config in one place
4. **Data Management** - Data files separated from code
5. **Better Discoverability** - Clear folder structure
6. **Easier Maintenance** - Logical grouping makes updates easier

---

## 🚀 Execution Steps

1. Create new folder structure
2. Move test files to `tests/`
3. Move AWS files to `aws-config/`
4. Move data files to `data/`
5. Move development notes to `docs/`
6. Create README files for each new folder
7. Update any references in scripts
8. Verify all imports/paths still work

---

**Status**: Ready for implementation  
**Impact**: Low risk - mainly organizational  
**Estimated Time**: 10-15 minutes
