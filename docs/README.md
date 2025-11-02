# PataBima Documentation

This folder contains all technical documentation for the PataBima insurance platform.

## 📁 Documentation Structure

### 🎯 [Features](./features/)

Feature-specific documentation organized by domain:

- **[Profile](./features/profile/)** - Agent profile enhancements, layout updates, header improvements, visual design
- **[Campaigns](./features/campaigns/)** - Campaign implementation, AWS S3 integration, banner management, status tracking
- **[Admin Panel](./features/admin/)** - Admin consolidation, duplication fixes, template improvements
- **[Authentication](./features/authentication/)** - Authentication guards, JWT implementation, session management

### 🎨 [Frontend](./frontend/)

Frontend-specific documentation:

- **[Typography](./frontend/typography/)** - Typography system with Poppins font family, sizes, line heights, usage examples

### ⚙️ [Backend](./backend/)

Backend infrastructure and services:

- **[Textract](./backend/textract/)** - AWS Textract OCR integration, setup guides, configuration
- **[Database](./backend/database/)** - PostgreSQL setup, configuration, schema management

### 🔄 [Motor 2 Policy Lifecycle](./motor2/)

**Complete implementation** of Motor 2 renewals and extensions with admin-configured ExtendiblePricing.

- **README.md** - Documentation index and quick start
- **MOTOR2_IMPLEMENTATION_COMPLETE.md** - ✅ Implementation summary and checklist
- **MOTOR2_POLICY_LIFECYCLE_IMPLEMENTATION.md** - Comprehensive implementation guide
- **MOTOR2_SOURCE_OF_TRUTH_ANALYSIS.md** - Database schema and technical analysis

**Key Features**:
- Renewals for ALL active policies (90-day window)
- Extensions only for admin-configured products (ExtendiblePricing model)
- Urgency-based UI with color-coded badges
- Grace period warnings and late fee calculations

### 🚗 [Motor Insurance](./motor-insurance/)

Documentation related to motor insurance implementation, pricing, and features.

- **MOTOR2_IMPLEMENTATION_COMPLETE.md** - Complete motor insurance v2 implementation
- **MOTOR2_IMPLEMENTATION_GUIDE.md** - Implementation guide for motor insurance
- **MOTOR2_QUICK_REFERENCE.md** - Quick reference for motor insurance features
- **MOTOR2_COMPLETION_SUMMARY.md** - Summary of motor insurance completion
- **MOTOR2_DEPLOYMENT_CHECKLIST.md** - Deployment checklist for motor insurance
- **MOTOR2_POLICY_ENDPOINT_FIX.md** - Policy endpoint fixes
- **MOTOR2_RENEWALS_EXTENSIONS_PLAN.md** - Renewals and extensions planning
- **PRICING_COMPARISON_VERIFICATION_COMPLETE.md** - Pricing comparison verification

### 💰 [Commissions](./commissions/)

Documentation for agent commission system and management.

- **COMMISSION_SYSTEM_SUMMARY.md** - Overview of commission system
- **COMMISSION_QUICK_CARD.md** - Quick reference card for commissions
- **ADMIN_COMMISSION_GUIDE.md** - Admin guide for managing commissions
- **BULK_COMMISSION_GUIDE.md** - Bulk commission operations guide
- **HOW_TO_ADD_COMMISSIONS.md** - Step-by-step guide for adding commissions
- **MONTHLY_COMMISSION_0.3_PERCENT.md** - Monthly commission calculations
- **MONTHLY_BONUS_ADMIN_GUIDE.md** - Admin guide for monthly bonuses

### ☁️ [AWS Deployment](./aws-deployment/)

AWS infrastructure and deployment documentation.

- **AWS_DEPLOYMENT_COMPLETE.md** - Complete AWS deployment guide
- **AWS_S3_UPLOADS_CONFIG.md** - S3 upload configuration
- **AWS_TEXTRACT_DEPLOYMENT_GUIDE.md** - Textract deployment guide
- **AWS_TEXTRACT_LAMBDA_FIXED.md** - Textract Lambda fixes

### 🧪 [Testing](./testing/)

Testing guides and quick start documentation.

- **QUICK_TEST_SESSION_MANAGEMENT.md** - Session management testing guide
- **QUICK_TEST_GUIDE.md** - General testing guide
- **QUICK_START_COMMISSIONS.md** - Quick start guide for commissions

### 🔧 [Fixes](./fixes/)

Bug fixes, patches, and improvement documentation.

- **PREMIUM_CALCULATION_FIX_COMPLETE.md** - Premium calculation fixes
- **QUOTATION_CALCULATION_FIX.md** - Quotation calculation fixes
- **DOCUMENT_UPLOAD_PREMIUM_FIX.md** - Document upload fixes
- **DOCUMENT_AUTOFILL_FIX.md** - Document autofill fixes
- **COVER_TYPE_CLEANUP_COMPLETE.md** - Cover type cleanup
- **MANUAL_QUOTES_INTEGRATION_COMPLETE.md** - Manual quotes integration

### 📦 [Archive](./archive/)

Historical documentation and organization records.

- **DOCUMENTATION_ORGANIZATION_SUMMARY.md** - Documentation organization history

## 📝 Recent Updates

### Latest Features (October 17, 2025)

1. **✅ Motor 2 Policy Lifecycle** - Complete renewals and extensions implementation
   - Admin-configured ExtendiblePricing model
   - 90-day renewal window with urgency categorization
   - Grace period management with late fee calculations
   - See `/docs/motor2/` for complete documentation

2. **✅ Documentation Organization** - Restructured all documentation by feature/domain
   - New folders: `features/`, `frontend/`, `backend/`
   - Feature-specific READMEs for easy navigation
   - Clear separation between features, frontend, and backend docs

3. **Silent Session Management** - Industry-standard token refresh (January 2025)
4. **Motor Insurance v2** - 60+ products with dynamic pricing
5. **Commission System** - Automated agent commission calculations
6. **AWS Integration** - S3 uploads and Textract OCR

### Current Focus

- ✅ Motor 2 policy lifecycle (renewals & extensions) - **COMPLETE**
- ✅ Documentation organization - **COMPLETE**
- End-to-end session management testing
- Medical insurance implementation
- Admin configuration of ExtendiblePricing records

## 🚀 Quick Links

- [Main README](../README.md) - Project overview
- [Frontend Documentation](../frontend/README.md) - Frontend architecture
- [Backend Documentation](../insurance-app/README.md) - Backend API docs

## 📚 Documentation Navigation

### By Feature
- [Profile Feature](./features/profile/) - Agent profile system
- [Campaigns Feature](./features/campaigns/) - Campaign management
- [Admin Panel](./features/admin/) - Admin interface
- [Authentication](./features/authentication/) - Auth system

### By Layer
- [Frontend Docs](./frontend/) - React Native components, typography, UI
- [Backend Docs](./backend/) - Django backend, Textract, database

### By Topic
- [Motor Insurance](./motor-insurance/) - Motor insurance products
- [Motor 2 Lifecycle](./motor2/) - Policy renewals & extensions
- [Commissions](./commissions/) - Commission system
- [AWS](./aws-deployment/) - Cloud infrastructure
- [Testing](./testing/) - Testing guides
- [Fixes](./fixes/) - Bug fixes & improvements

## 📞 Support

For questions or issues, refer to the specific documentation category above or contact the development team.

---

**Last Updated**: October 17, 2025  
**Latest Additions**: 
- Motor 2 Policy Lifecycle (Renewals & Extensions)
- Documentation Organization (Features, Frontend, Backend)
