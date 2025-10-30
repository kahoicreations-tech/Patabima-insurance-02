# Insurance Categories System

## Overview

The insurance categories system has been centralized to provide a single source of truth for all insurance category data across the PataBima app. This improves maintainability, consistency, and allows for better feature management.

## File Structure

```
src/data/
├── insuranceCategories.js    # Main categories data and utilities
├── mockData.js              # Updated to reference categories
└── index.js                 # Centralized data exports
```

## Key Features

### 1. **Centralized Data Management**

- All category information in one file
- Consistent data structure across the app
- Easy to update and maintain

### 2. **Status-Aware System**

Categories now have status management:

- `ACTIVE`: Fully functional with navigation
- `MAINTENANCE`: Temporarily unavailable
- `COMING_SOON`: Planned features
- `DISABLED`: Completely unavailable

### 3. **Enhanced Category Information**

Each category now includes:

- Basic info (id, name, description)
- Visual elements (icon, image, color)
- Business data (commission rates, minimum premiums)
- Features and capabilities
- Search tags
- Type classification

### 4. **Utility Functions**

Powerful helper functions for category management:

```javascript
import {
  getActiveCategories,
  getPopularCategories,
  getCategoriesByType,
  searchCategories,
} from "../../data";
```

## Usage Examples

### Basic Import and Usage

```javascript
import { INSURANCE_CATEGORIES, CATEGORY_STATUS } from "../../data";

// Get all categories
const allCategories = INSURANCE_CATEGORIES;

// Filter active categories
const activeCategories = INSURANCE_CATEGORIES.filter(
  (cat) => cat.status === CATEGORY_STATUS.ACTIVE
);
```

### Using Utility Functions

```javascript
import {
  getActiveCategories,
  getCategoryById,
  searchCategories,
} from "../../data";

// Get only active categories
const activeCategories = getActiveCategories();

// Find specific category
const motorCategory = getCategoryById("motor-vehicle");

// Search categories
const searchResults = searchCategories("motor");
```

### Status-Based Navigation

```javascript
import { getCategoryStatusMessage, CATEGORY_STATUS } from "../../data";

const handleCategoryPress = (category) => {
  if (category.status === CATEGORY_STATUS.ACTIVE && category.screen) {
    navigation.navigate(category.screen);
  } else {
    const message = getCategoryStatusMessage(category);
    Alert.alert("Status", message);
  }
};
```

## Category Configuration

### Adding New Categories

1. Add to `INSURANCE_CATEGORIES` array in `insuranceCategories.js`
2. Include all required fields
3. Add appropriate images to assets folder
4. Create navigation screen if applicable

### Updating Category Status

Simply change the `status` field in the category object:

```javascript
{
  id: 'travel',
  name: 'Travel Insurance',
  // ... other fields
  status: CATEGORY_STATUS.ACTIVE, // Change to activate
}
```

### Commission and Business Rules

Configure business logic per category:

```javascript
{
  commissionRate: 0.15, // 15% commission
  minimumPremium: 15000, // KES 15,000 minimum
  features: ['Coverage A', 'Coverage B'],
  // ... other business rules
}
```

## Migration Guide

### From Old System

The old numeric ID system is still supported through the `getLegacyCategories()` function:

```javascript
// Old way (still works)
const legacyCategories = getLegacyCategories();

// New way (recommended)
const categories = INSURANCE_CATEGORIES;
```

### Component Updates

Update existing components to use the new structure:

```javascript
// Before
<Text>{category.name}</Text>

// After (works the same)
<Text>{category.name}</Text>

// New capabilities
<Text>{category.shortName}</Text>
<Text>{category.description}</Text>
<Badge status={category.status} />
```

## Best Practices

1. **Always use the centralized data**: Import from `../../data` instead of hardcoding
2. **Check category status**: Before navigation, verify the category is active
3. **Use utility functions**: Leverage provided helpers for common operations
4. **Type safety**: Use TypeScript interfaces for better development experience
5. **Consistent naming**: Use string-based IDs following kebab-case convention

## TypeScript Support

Full TypeScript interfaces are available:

```typescript
import { InsuranceCategory, CategoryStatus } from "../../types";

const category: InsuranceCategory = {
  // ... properly typed category object
};
```

## Future Enhancements

The centralized system enables:

- Remote category management via API
- A/B testing different category sets
- Dynamic pricing and commission updates
- User-specific category filtering
- Analytics and usage tracking per category

## API Integration

The system is designed to work with the existing API layer:

```javascript
import { categoriesAPI } from "../../services/core";

// Future: Load categories from API
const remoteCategories = await categoriesAPI.getCategories();
```
