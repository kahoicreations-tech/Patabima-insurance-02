# PataBima Project Structure

Last Updated: 2025-01-21

## 📁 Directory Organization

```
PATABIMA01/
├── frontend/                           # React Native Expo App
│   ├── src/
│   │   ├── components/                 # Reusable UI components
│   │   ├── screens/                    # Screen components
│   │   │   ├── dashboard/              # Dashboard/Home screen
│   │   │   ├── quotations/             # Insurance quotation screens
│   │   │   │   └── Motor 2/            # Motor insurance flow
│   │   │   │       └── MotorInsuranceFlow/
│   │   │   │           └── VehicleDetails/
│   │   │   │               └── DynamicVehicleForm.js  # Main form with caching
│   │   │   ├── upcoming/               # Renewals & Extensions
│   │   │   └── account/                # Agent account management
│   │   ├── contexts/                   # React Context providers
│   │   ├── services/                   # API services
│   │   │   ├── DjangoAPIService.js     # Centralized API client
│   │   │   ├── MotorInsurancePricingService.js  # Pricing with caching
│   │   │   └── SimpleCache.js          # TTL-based cache (12h pricing)
│   │   ├── utils/                      # Helper functions
│   │   ├── constants/                  # App constants
│   │   ├── types/                      # TypeScript definitions
│   │   └── hooks/                      # Custom React hooks
│   ├── assets/                         # Images, fonts, icons
│   ├── metro.config.js                 # Metro bundler config
│   ├── package.json                    # Frontend dependencies
│   └── patches/                        # Source patches (patch-package)
│       └── react-native+0.79.6.patch   # memoize-one removal
│
├── backend/                            # Django REST API
│   └── insurance-app/
│       ├── app/                        # Main Django app
│       │   ├── models/                 # Database models
│       │   ├── views/                  # API views
│       │   ├── serializers/            # DRF serializers
│       │   └── tests/                  # Django tests
│       ├── manage.py                   # Django management
│       └── requirements.txt            # Python dependencies
│
├── docs/                               # Project Documentation
│   ├── api/                            # API documentation
│   ├── architecture/                   # Architecture docs
│   ├── deployment/                     # Deployment guides
│   │   ├── SDK53_DOWNGRADE_GUIDE.md    # Expo SDK downgrade process
│   │   ├── QUICK_START.md              # Quick start guide
│   │   ├── EC2_ENDPOINT_HEALTH_REPORT.md
│   │   └── COMPREHENSIVE_FLOW_TEST_RESULTS.md
│   ├── troubleshooting/                # Issue resolution docs
│   │   ├── DUPLICATE_FETCH_FIX.md      # Underwriter duplicate fetch fix
│   │   ├── KEYBOARD_DISMISSAL_FIX.md   # Keyboard issue fix
│   │   └── UNDERWRITER_FETCHING_DIAGNOSTIC.md
│   ├── features/                       # Feature specifications
│   │   ├── MOTOR2_POLICY_CREATION_FLOW_KENYA.md
│   │   ├── MOTOR2_SUBCATEGORY_PRICING_REPORT.md
│   │   ├── admin/                      # Admin panel docs
│   │   ├── authentication/             # Auth system docs
│   │   └── campaigns/                  # Campaign feature docs
│   └── changelog/                      # Change logs
│
├── scripts/                            # Utility Scripts
│   ├── diagnostics/                    # Diagnostic scripts (31 files)
│   │   ├── check_*.py                  # Status/config checkers
│   │   ├── verify_*.py                 # Data verification
│   │   ├── test_*.py                   # API endpoint tests
│   │   └── show_*.py                   # Data display scripts
│   ├── fixes/                          # One-time fix scripts (6 files)
│   │   ├── fix_*.py                    # Data fix scripts
│   │   ├── calculate_*.py              # Calculation fixes
│   │   └── find_*.py                   # Data finding scripts
│   ├── tests/                          # Standalone test scripts (2 files)
│   │   ├── test_comprehensive_quote_save.js
│   │   └── test-extendible-backend.js
│   ├── deployment/                     # Deployment scripts
│   │   ├── reorganize_project.ps1      # Project reorganization
│   │   └── clean_reorganize.ps1        # Clean reorganization
│   └── data-migration/                 # Database migration scripts
│
├── deployment/                         # Deployment Configuration
│   ├── archives/                       # Old deployment packages (4 files)
│   │   ├── deploy-minimal.zip
│   │   ├── deploy.tar.gz
│   │   ├── insurance-app-deploy-*.zip
│   │   └── insurance-app-update.tar.gz
│   ├── docker/                         # Docker configurations
│   ├── nginx/                          # Nginx configs
│   └── scripts/                        # Deployment scripts
│       ├── deploy_backend.sh
│       └── deploy_to_ec2.ps1
│
├── infrastructure/                     # AWS & Infrastructure
│   ├── terraform/                      # Infrastructure as code
│   ├── cloudformation/                 # AWS CloudFormation
│   └── lambda/                         # Lambda functions
│
├── tests/                              # Integration Tests
│   ├── integration/                    # Integration tests
│   │   ├── frontend/                   # Frontend integration
│   │   └── backend/                    # Backend integration
│   └── e2e/                            # End-to-end tests
│
├── data/                               # Sample/Seed Data
│   ├── motor2/                         # Motor insurance data
│   └── pricing/                        # Pricing data
│
├── _archive/                           # Archived Code
│   ├── PROJECT_REORGANIZATION_COMPLETE.md
│   ├── documentation/                  # Old documentation
│   ├── duplicate-structures/           # Removed duplicates
│   ├── legacy-projects/                # Old projects
│   └── temporary-files/                # Temporary files
│
├── amplify/                            # AWS Amplify configuration
├── aws-config/                         # AWS configuration
├── lambda_build/                       # Lambda build artifacts
├── lambda-deployed/                    # Deployed Lambda functions
├── LocalPilotMCP/                      # MCP server
│
├── .github/                            # GitHub workflows
│   └── copilot-instructions.md         # Copilot custom instructions
├── .vscode/                            # VS Code settings
│   └── tasks.json                      # VS Code tasks
│
├── .env.example                        # Environment template
├── .gitignore                          # Git ignore rules
├── docker-compose.yml                  # Docker Compose config
├── Dockerfile                          # Docker image definition
├── package.json                        # Root package.json
├── PROJECT_ORGANIZATION.md             # This file
├── README.md                           # Main project README
└── QUICK_START.md                      # Quick start guide

```

## 📊 File Organization Summary

### ✅ Organized Files
- **31 diagnostic scripts** → `scripts/diagnostics/`
- **6 fix scripts** → `scripts/fixes/`
- **2 test scripts** → `scripts/tests/`
- **3 troubleshooting docs** → `docs/troubleshooting/`
- **2 feature docs** → `docs/features/`
- **4 deployment docs** → `docs/deployment/`
- **4 deployment archives** → `deployment/archives/`

### 📦 Root Directory (Clean)
The root directory now only contains:
- Essential config files (package.json, docker-compose.yml, Dockerfile)
- Project documentation (README.md, PROJECT_ORGANIZATION.md)
- Environment template (.env.example)
- Git configuration (.gitignore)
- Major project directories

## 🔑 Key Technical Decisions

### Frontend (Expo SDK 53)
- **React Native 0.79.6** (downgraded from 0.81.5 for stability)
- **React 19.0.0**
- **patch-package** for memoize-one removal in RN internals
- **SimpleCache** with 12h TTL for pricing comparisons
- **Refs-based gating** to prevent duplicate API calls
- **MemoizedTextInput** to prevent keyboard dismissal

### Caching Strategy
- **In-memory Map** + **AsyncStorage** persistence
- **12-hour TTL** for pricing data
- **24-hour TTL** for general data
- **Sum insured bucketing** (50k increments) for comprehensive insurance
- **Stable cache keys** from pricing-critical fields only

### Backend
- Django REST Framework
- PostgreSQL database
- 60+ motor insurance products across 6 categories
- 7 underwriters (MADISON, PTA, JUBILEE, UAP, APA, BRITAM, CIC)
- Mandatory levies: ITL (0.25%), PCF (0.25%), Stamp Duty (KSh 40)

## 🚀 Quick Commands

### Frontend
```powershell
cd frontend
npm install                    # Install dependencies
npm start                      # Start Expo dev server
npm run android                # Run on Android
npm run ios                    # Run on iOS
```

### Backend
```powershell
cd insurance-app
python manage.py runserver     # Start Django server
python manage.py migrate       # Run migrations
python manage.py test          # Run tests
```

### Diagnostic Scripts
```powershell
python scripts/diagnostics/check_policy_dates.py
python scripts/diagnostics/verify_backend_api_data.py
```

### Fix Scripts (⚠️ Use with caution)
```powershell
python scripts/fixes/fix_policy_927901.py
```

## 📝 Maintenance Guidelines

### Adding New Files
- **Diagnostic scripts** → `scripts/diagnostics/`
- **Fix scripts** → `scripts/fixes/`
- **Test scripts** → `scripts/tests/`
- **Documentation** → `docs/<category>/`
- **Deployment archives** → `deployment/archives/`

### Cleaning Cache
Frontend cache can be cleared:
- Programmatically: `MotorInsurancePricingService.clearPricingCache()`
- Manual: Clear AsyncStorage keys prefixed with `PB_CACHE_v1:`

### Updating Dependencies
```powershell
cd frontend
expo install --fix             # Align all dependencies with SDK
npm run postinstall            # Apply patches
```

## 🎯 Next Steps
1. Review organized structure
2. Update any hardcoded paths in scripts
3. Commit changes: `git add . && git commit -m "Reorganize project structure"`
4. Update team documentation links
5. Archive old deployment files periodically (>6 months old)

## 📚 Important Documentation
- **Main README**: `README.md`
- **Quick Start**: `docs/deployment/QUICK_START.md`
- **SDK Downgrade**: `docs/deployment/SDK53_DOWNGRADE_GUIDE.md`
- **Duplicate Fetch Fix**: `docs/troubleshooting/DUPLICATE_FETCH_FIX.md`
- **Motor 2 Flow**: `docs/features/MOTOR2_POLICY_CREATION_FLOW_KENYA.md`
- **Copilot Instructions**: `.github/copilot-instructions.md`

---

**Last Reorganization**: January 21, 2025
**Status**: ✅ Complete
**Cleaned Files**: 49 files organized into proper directories
