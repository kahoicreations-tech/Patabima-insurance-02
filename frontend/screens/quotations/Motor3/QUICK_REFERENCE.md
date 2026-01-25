# Motor3 Field Generator - Quick Reference

## Import What You Need

```javascript
// Static categories
import {
  MOTOR_CATEGORIES,
  MOTOR_SUBCATEGORIES,
  getActiveCategories,
  getSubcategoryByCode,
  isThirdPartyLike,
} from "../constants/staticCategories";

// Field generator
import { generateFormFields, FIELD_TYPES } from "../utils/fieldGenerator";

// Version checker (dev only)
import {
  checkCategoryVersion,
  autoCheckVersionInDev,
} from "../utils/categoryVersionChecker";
```

## Generate Fields (One Line!)

```javascript
const fields = generateFormFields(subcategoryCode, formData);
```

## Field Types

| Type               | Use Case            | Example                     |
| ------------------ | ------------------- | --------------------------- |
| `text`             | Text input          | Registration, Chassis       |
| `number`           | Numeric input       | Year, Tonnage, Capacity     |
| `formatted_number` | Currency            | Sum Insured                 |
| `radio`            | Radio buttons       | Financial Interest, ID Type |
| `select`           | Dropdown            | Make, Model                 |
| `date`             | Date picker         | Cover Start Date            |
| `underwriter`      | Underwriter section | Comparison cards            |

## Render Fields

```javascript
const renderField = (field) => {
  switch (field.type) {
    case FIELD_TYPES.TEXT:
      return <TextInput {...field} />;
    case FIELD_TYPES.RADIO:
      return <RadioGroup {...field} />;
    case FIELD_TYPES.SELECT:
      return <DropdownSelect {...field} />;
    case FIELD_TYPES.DATE:
      return <DatePicker {...field} />;
    // ... etc
  }
};

// In render:
{
  fields.map((field) => renderField(field));
}
```

## Field Counts by Product

| Product       | Fields | Notes                              |
| ------------- | ------ | ---------------------------------- |
| Third Party   | 5      | Minimal (registration + date)      |
| Comprehensive | 9+     | Full vehicle details + sum_insured |
| Commercial    | 6+     | + tonnage                          |
| PSV           | 7+     | + capacity + passenger_type        |
| Motorcycle    | 6+     | + engine_capacity                  |

## Check Version (Dev Mode)

```javascript
// Add to Motor3 entry component
useEffect(() => {
  autoCheckVersionInDev(); // Non-blocking
}, []);
```

## Sync from Backend

```bash
# When backend categories change:
npm run sync-motor-categories

# Or directly:
node scripts/syncMotorCategories.js

# Custom URL:
API_BASE_URL=http://localhost:8000 node scripts/syncMotorCategories.js
```

## Common Patterns

### Get Category Info

```javascript
const category = getCategoryByCode("PRIVATE");
console.log(category.name); // "Private"
console.log(category.requires_tonnage); // false
```

### Get Subcategory Info

```javascript
const subcategory = getSubcategoryByCode("PRIVATE_THIRD_PARTY");
console.log(subcategory.pricing_model); // "FIXED"
console.log(subcategory.coverage_type); // "THIRD_PARTY"
```

### Check Third Party-like

```javascript
if (isThirdPartyLike(subcategoryCode)) {
  // Minimal fields, fixed pricing
} else {
  // Full vehicle details needed
}
```

### Validate Form Data

```javascript
import { validateFormData } from "../utils/fieldGenerator";

const { isValid, errors } = validateFormData(fields, formData);
if (!isValid) {
  setErrors(errors);
}
```

## Field Structure

```javascript
{
  key: 'registrationNumber',          // Form data key
  label: 'Vehicle Registration',      // Display label
  type: 'text',                       // Field type
  required: true,                     // Required?
  placeholder: 'e.g., KDA 123A',      // Placeholder
  help: 'Enter vehicle...',           // Help text
  options: ['Yes', 'No'],             // For radio/select
}
```

## Conditional Fields

Fields automatically adapt:

```javascript
// Empty formData → basic fields
generateFormFields("PRIVATE_COMPREHENSIVE", {});
// → 9 fields

// "Others" selected for make → adds make_other
generateFormFields("PRIVATE_COMPREHENSIVE", { make: "Others" });
// → 10 fields

// Chassis Number selected → changes label
generateFormFields("PRIVATE_THIRD_PARTY", {
  identificationType: "Chassis Number",
});
// → registrationNumber label becomes "Chassis Number"
```

## Troubleshooting

| Issue                         | Solution                              |
| ----------------------------- | ------------------------------------- |
| "Categories out of date"      | Run `npm run sync-motor-categories`   |
| Field generator returns empty | Check `subcategoryCode` is valid      |
| Wrong fields showing          | Verify `formData` has correct values  |
| Sync script fails             | Ensure Django running at API_BASE_URL |

## File Locations

```
frontend/screens/quotations/Motor3/
├── constants/
│   └── staticCategories.js           ← Import categories from here
├── utils/
│   ├── fieldGenerator.js             ← Import generateFormFields from here
│   └── categoryVersionChecker.js     ← Import version checker from here
└── examples/
    └── TPVehicleFormWithGenerator.js ← Copy this pattern

scripts/
└── syncMotorCategories.js            ← Run this to sync
```

## Example: Complete Form Component

```javascript
import React, { useState, useMemo } from "react";
import { View, ScrollView } from "react-native";
import { generateFormFields } from "../utils/fieldGenerator";

const MyForm = ({ subcategoryCode }) => {
  const [formData, setFormData] = useState({});

  // Generate fields
  const fields = useMemo(() => {
    return generateFormFields(subcategoryCode, formData);
  }, [subcategoryCode, formData]);

  // Handle change
  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // Render field
  const renderField = (field) => {
    switch (field.type) {
      case "text":
        return (
          <TextInput
            label={field.label}
            value={formData[field.key] || ""}
            onChangeText={(val) => handleChange(field.key, val)}
            placeholder={field.placeholder}
          />
        );
      // ... other types
    }
  };

  return (
    <ScrollView>
      {fields.map((field) => (
        <View key={field.key}>{renderField(field)}</View>
      ))}
    </ScrollView>
  );
};
```

## Cheat Sheet

```javascript
// 1. Generate fields
const fields = generateFormFields(subcategoryCode, formData);

// 2. Loop and render
fields.map(field => renderField(field))

// 3. Handle changes
handleChange(key, value)

// 4. Update formData
setFormData(prev => ({ ...prev, [key]: value }))

// 5. Re-generate on formData change
useMemo(() => generateFormFields(...), [formData])
```

## Remember

✅ **Field generator gives configuration, not UI** - You control styling  
✅ **Fields match Motor2 exactly** - No guessing needed  
✅ **Sync only when backend changes** - Rare occurrence  
✅ **Version check in dev mode only** - No production overhead  
✅ **Static categories = offline support** - No network needed

## Links

- Full Guide: `README_STATIC_CATEGORIES.md`
- Example: `examples/TPVehicleFormWithGenerator.js`
- Summary: `docs/motor3/MOTOR3_STATIC_IMPLEMENTATION_SUMMARY.md`

---

**Need help?** Check the full `README_STATIC_CATEGORIES.md` for detailed examples and troubleshooting.
