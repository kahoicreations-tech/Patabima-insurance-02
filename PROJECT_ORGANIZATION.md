# PataBima Project Organization Plan

## Current Structure Issues
- 30+ temporary Python scripts in root directory
- Multiple diagnostic and fix scripts scattered
- Deployment artifacts (zips, tarballs) cluttering root
- Documentation files (.md) not organized
- Test files mixed with production code

## Recommended Directory Structure

```
PATABIMA01/
├── frontend/                      # React Native Expo app
│   ├── src/                       # Source code
│   │   ├── components/            # Reusable UI components
│   │   ├── screens/               # Screen components
│   │   ├── contexts/              # React Context providers
│   │   ├── services/              # API services & business logic
│   │   ├── utils/                 # Helper functions
│   │   ├── constants/             # App constants
│   │   ├── types/                 # TypeScript types
│   │   └── hooks/                 # Custom React hooks
│   ├── assets/                    # Static assets
│   ├── tests/                     # Frontend tests
│   └── node_modules/              # Dependencies
│
├── backend/                       # Django REST API
│   └── insurance-app/             # Django project
│       ├── app/                   # Main Django app
│       ├── manage.py              # Django management
│       └── requirements.txt       # Python dependencies
│
├── docs/                          # All documentation
│   ├── api/                       # API documentation
│   ├── architecture/              # Architecture docs
│   ├── deployment/                # Deployment guides
│   ├── troubleshooting/           # Problem resolution docs
│   ├── features/                  # Feature specifications
│   └── changelog/                 # Change logs
│
├── scripts/                       # Utility scripts
│   ├── diagnostics/               # Diagnostic scripts
│   ├── fixes/                     # One-time fix scripts
│   ├── tests/                     # Test scripts
│   ├── verification/              # Verification scripts
│   ├── deployment/                # Deployment scripts
│   └── data-migration/            # Database migration scripts
│
├── deployment/                    # Deployment configuration
│   ├── docker/                    # Docker files
│   ├── nginx/                     # Nginx configs
│   ├── scripts/                   # Deploy scripts
│   └── archives/                  # Old deployment packages
│
├── infrastructure/                # AWS & infrastructure
│   ├── terraform/                 # Infrastructure as code
│   ├── cloudformation/            # AWS CloudFormation
│   └── lambda/                    # Lambda functions
│
├── tests/                         # Integration tests
│   ├── frontend/                  # Frontend integration tests
│   ├── backend/                   # Backend integration tests
│   └── e2e/                       # End-to-end tests
│
├── data/                          # Sample/seed data
│   ├── motor2/                    # Motor insurance data
│   └── pricing/                   # Pricing data
│
├── _archive/                      # Archived old code
│
├── .github/                       # GitHub workflows
├── .vscode/                       # VS Code settings
├── .env.example                   # Environment template
└── README.md                      # Main documentation
```

## File Reorganization Plan

### 1. Move Test & Diagnostic Scripts
**From Root → scripts/diagnostics/**
- check_admin_display.py
- check_extendible_policies.py
- check_extendible_policy.py
- check_full_policy.py
- check_full_policy_927901.py
- check_madison_config.py
- check_motor2_fields.py
- check_policy_560572.py
- check_policy_834912.py
- check_policy_927901.py
- check_policy_dates.py
- check_pricing_discrepancy.py
- check_which_extensions.py
- show_frontend_data.py
- verify_backend_api_data.py
- verify_extendible_data.py
- verify_extendible_save.py
- verify_frontend_will_receive.py
- verify_payment_processed.py
- test_api_response.py
- test_claims_policies_endpoint.py
- test_extendible_api.py
- test_extendible_filtering.py
- test_extensions_api.py
- test_extensions_api_direct.py
- test_extensions_endpoint.py
- test_extensions_endpoint_direct.py
- test_extensions_filtering.py
- test_policy_extension_eligibility.py
- test_underwriter_fetching.py
- test_underwriter_http.py

**From Root → scripts/fixes/**
- calculate_extendible_levies.py
- find_20k_config.py
- fix_madison_extendible.py
- fix_policy_220820.py
- fix_policy_834912.py
- fix_policy_927901.py
- fix_policy_927901_amounts.py

**From Root → scripts/tests/**
- test_comprehensive_quote_save.js
- test-extendible-backend.js
- TEST_DUPLICATE_FETCH_FIX.js

### 2. Organize Documentation
**From Root → docs/troubleshooting/**
- BLOCKING_ISSUES_FIXED.md
- DUPLICATE_FETCH_FIX.md
- KEYBOARD_DISMISSAL_FIX.md
- UNDERWRITER_FETCHING_DIAGNOSTIC.md

**From Root → docs/features/**
- MOTOR2_POLICY_CREATION_FLOW_KENYA.md
- MOTOR2_SUBCATEGORY_PRICING_REPORT.md

**From Root → docs/deployment/**
- SDK53_DOWNGRADE_GUIDE.md
- QUICK_START.md
- EC2_ENDPOINT_HEALTH_REPORT.md
- COMPREHENSIVE_FLOW_TEST_RESULTS.md

### 3. Archive Old Deployment Files
**From Root → deployment/archives/**
- deploy-minimal.zip
- deploy.tar.gz
- insurance-app-deploy-20251021-161411.zip
- insurance-app-deploy.tar.gz
- insurance-app-update.tar.gz

### 4. Clean Up Root Directory
**Keep in Root:**
- README.md (updated)
- package.json
- package-lock.json
- .gitignore
- .env.example
- docker-compose.yml
- Dockerfile

**Remove from Root:**
- out/ (build artifacts)
- node_modules/ (if exists at root - should only be in frontend/)

## Implementation Steps

### Phase 1: Create Directory Structure
```powershell
# Create main directories
New-Item -ItemType Directory -Force -Path "docs/api"
New-Item -ItemType Directory -Force -Path "docs/architecture"
New-Item -ItemType Directory -Force -Path "docs/deployment"
New-Item -ItemType Directory -Force -Path "docs/troubleshooting"
New-Item -ItemType Directory -Force -Path "docs/features"
New-Item -ItemType Directory -Force -Path "docs/changelog"

New-Item -ItemType Directory -Force -Path "scripts/diagnostics"
New-Item -ItemType Directory -Force -Path "scripts/fixes"
New-Item -ItemType Directory -Force -Path "scripts/tests"
New-Item -ItemType Directory -Force -Path "scripts/verification"
New-Item -ItemType Directory -Force -Path "scripts/deployment"

New-Item -ItemType Directory -Force -Path "deployment/archives"
New-Item -ItemType Directory -Force -Path "deployment/docker"
New-Item -ItemType Directory -Force -Path "deployment/nginx"

New-Item -ItemType Directory -Force -Path "tests/integration"
New-Item -ItemType Directory -Force -Path "tests/e2e"
```

### Phase 2: Move Files
Run the provided PowerShell script to move files to their new locations

### Phase 3: Update References
- Update import paths in code
- Update documentation links
- Update .gitignore if needed
- Update CI/CD pipelines

### Phase 4: Clean Up
- Remove empty directories
- Archive outdated files
- Update README with new structure

## Benefits
1. **Better Organization**: Files grouped by purpose
2. **Easier Navigation**: Clear folder structure
3. **Cleaner Root**: Only essential files in root
4. **Better Maintainability**: Scripts and docs easy to find
5. **Professional Structure**: Industry-standard layout
6. **Scalability**: Easy to add new features/modules

## Migration Script
See `scripts/deployment/reorganize_project.ps1` for automated migration
