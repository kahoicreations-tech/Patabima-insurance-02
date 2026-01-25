# Motor 2 Pricing Setup - Quick Reference

## 🎯 Goal

Populate underwriter pricing for **ALL Motor 2 subcategories** so you can test the complete flow in the frontend.

## ⚡ Quick Setup (One Command)

```powershell
cd C:\Users\USER\Desktop\PATABIMA01
.\scripts\setup_motor2_pricing.ps1
```

**This script does everything:**

1. Verifies Python environment
2. Runs Django migrations
3. Creates 7 underwriters (Madison, PATABIMA, Jubilee, UAP, APA, Britam, CIC)
4. Populates ~462 pricing records across all categories
5. Verifies data integrity

## 📦 What Gets Created

| Category   | Products                  | Pricing Type  | Records |
| :--------- | :------------------------ | :------------ | :------ |
| Private    | 4 (TP, TP Ext, TOR, Comp) | Fixed/Bracket | 28      |
| Commercial | 9 (Own Goods, Cartage)    | Tonnage       | ~350    |
| PSV        | 6+ (Matatu, Bus)          | Passenger     | ~84     |
| Motorcycle | 4                         | Fixed/Bracket | 28      |
| TukTuk     | 4                         | Fixed/Bracket | 28      |
| Special    | 11 (Ambulance, Tractor)   | Fixed         | 77      |

## 🧪 Testing

### Start Backend

```powershell
cd insurance-app
python manage.py runserver
```

### Test API

```powershell
# In new terminal
.\scripts\test_motor2_api.ps1
```

### Test Frontend

```powershell
npm start
# Then navigate to Motor 2 flow in the app
```

## ✅ Success Indicators

You know it worked when:

- ✓ 7 underwriters appear in comparison
- ✓ Prices vary (Madison lowest, Britam/CIC highest)
- ✓ All Motor 2 categories show pricing
- ✓ Levies (ITL, PCF, Stamp Duty) are applied correctly

## 🔗 Full Documentation

See `scripts/README_MOTOR2_PRICING.md` for detailed troubleshooting and manual steps.
