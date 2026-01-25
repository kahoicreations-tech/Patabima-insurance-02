# Motor 2 Underwriter Pricing Setup Guide

This guide walks you through populating underwriter pricing for **all Motor 2 subcategories** in the PataBima backend database.

## 📋 What This Does

The pricing population script will create pricing data for:

- **7 Underwriters**: Madison, PATABIMA, Jubilee, UAP, APA, Britam, CIC
- **60+ Products** across 6 categories:
  - Private (4 products: TP, TP Ext, TOR, Comprehensive)
  - Commercial (9+ products with tonnage-based pricing)
  - PSV (6+ products with passenger capacity pricing)
  - Motorcycle (4 products)
  - TukTuk (4 products)
  - Special (11 products for ambulances, tractors, etc.)

### Pricing Tiers

Underwriters are grouped by price competitiveness:

| Tier                 | Underwriters               | Price Multiplier |
| :------------------- | :------------------------- | :--------------- |
| **LOW** (Best Price) | Madison, PATABIMA, Jubilee | 1.0x (base)      |
| **MEDIUM**           | UAP, APA                   | 1.18x (+18%)     |
| **HIGH**             | Britam, CIC                | 1.32x (+32%)     |

This ensures **realistic price variation** in the comparison flow.

---

## 🚀 Quick Start (All-in-One)

**Option 1: Run the complete setup script**

```powershell
cd C:\Users\USER\Desktop\PATABIMA01
.\scripts\setup_motor2_pricing.ps1
```

This script will:

1. ✅ Verify Python environment
2. ✅ Run Django migrations
3. ✅ Create underwriters
4. ✅ Populate all pricing data
5. ✅ Verify data integrity

---

## 📝 Step-by-Step (Manual)

If you prefer to run each step manually:

### Step 1: Activate Virtual Environment

```powershell
cd C:\Users\USER\Desktop\PATABIMA01
.\.venv\Scripts\Activate.ps1
```

### Step 2: Navigate to Backend

```powershell
cd insurance-app
```

### Step 3: Run Migrations

```powershell
# Create new migration files (if models changed)
python manage.py makemigrations

# Apply migrations to database
python manage.py migrate
```

### Step 4: Populate Pricing Data

**Option A: Using Django shell**

```powershell
python manage.py shell
```

Then paste:

```python
exec(open('../scripts/populate_motor2_pricing.py').read())
```

**Option B: Direct execution**

```powershell
python -c "exec(open('../scripts/populate_motor2_pricing.py').read())"
```

### Step 5: Start Django Server

```powershell
python manage.py runserver
```

### Step 6: Test API Endpoints

In a **new PowerShell terminal**:

```powershell
cd C:\Users\USER\Desktop\PATABIMA01
.\scripts\test_motor2_api.ps1
```

---

## 🧪 Testing the Flow

### 1. Test in Browser

Open: http://localhost:8000/api/motor2/categories/

You should see:

```json
{
  "categories": [
    {"code": "PRIVATE", "name": "Private", ...},
    {"code": "COMMERCIAL", "name": "Commercial", ...},
    ...
  ]
}
```

### 2. Test Underwriter Comparison

**Third Party (Fixed Pricing)**

```bash
curl -X POST http://localhost:8000/api/motor2/pricing/compare-by-subcategory/ \
  -H "Content-Type: application/json" \
  -d '{
    "subcategory_code": "PRIVATE_THIRD_PARTY",
    "cover_start_date": "2025-11-27"
  }'
```

Expected response:

```json
{
  "comparisons": [
    {
      "underwriter_code": "MADISON",
      "underwriter_name": "Madison Insurance",
      "result": {
        "base_premium": "2975.00",
        "pricing_model": "FIXED"
      }
    },
    ...
  ]
}
```

**Comprehensive (Bracket Pricing)**

```bash
curl -X POST http://localhost:8000/api/motor2/pricing/compare-by-subcategory/ \
  -H "Content-Type: application/json" \
  -d '{
    "subcategory_code": "PRIVATE_COMPREHENSIVE",
    "cover_start_date": "2025-11-27",
    "sum_insured": 1000000
  }'
```

Expected response:

```json
{
  "comparisons": [
    {
      "underwriter_code": "MADISON",
      "underwriter_name": "Madison Insurance",
      "result": {
        "base_premium": "35000.00",
        "pricing_model": "BRACKET",
        "bracket_info": {
          "min_sum_insured": 500001,
          "max_sum_insured": 1000000,
          "rate_percentage": 3.5
        }
      }
    },
    ...
  ]
}
```

---

## 🔍 Verifying Database Records

### Check Pricing Records

```powershell
cd insurance-app
python manage.py shell
```

```python
from app.models import MotorPricing, CommercialTonnagePricing, PSVPLLPricing, InsuranceProvider

# Count records
print(f"Underwriters: {InsuranceProvider.objects.filter(supported_categories__contains=['MOTOR']).count()}")
print(f"Fixed/Bracket Pricing: {MotorPricing.objects.count()}")
print(f"Tonnage Pricing: {CommercialTonnagePricing.objects.count()}")
print(f"Passenger/PLL Pricing: {PSVPLLPricing.objects.count()}")

# Sample pricing
madison = InsuranceProvider.objects.get(code='MADISON')
pricing = MotorPricing.objects.filter(underwriter=madison).first()
print(f"\nSample: {pricing.subcategory.subcategory_code} = KSh {pricing.base_premium}")
```

### Check Underwriter List

```python
from app.models import InsuranceProvider

for uw in InsuranceProvider.objects.all():
    print(f"{uw.code}: {uw.name} - {uw.display_mode}")
```

---

## 📊 Expected Results

After running the scripts, you should have:

| Model                        | Expected Count                                           |
| :--------------------------- | :------------------------------------------------------- |
| InsuranceProvider            | 7 underwriters                                           |
| MotorPricing (Fixed/Bracket) | ~28 records (4 subcategories × 7 underwriters)           |
| CommercialTonnagePricing     | ~350 records (7 tonnage brackets × 9 subcats × 7 UW)     |
| PSVPLLPricing                | ~84 records (6 capacity brackets × 2 PLL amounts × 7 UW) |
| **Total**                    | **~462 pricing records**                                 |

---

## 🐛 Troubleshooting

### Issue: Django not found

```
❌ Django is not installed in the virtual environment
```

**Solution:**

```powershell
.\.venv\Scripts\Activate.ps1
pip install -r insurance-app\requirements.txt
```

---

### Issue: Migration errors

```
❌ No such table: app_motorpricing
```

**Solution:**

```powershell
cd insurance-app
python manage.py makemigrations
python manage.py migrate
```

---

### Issue: No pricing records created

**Check if subcategories exist:**

```python
from app.models import MotorSubcategory
print(MotorSubcategory.objects.filter(is_active=True).count())
```

If 0, you need to populate subcategories first:

```powershell
python manage.py loaddata motor2_subcategories.json
```

---

### Issue: API returns 404

**Check server is running:**

```powershell
cd insurance-app
python manage.py runserver
```

**Check URL routing:**

```python
# In Django shell
from django.urls import get_resolver
print(get_resolver().url_patterns)
```

---

## 🎯 Next Steps

After pricing is populated:

1. **Frontend Testing**

   - Start Expo dev server: `npm start`
   - Navigate to Motor 2 flow
   - Select "Private → Third Party"
   - Verify underwriter comparison shows 7 options

2. **Verify Levies Applied**

   - Frontend should add:
     - ITL: 0.25% of base premium
     - PCF: 0.25% of base premium
     - Stamp Duty: KSh 40 fixed
   - Total premium = base + ITL + PCF + stamp duty

3. **Test All Categories**
   - Private ✅
   - Commercial (tonnage input required)
   - PSV (passenger capacity required)
   - Motorcycle ✅
   - TukTuk ✅
   - Special ✅

---

## 📚 Related Files

- **Pricing Script**: `scripts/populate_motor2_pricing.py`
- **Setup Script**: `scripts/setup_motor2_pricing.ps1`
- **Test Script**: `scripts/test_motor2_api.ps1`
- **Models**: `insurance-app/app/models.py`
- **Frontend Data**: `frontend/data/motor2/subcategories/`

---

## 🆘 Need Help?

If you encounter issues:

1. Check Django logs: `insurance-app/logs/`
2. Check database directly: `sqlite3 insurance-app/db.sqlite3` (or PostgreSQL client)
3. Review migrations: `python manage.py showmigrations`
4. Clear cache: `python manage.py clearcache` (if command exists)

---

**Last Updated**: November 27, 2025  
**Version**: 1.0.0
