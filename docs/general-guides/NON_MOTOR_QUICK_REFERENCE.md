# Non-Motor Insurance - Quick Reference Guide

**Status:** ✅ OPERATIONAL | **Date:** October 19, 2025

---

## 🚀 Quick Start

### Backend (Django)

```bash
# Start server
cd insurance-app
python manage.py runserver 0.0.0.0:8000

# Access admin
http://localhost:8000/admin/
```

### Frontend (React Native)

```bash
# All screens already connected
# Located in: frontend/screens/quotations/
```

---

## 📱 Available Insurance Lines

| Line                   | Screen Location                                                 | Status | Key Fields |
| ---------------------- | --------------------------------------------------------------- | ------ | ---------- |
| Travel                 | `quotations/TravelQuotationScreen.js`                           | ✅     | 7 fields   |
| Personal Accident      | `quotations/PersonalAccidentQuotationScreen.js`                 | ✅     | 3 fields   |
| Last Expense           | `quotations/LastExpenseQuotationScreen.js`                      | ✅     | 2 fields   |
| WIBA                   | `quotations/WIBAQuotationScreen.js`                             | ✅     | Complex    |
| Professional Indemnity | `quotations/ProfessionalIndemnityQuotationScreen.js`            | ✅     | 20+ fields |
| Medical                | `quotations/medical/EnhancedIndividualMedicalQuotation.js`      | ✅     | 12 fields  |
| Domestic Package       | `quotations/domestic-package/DomesticPackageQuotationScreen.js` | ✅     | 18+ fields |

---

## 🔌 API Endpoints

### Agent Endpoints

```
POST   /api/v1/public_app/manual_quotes      # Submit quote
GET    /api/v1/public_app/manual_quotes      # List quotes
GET    /api/v1/public_app/manual_quotes/{ref} # Get detail
```

### Admin Endpoints (Staff Only)

```
GET    /api/v1/public_app/admin/manual_quotes        # List all
PATCH  /api/v1/public_app/admin/manual_quotes/{ref}  # Update
```

---

## 💻 Code Examples

### Frontend - Submit Quote

```javascript
import api from "../../../services/DjangoAPIService";

const handleSubmit = async () => {
  const formData = {
    client_name: "John Doe",
    travelers_age: 35,
    destination: "Dubai",
    // ... other fields
  };

  const response = await api.submitManualQuote("TRAVEL", formData);

  if (response?.success) {
    Alert.alert("Success", "Quote submitted!");
  }
};
```

### Backend - Process Quote (Admin)

```python
# Django admin or shell
from app.models import ManualQuote

# Get pending quotes
quotes = ManualQuote.objects.filter(status='PENDING_ADMIN_REVIEW')

# Update quote
quote = ManualQuote.objects.get(reference='MQ-20251019-0001')
quote.status = 'COMPLETED'
quote.computed_premium = 5567.50
quote.levies_breakdown = {
    'base_premium': 5500.00,
    'ITL': 13.75,
    'PCF': 13.75,
    'stamp_duty': 40.00,
    'total_premium': 5567.50
}
quote.admin_notes = 'Approved - Jubilee Insurance'
quote.save()
```

---

## 🔄 Status Workflow

```
PENDING_ADMIN_REVIEW → IN_PROGRESS → COMPLETED
                                   ↘ REJECTED
```

- **PENDING_ADMIN_REVIEW**: Just submitted by agent
- **IN_PROGRESS**: Admin is working on it
- **COMPLETED**: Priced and ready
- **REJECTED**: Not approved

---

## 🧮 Premium Calculation (with Levies)

```python
base_premium = 5500.00
ITL = base_premium * 0.0025  # 0.25% = 13.75
PCF = base_premium * 0.0025  # 0.25% = 13.75
stamp_duty = 40.00           # Fixed

total_premium = base_premium + ITL + PCF + stamp_duty
# = 5500 + 13.75 + 13.75 + 40 = 5,567.50
```

---

## 🧪 Testing Commands

### Test API Endpoint

```powershell
# Should return 401 (auth required)
Invoke-WebRequest -Uri "http://localhost:8000/api/v1/public_app/manual_quotes" -Method GET
```

### Check Database

```python
# Django shell
python manage.py shell

from app.models import ManualQuote
ManualQuote.objects.count()  # Number of quotes
ManualQuote.objects.filter(status='PENDING_ADMIN_REVIEW')  # Pending
```

### Create Test User

```python
from django.contrib.auth import get_user_model
User = get_user_model()

agent = User.objects.create_user(
    email='test@patabima.co.ke',
    phonenumber='254712345678',
    password='TestPass123!',
    is_agent=True
)
```

---

## 📊 Admin Quick Actions

### Filter Quotes

1. Open http://localhost:8000/admin/
2. Click "Manual quotes"
3. Use filters:
   - Status: PENDING_ADMIN_REVIEW
   - Line key: TRAVEL, WIBA, etc.
   - Created date

### Process Quote

1. Click on quote reference
2. Review payload (client data)
3. Contact underwriter
4. Enter computed_premium
5. Add levies_breakdown JSON
6. Update status to COMPLETED
7. Add admin_notes
8. Save

---

## 🐛 Troubleshooting

### Server won't start

```bash
# Check if already running
netstat -ano | findstr :8000

# Kill process if needed
taskkill /PID <process_id> /F
```

### 404 on endpoint

```
# Correct URL (no trailing slash)
✅ /api/v1/public_app/manual_quotes
❌ /api/v1/public_app/manual_quotes/
```

### Quote not in database

```bash
# Check migrations
python manage.py showmigrations app

# Run if needed
python manage.py migrate
```

---

## 📁 Key Files

### Backend

- `insurance-app/app/models.py` - ManualQuote model
- `insurance-app/app/admin.py` - Admin interface
- `insurance-app/app/manual_quote_views.py` - API views
- `insurance-app/app/serializers.py` - Serializers
- `insurance-app/app/urls.py` - URL routing

### Frontend

- `src/services/DjangoAPIService.js` - API client
- `frontend/screens/quotations/` - All quote screens

---

## 🔐 Authentication

### Get Token

```bash
POST /api/v1/public_app/auth/login
{
  "email": "agent@patabima.co.ke",
  "password": "password"
}

# Response
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### Use Token

```bash
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

---

## 📞 Support

- **Documentation:** `docs/NON_MOTOR_BACKEND_INTEGRATION_STATUS.md`
- **Completion Report:** `docs/NON_MOTOR_BACKEND_ACTIVATION_COMPLETE.md`
- **Server Status:** http://localhost:8000/admin/
- **API Root:** http://localhost:8000/api/v1/public_app/

---

## ✅ Quick Health Check

```bash
# 1. Server running?
curl http://localhost:8000/admin/

# 2. Database accessible?
python manage.py shell -c "from app.models import ManualQuote; print(ManualQuote.objects.count())"

# 3. API responding?
curl http://localhost:8000/api/v1/public_app/manual_quotes

# Expected: 401 Unauthorized (correct!)
```

---

**Last Updated:** October 19, 2025  
**System Status:** ✅ OPERATIONAL  
**Version:** 1.0
