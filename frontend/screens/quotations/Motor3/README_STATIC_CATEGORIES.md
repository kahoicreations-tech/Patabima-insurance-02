# Motor3 Static Categories & Field Generator

## Overview

Motor3 uses **static hardcoded categories** and a **field generator utility** to ensure:

1. **100% consistency with Motor2 form fields** - No divergence
2. **Improved performance** - No API calls for category selection
3. **Easy maintenance** - Single source of truth with version checking
4. **Simplified development** - Generate fields declaratively

## Why Static Categories?

Motor vehicle categories (Private, Commercial, PSV, etc.) **rarely change**. Benefits:

✅ **Instant load** - No waiting for API response  
✅ **Offline support** - Categories available without network  
✅ **Type safety** - Hardcoded data is predictable  
✅ **Version control** - Track changes in Git  
✅ **Easy testing** - No mocking required

## File Structure

```
frontend/screens/quotations/Motor3/
├── constants/
│   └── staticCategories.js          # Hardcoded categories & subcategories
├── utils/
│   ├── fieldGenerator.js            # Generate Motor2-identical form fields
│   └── categoryVersionChecker.js    # Detect backend changes
├── examples/
│   └── TPVehicleFormWithGenerator.js # Example usage
└── README_STATIC_CATEGORIES.md      # This file

scripts/
└── syncMotorCategories.js           # Sync from backend to static file
```

## Usage Guide

### 1. Using Static Categories

```javascript
import {
  MOTOR_CATEGORIES,
  MOTOR_SUBCATEGORIES,
  getActiveCategories,
  getSubcategoryByCode,
  isThirdPartyLike,
} from "../constants/staticCategories";

// Get all active categories
const categories = getActiveCategories();

// Get subcategories for Private category
const privateSubcategories = MOTOR_SUBCATEGORIES.PRIVATE;

// Get specific subcategory
const thirdParty = getSubcategoryByCode("PRIVATE_THIRD_PARTY");

// Check if Third Party-like (fixed pricing)
const isTP = isThirdPartyLike("PRIVATE_THIRD_PARTY"); // true
```

### 2. Using Field Generator

```javascript
import { generateFormFields, FIELD_TYPES } from "../utils/fieldGenerator";

// Generate fields for Third Party
const fields = generateFormFields("PRIVATE_THIRD_PARTY", formData);

// Fields array contains:
// [
//   { key: 'financialInterest', type: 'radio', required: true, ... },
//   { key: 'identificationType', type: 'radio', required: true, ... },
//   { key: 'registrationNumber', type: 'text', required: true, ... },
//   { key: 'cover_start_date', type: 'date', required: true, ... },
//   { key: 'underwriter', type: 'underwriter', required: false, ... },
// ]

// For Comprehensive (adds more fields):
const comprehensiveFields = generateFormFields("PRIVATE_COMPREHENSIVE", {
  identificationType: "Vehicle Registration",
  make: "Toyota",
  model: "Axio",
});

// Adds: make, model, year, sum_insured fields
```

### 3. Checking for Updates

```javascript
import {
  checkCategoryVersion,
  autoCheckVersionInDev,
} from "../utils/categoryVersionChecker";

// Manual check
const result = await checkCategoryVersion();
if (!result.isUpToDate) {
  console.log("Categories need updating!");
  console.log(result.differences);
}

// Auto-check in development (add to Motor3 entry point)
useEffect(() => {
  autoCheckVersionInDev();
}, []);
```

### 4. Syncing from Backend

When backend categories change:

```bash
# Option 1: Using npm script (add to package.json)
npm run sync-motor-categories

# Option 2: Direct node command
node scripts/syncMotorCategories.js

# Option 3: With custom backend URL
API_BASE_URL=http://localhost:8000 node scripts/syncMotorCategories.js
```

## Field Generator Details

### Generated Field Structure

Each field object contains:

```javascript
{
  key: 'registrationNumber',           // Form data key
  label: 'Vehicle Registration',       // Display label
  type: 'text',                        // Field type (see FIELD_TYPES)
  required: true,                      // Is field required?
  placeholder: 'e.g., KDA 123A',       // Placeholder text
  help: 'Enter the vehicle...',        // Help text
  options: ['Yes', 'No'],              // For radio/select fields
}
```

### Field Types

From Motor2 `DynamicVehicleForm`:

- `text` - Text input
- `number` - Numeric input
- `formatted_number` - Currency/formatted number input
- `radio` - Radio button group
- `select` - Dropdown/accordion selector
- `date` - Date picker
- `underwriter` - Underwriter comparison section

### Conditional Fields

Fields adapt based on:

1. **Subcategory coverage type** (Third Party vs Comprehensive)
2. **Pricing model** (FIXED, BRACKET, TONNAGE, PASSENGER)
3. **Current form values** (e.g., show `make_other` if make = 'Others')

```javascript
// Third Party: minimal fields (registration + date only)
generateFormFields("PRIVATE_THIRD_PARTY", {});
// → 5 fields (financial, id type, registration, date, underwriter)

// Comprehensive: full vehicle details
generateFormFields("PRIVATE_COMPREHENSIVE", {});
// → 9 fields (+ make, model, year, sum_insured)

// "Others" selected for make: shows text input
generateFormFields("PRIVATE_COMPREHENSIVE", { make: "Others" });
// → 10 fields (+ make_other)
```

## Version Management

### Version Format

```
CATEGORY_VERSION = "1.0.0"
LAST_CATEGORY_UPDATE = "2025-12-04"
```

### Update Workflow

1. **Backend changes made** - Categories/subcategories updated in Django
2. **Detect changes** - Run `checkCategoryVersion()` periodically
3. **Sync static file** - Run `npm run sync-motor-categories`
4. **Commit changes** - Git tracks the updated `staticCategories.js`
5. **Deploy** - New version goes live with app update

### Auto-Check in Development

Add to Motor3 entry point:

```javascript
// Motor3MainScreen.js
import { autoCheckVersionInDev } from "./utils/categoryVersionChecker";

useEffect(() => {
  // Only runs in __DEV__ mode, non-blocking
  autoCheckVersionInDev();
}, []);
```

Logs warning if categories are out of date:

```
[VersionChecker] ⚠️ 3 changes detected! Consider running: npm run sync-motor-categories
```

## Benefits for Motor3

### 1. Exact Motor2 Parity

Field generator ensures Motor3 fields match Motor2 **100%**:

✅ Same field order  
✅ Same labels and placeholders  
✅ Same validation rules  
✅ Same conditional logic

### 2. Simplified Form Components

Before (manual field management):

```javascript
// Manually define every field for every subcategory
const thirdPartyFields = [...];
const comprehensiveFields = [...];
const commercialFields = [...];
// Lots of duplication!
```

After (field generator):

```javascript
// Single line generates correct fields
const fields = generateFormFields(subcategoryCode, formData);
```

### 3. Easy Field Customization

Need to add a field? Update field generator once:

```javascript
// fieldGenerator.js
const CORE_FIELDS = [
  // ... existing fields
  { key: "newField", label: "New Field", type: "text", required: false },
];
```

All subcategories inherit the change automatically!

### 4. Type-Safe Categories

Static data is fully typed and predictable:

```javascript
// TypeScript-friendly (if migrating)
type MotorCategory = {
  id: string,
  code: string,
  name: string,
  pricing_type:
    | "dynamic"
    | "tonnage"
    | "passenger"
    | "engine_capacity"
    | "varied",
  requires_tonnage: boolean,
  // ... etc
};
```

## Best Practices

### ✅ Do

- Use field generator for **all** Motor3 forms
- Run version check **periodically** in development
- Sync static file **after** backend category changes
- Commit updated `staticCategories.js` to Git
- Document any manual changes to field generator

### ❌ Don't

- Hardcode fields in individual form components
- Mix static and API-fetched categories
- Skip version checking for months
- Manually edit `staticCategories.js` (use sync script)
- Forget to update VERSION/LAST_UPDATED after sync

## Migration Path

### Existing TPVehicleForm → Field Generator

Replace manual fields with generator:

```javascript
// BEFORE: Manual fields
const fields = [
  { key: 'registrationNumber', ... },
  { key: 'cover_start_date', ... },
  // ... 20+ more fields
];

// AFTER: Field generator
import { generateFormFields } from '../utils/fieldGenerator';
const fields = generateFormFields(subcategoryCode, formData);
```

Rendering logic stays the same - just loop through `fields`.

## Troubleshooting

### "Categories out of date" warning

**Cause**: Backend has new/modified categories  
**Fix**: Run `npm run sync-motor-categories`

### Field generator missing fields

**Cause**: Subcategory code not found in static data  
**Fix**: Sync categories from backend

### Wrong fields showing for product

**Cause**: Subcategory requirements not matching backend  
**Fix**: Re-sync, verify `pricing_model` and category flags

### Sync script fails with network error

**Cause**: Django backend not running or wrong URL  
**Fix**:

- Start Django: `python manage.py runserver`
- Check `API_BASE_URL` in sync script
- Verify backend accessible: `curl http://localhost:8000/api/v1/motor2/categories/`

## npm Scripts to Add

Add to `package.json`:

```json
{
  "scripts": {
    "sync-motor-categories": "node scripts/syncMotorCategories.js",
    "check-category-version": "node -e \"require('./scripts/syncMotorCategories.js').checkCategoryVersion()\""
  }
}
```

## Example: Complete Form Component

See `examples/TPVehicleFormWithGenerator.js` for a complete working example using:

- Static categories
- Field generator
- Motor2-identical styling
- Proper validation
- Dynamic field rendering

## Questions?

**Q: What if categories change frequently?**  
A: Then keep using API-fetched categories. Static approach assumes infrequent changes.

**Q: Can I mix static and API categories?**  
A: Not recommended - pick one approach for consistency.

**Q: How often should I sync?**  
A: After each backend category change. Run version check weekly in dev.

**Q: Does this work offline?**  
A: Yes! Categories are hardcoded, no network needed for category selection.

**Q: What about pricing data?**  
A: Pricing is still fetched from API (changes frequently). Only categories are static.

## Summary

Motor3 static categories + field generator = **Motor2 parity with better performance**.

✅ Fields match Motor2 exactly  
✅ No API calls for categories  
✅ Easy to maintain and update  
✅ Type-safe and predictable  
✅ Version-controlled and testable

**Next Steps:**

1. Review example: `examples/TPVehicleFormWithGenerator.js`
2. Update your form components to use field generator
3. Add auto-check to Motor3 entry point
4. Set up npm scripts for syncing
5. Document any custom field logic in `fieldGenerator.js`
