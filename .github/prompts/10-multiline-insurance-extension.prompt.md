---
mode: agent
title: "Multi-Line Insurance Extension (Medical, Travel, Last Expense)"
phase: "Backend + Frontend Expansion"
priority: "high"
dependencies:
  [
    "05-motor-flow-restructure",
    "06-motor-categories-implementation",
    "03-frontend-services",
  ]
---

# Task: Implement Multi-Line Insurance (Medical, Travel, Last Expense) Using Motor2 Patterns

## Objective

Extend the existing Motor2 architecture to support additional insurance lines (initially Medical, Travel, Last Expense) with a unified quoting + policy creation pipeline, admin approval gating where required, and dynamic underwriter-driven configuration.

## Strategic Principles

- Reuse Motor2 strengths: JSON-backed flexible models, underwriter comparison, premium breakdown structure, levies application.
- Introduce a generic quoting layer decoupled from final policy objects.
- Allow products to specify: requires_admin_approval, pricing_model, form_schema, constraints.
- Avoid premature abstraction of MotorPolicy; introduce GenericQuote + GenericPolicy for new lines (future refactor may unify).
- Minimize migration risk: add—not replace—until stability proven.

---

## Underwriter Integration Strategy

### Existing Motor Underwriter Compatibility

- Reuse existing underwriter data from Motor2 where applicable (CIC, Britam, etc.)
- Store underwriter capabilities per line in ProductConfiguration.underwriter_details
- Support both single-underwriter products and multi-underwriter comparison
- Maintain underwriter logos, contact info, and approval methods from motor system

Example underwriter_details structure:

```json
{
  "type": "single", // or "comparison" for multi-underwriter
  "underwriter": {
    "code": "CIC",
    "name": "CIC Insurance",
    "logo_url": "/logos/cic.png",
    "approval_method": "auto", // or "manual"
    "contact_email": "support@cic.co.ke"
  },
  "supported_lines": ["MEDICAL", "TRAVEL"],
  "product_specific_config": {
    "max_age": 75,
    "family_limit": 6,
    "waiting_period_days": 30
  }
}
```

---

## Data Model Additions

### 1. ProductLine (represents an insurance vertical)

Fields:

- key (Char, unique) e.g. MEDICAL, TRAVEL, LAST_EXPENSE
- name (Char)
- description (Text, optional)
- requires_default_levies (Bool, default True)
- active (Bool)

### 2. ProductConfiguration

Fields:

- line (FK ProductLine)
- code (Char, unique within line)
- name (Char)
- underwriter_details (JSON) // single underwriter or multi-offer meta
- form_schema (JSON) // dynamic field definitions (see Form Schema spec below)
- pricing_model (JSON) // adapter key + parameters
- constraints (JSON) // validation (age limits, sum assured ranges, zones, etc.)
- requires_admin_approval (Bool)
- sort_order (Int)
- active (Bool)

### 3. GenericQuote

Fields:

- quote_number (Char unique)
- line (FK ProductLine)
- product_config (FK ProductConfiguration)
- user (FK User - agent)
- client_details (JSON)
- risk_inputs (JSON) // answers from form_schema
- underwriter_details (JSON) // chosen or computed comparison result
- pricing_snapshot (JSON) // base, adjustments, levies, total
- status (Enum: DRAFT, CALCULATED, SUBMITTED, PENDING_ADMIN, APPROVED, REJECTED, CONVERTED)
- requires_admin (Bool cached)
- admin_notes (Text)
- approved_at / approved_by
- created_at / updated_at (inherit BaseModel timestamps)
- converted_policy (FK GenericPolicy nullable)

### 4. GenericPolicy

Fields (mirrors MotorPolicy pattern generalized):

- policy_number
- quote (FK GenericQuote)
- line (FK ProductLine)
- product_details (JSON)
- coverage_details (JSON) // what was bound (benefits, limits)
- client_details (JSON)
- premium_breakdown (JSON)
- payment_details (JSON)
- underwriter_details (JSON)
- documents (JSON list)
- status (Enum: DRAFT, PENDING_PAYMENT, ACTIVE, EXPIRED, CANCELLED)
- cover_start_date / cover_end_date
- approved_at / approved_by (if admin flow)
- notes (Text)

---

## Form Schema Specification (JSON)

Each ProductConfiguration.form_schema example:

```
{
  "version": 1,
  "sections": [
    {
      "title": "Primary Insured",
      "fields": [
        {"name": "fullName", "type": "text", "label": "Full Name", "required": true },
        {"name": "age", "type": "number", "label": "Age", "required": true, "min": 18, "max": 75},
        {"name": "email", "type": "email", "label": "Email", "required": true }
      ]
    },
    {
      "title": "Coverage",
      "fields": [
        {"name": "planTier", "type": "select", "label": "Plan Tier", "options": ["Bronze","Silver","Gold"], "required": true},
        {"name": "dependants", "type": "repeater", "label": "Dependants", "itemSchema": {
          "fields": [
            {"name": "depName", "type": "text", "label": "Name", "required": true},
            {"name": "depAge", "type": "number", "label": "Age", "required": true, "min": 0, "max": 75}
          ]
        }}
      ]
    }
  ]
}
```

### Supported Field Types & Validation

**Basic Types:**

- `text`: String input with min/max length
- `number`: Integer/decimal with min/max bounds
- `email`: Email validation with regex
- `phone`: Kenya phone number format (+254...)
- `date`: Date picker with min/max date constraints
- `boolean`: Checkbox/toggle
- `select`: Dropdown with predefined options
- `radio`: Single choice from options
- `textarea`: Multi-line text input

**Advanced Types:**

- `repeater`: Dynamic array of sub-forms (dependants, beneficiaries)
- `currency`: Amount input with KES formatting
- `percentage`: 0-100% input with validation
- `file`: Document upload (ID, medical reports)
- `conditional`: Show/hide based on other field values
- `computed`: Read-only calculated fields

**Validation Rules:**

```json
{
  "name": "age",
  "type": "number",
  "required": true,
  "min": 18,
  "max": 75,
  "errorMessages": {
    "required": "Age is required",
    "min": "Minimum age is 18 years",
    "max": "Maximum age is 75 years"
  }
}
```

---

## Pricing Adapter Architecture

Create a registry (e.g. `pricing_registry.py`):

- `register_adapter(key)(func)` decorator storing callables.
- Adapter signature:

```
(def) adapter(quote: GenericQuote | dict, product: ProductConfiguration, inputs: dict) -> dict
```

Return shape:

```
{
  "base_premium": 12000,
  "adjustments": [ {"label": "Family Loading", "amount": 3000} ],
  "levies": { "itl": 30, "pcf": 30, "stamp_duty": 40 },
  "total_premium": 15070
}
```

Levy application: reuse motor logic (0.25% each + stamp duty). Provide helper `apply_standard_levies(base, include_stamp=True)`.

Initial adapters:

- `medical_basic`: per-member age bands + tier factor
- `travel_zone_duration`: zone + days + age factor
- `last_expense_sum_assured`: banded pricing + age factor

---

## Authentication & Permissions

### Role-Based Access Control

**Agent Role (IsAuthenticated):**

- Create/update/submit own quotes
- View own quotes and policies
- Calculate pricing for available products
- Convert approved quotes to policies

**Admin Role (IsAdmin):**

- All agent permissions
- View/approve/reject all pending quotes
- Access admin dashboard and reports
- Manage product configurations (future)
- View system-wide analytics

**Underwriter Role (IsUnderwriter - future):**

- View quotes for their products only
- Approve/reject quotes assigned to them
- Access underwriter-specific reports

### Permission Decorators

```python
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_quotes(request):
    # Agent sees only their quotes
    return quotes.filter(user=request.user)

@api_view(['POST'])
@permission_classes([IsAdmin])
def approve_quote(request, quote_number):
    # Only admins can approve
    pass
```

### API Authentication

- Reuse existing JWT token system from Motor2
- Include user role in token payload
- Refresh token mechanism for long sessions
- Rate limiting: 100 requests/minute per user

---

## Backend Endpoints (Phase 1: Medical Focus)

1. `GET /api/v1/lines/` → list active lines
2. `GET /api/v1/lines/{key}/products/` → list configs for line (filter `?underwriter=` optional)
3. `GET /api/v1/products/{id}/form-schema/` → return schema
4. `POST /api/v1/quotes/` → create draft ({ line_key, product_config_id })
5. `POST /api/v1/quotes/{quote_number}/update-inputs/` → save risk_inputs partial
6. `POST /api/v1/quotes/{quote_number}/calculate/` → run adapter, store pricing_snapshot, status→CALCULATED
7. `POST /api/v1/quotes/{quote_number}/submit/` → if requires_admin → PENDING_ADMIN else APPROVED
8. `POST /api/v1/quotes/{quote_number}/approve/` (admin) → APPROVED
9. `POST /api/v1/quotes/{quote_number}/reject/` (admin) → REJECTED (requires note)
10. `POST /api/v1/quotes/{quote_number}/convert/` → create GenericPolicy (guard: must APPROVED)
11. `GET /api/v1/quotes/?line=&status=` → list user quotes
12. `GET /api/v1/admin/quotes/pending/` → admin queue

---

## Frontend Implementation Plan

Components:

- ProductLinePicker (list lines)
- ProductCatalog (cards of ProductConfiguration)
- DynamicFormRenderer (sections → fields; repeaters; validation)
- QuoteSummaryCard (pricing + actions)
- AdminQuoteReviewList + Detail

Flow (Medical):

1. Select Line → Select Product → Draft Quote Created
2. Dynamic Form → Save inputs
3. Calculate → Show pricing breakdown
4. Submit → Await approval (if required)
5. Approve (admin) → Convert to policy (generate number) → Show success

---

## Validation & Business Rules

- Age limits enforced via constraints; reject on calculate if invalid.
- Dependants count limit (e.g. max 5) enforced server-side.
- Travel: date range max (e.g. 180 days) future phase.
- Last Expense: sum assured allowed bands only.

### Comprehensive Error Handling

**Error Categories:**

- `VALIDATION_FAILED`: Form validation errors
- `BUSINESS_RULE_VIOLATION`: Age limits, coverage constraints
- `UNDERWRITER_UNAVAILABLE`: Selected underwriter doesn't offer product
- `PRICING_ERROR`: Calculation adapter failure
- `ADMIN_REQUIRED`: Manual approval needed
- `INSUFFICIENT_PERMISSIONS`: Access denied
- `SYSTEM_ERROR`: Database/service failures

**Error Response Format:**

```json
{
  "success": false,
  "error": "VALIDATION_FAILED",
  "message": "Form validation failed",
  "details": {
    "age": "Above maximum age 75",
    "dependants[0].age": "Dependant age cannot exceed 21"
  },
  "error_code": "VAL_001",
  "timestamp": "2025-10-05T19:45:00Z",
  "request_id": "req_123456789"
}
```

**Quote Status Transitions:**

```
DRAFT → CALCULATED → SUBMITTED → PENDING_ADMIN → APPROVED → CONVERTED
   ↓         ↓           ↓            ↓            ↓         ↓
   ❌        ❌          ❌           ❌           ❌        ✅ Policy
```

**Status Business Rules:**

- DRAFT: Can edit inputs, no pricing yet
- CALCULATED: Pricing computed, can submit
- SUBMITTED: Locked inputs, awaiting review
- PENDING_ADMIN: Manual approval queue
- APPROVED: Ready for policy conversion
- REJECTED: End state with admin notes
- CONVERTED: Final state, policy created

---

## Performance & Scalability

### Caching Strategy

- **Product Configurations**: Cache for 1 hour (low change frequency)
- **Form Schemas**: Cache for 24 hours (static content)
- **Pricing Calculations**: Cache for 5 minutes with input hash key
- **Underwriter Data**: Cache for 6 hours

```python
# Example caching
from django.core.cache import cache

def get_cached_product_config(product_id):
    cache_key = f"product_config_{product_id}"
    config = cache.get(cache_key)
    if not config:
        config = ProductConfiguration.objects.get(id=product_id)
        cache.set(cache_key, config, 3600)  # 1 hour
    return config
```

### Database Optimization

- Index on quote_number, status, line_key
- Pagination for quote lists (50 per page)
- Lazy loading for large JSON fields
- Database connection pooling

### Background Tasks

- Quote expiry cleanup (daily cron)
- Email notifications (async queue)
- PDF generation (async with status tracking)
- Analytics aggregation (hourly)

### API Response Times

- List endpoints: < 200ms
- Calculation endpoints: < 500ms
- Form schema: < 100ms (cached)
- Admin operations: < 1s

---

## Testing Targets

- Adapter math (edge ages, zero dependants, max dependants)
- Admin gating (reject then approve path)
- Conversion requires APPROVED
- Underwriter filtering returns subset
- Form schema integrity (fields required present)

---

## Security & Data Protection

### Data Encryption

- Client personal data encrypted at rest (PII fields)
- Sensitive JSON fields use Django's encrypted JSON field
- API responses exclude sensitive internal fields
- Audit logging for all quote status changes

### Input Validation

- Sanitize all JSON inputs to prevent injection
- Validate file uploads (type, size, malware scan)
- Rate limiting on calculation endpoints
- CSRF protection on state-changing operations

### Compliance (Kenya Data Protection Act)

- Consent tracking in client_details
- Data retention policies (7 years for policies)
- Right to erasure implementation
- Data export functionality for users

### Security Headers

```python
# settings.py additions
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_HSTS_SECONDS = 31536000
CSP_DEFAULT_SRC = ("'self'",)
```

---

## Monitoring & Logging

### Application Metrics

- Quote creation rate by line
- Conversion rate (quote → policy)
- Average approval time
- Popular product configurations
- Error rates by endpoint

### Logging Strategy

```python
import logging

logger = logging.getLogger('multiline_insurance')

# Log key business events
logger.info(f"Quote {quote_number} submitted for approval", extra={
    'quote_id': quote.id,
    'line': quote.line.key,
    'user_id': request.user.id,
    'premium': quote.pricing_snapshot['total_premium']
})
```

### Health Checks

- Database connectivity
- Cache availability
- Pricing adapter registry status
- External service dependencies

---

## Migration & Seeding

- Create migration adding ProductLine, ProductConfiguration, GenericQuote, GenericPolicy
- Seed script (`scripts/seed_multiline_products.py`) inserting:
  - MEDICAL: Bronze Individual, Silver Family (with tier factors)
  - TRAVEL: East Africa Regional Plan
  - LAST_EXPENSE: Standard 250K Cover

---

## Success Criteria

- Medical line functional end-to-end (quote → approval → policy) via API & minimal frontend wiring.
- Admin approval required products blocked from convert until approved.
- Pricing adapters produce consistent, breakdown-based totals.
- Dynamic form renders from schema (no hard-coded medical inputs in component).
- Extensible registry supports adding new adapters with minimal wiring.

---

## Deployment & Configuration

### Environment Variables

```bash
# .env additions
MULTILINE_INSURANCE_ENABLED=true
ADMIN_APPROVAL_EMAIL_ENABLED=true
PRICING_CACHE_TTL=300
MAX_DEPENDANTS_PER_POLICY=6
QUOTE_EXPIRY_DAYS=30
DEFAULT_CURRENCY=KES
```

### Feature Flags

```python
# settings.py
FEATURE_FLAGS = {
    'MEDICAL_LINE_ENABLED': True,
    'TRAVEL_LINE_ENABLED': False,  # Phase 2
    'LAST_EXPENSE_ENABLED': False,  # Phase 2
    'AUTO_APPROVAL_ENABLED': False,  # Start with manual
    'PDF_GENERATION_ENABLED': True,
    'EMAIL_NOTIFICATIONS_ENABLED': True
}
```

### Database Migration Strategy

```bash
# Development
python manage.py makemigrations
python manage.py migrate
python manage.py loaddata multiline_seed_data.json

# Production
# 1. Backup database
pg_dump patamba_prod > backup_$(date +%Y%m%d).sql

# 2. Apply migrations during maintenance window
python manage.py migrate --no-input

# 3. Load seed data
python scripts/seed_multiline_products.py

# 4. Verify health checks
curl -f http://localhost:8001/api/v1/health/
```

### Rollback Plan

- Feature flags allow instant disable
- Database rollback scripts prepared
- API version compatibility maintained
- Frontend graceful degradation

---

## API Documentation

### OpenAPI/Swagger Integration

```python
# Add to existing DRF setup
from drf_spectacular.utils import extend_schema

@extend_schema(
    summary="Create new quote",
    description="Initialize quote for selected product line",
    request=QuoteCreateSerializer,
    responses={201: QuoteResponseSerializer}
)
@api_view(['POST'])
def create_quote(request):
    pass
```

### Example Request/Response Documentation

```bash
# Create Medical Quote
POST /api/v1/quotes/
{
  "line_key": "MEDICAL",
  "product_config_id": 123,
  "client_details": {
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "+254700123456"
  }
}

# Response
{
  "success": true,
  "quote_number": "MED-2025-001234",
  "status": "DRAFT",
  "form_schema_url": "/api/v1/products/123/form-schema/"
}
```

---

## Stretch (Later)

- PDF generation for GenericPolicy
- Email / notification dispatch on approval
- Versioned form schemas & adapter updates
- Role-based dashboard widgets

---

## Integration Points

### Payment Gateway Integration

- Reuse existing M-PESA/DPO Pay integration from Motor2
- Support partial payments for family medical plans
- Handle refunds for rejected quotes
- Payment status webhooks update policy status

### Document Management

- Integrate with existing AWS S3 document upload
- Medical: ID copies, medical reports, employer letters
- Travel: passport copies, visa documents
- Last Expense: beneficiary ID copies, death certificates
- OCR processing for automatic data extraction

### Communication Services

```python
# Email/SMS notifications
class NotificationService:
    def send_quote_submitted(self, quote):
        # Notify admin of pending approval
        pass

    def send_approval_notification(self, quote):
        # Notify agent quote approved
        pass

    def send_policy_created(self, policy):
        # Send policy documents to client
        pass
```

### External API Integration (Future)

- Medical provider networks (validate hospitals)
- Travel advisory services (destination risk ratings)
- KRA PIN validation for tax compliance
- Credit bureau checks for high-value policies

### Reporting & Analytics

- Integrate with existing admin dashboard
- Business intelligence queries
- Regulatory reporting (IRA submissions)
- Agent performance metrics

---

## Data Migration from Legacy Systems

### Import Strategy

- CSV import for existing medical policies
- Data mapping scripts for different formats
- Validation rules for imported data
- Rollback procedures for failed imports

### Legacy System Compatibility

- API bridges for existing policy systems
- Gradual migration approach
- Dual-write during transition period
- Data synchronization monitoring

---

## Execution Order (Recommended)

1. Models & migrations
2. Pricing registry + first adapter (medical_basic)
3. Core quote endpoints (create/update/calculate/submit)
4. Admin approve/reject + convert
5. Seed script & sample data
6. Frontend service additions
7. Dynamic form renderer (basic)
8. Medical quote flow UI
9. Tests + docs

---

Proceed with implementation following this blueprint.
