# Data Directory

This directory contains data files, fixtures, and sample data used for development, testing, and analysis in the PataBima application.

## 📁 Structure

```
data/
├── motor2/          # Motor 2 insurance data files
└── pricing/         # Pricing data and analysis files
```

## 🚗 Motor 2 Data (`motor2/`)

### Files

**motor2_private_comp_1m.json**
- Comprehensive data for private vehicle motor insurance
- Sum insured: 1,000,000 KSh
- Includes all underwriter pricing
- Used for pricing validation and testing

**motor2_sweep.json**
- Complete sweep of Motor 2 insurance products
- All categories: Private, Commercial, PSV, Motorcycle, TukTuk, Special
- Multiple sum insured values
- Underwriter comparison data

### Data Structure

```json
{
  "category": "Private",
  "subcategory": "Comprehensive",
  "sumInsured": 1000000,
  "underwriters": [
    {
      "name": "Underwriter Name",
      "premium": 45000,
      "levies": {
        "itl": 112.50,
        "pcf": 112.50,
        "stampDuty": 40
      },
      "totalPremium": 45265
    }
  ]
}
```

### Usage

**Pricing Validation:**
```python
import json

with open('data/motor2/motor2_private_comp_1m.json') as f:
    pricing_data = json.load(f)
    
# Validate underwriter pricing
for underwriter in pricing_data['underwriters']:
    assert underwriter['premium'] > 0
    assert underwriter['totalPremium'] > underwriter['premium']
```

**Testing Underwriter Comparison:**
```javascript
const pricingData = require('./data/motor2/motor2_sweep.json');

// Test underwriter comparison UI
const underwriters = pricingData.underwriters;
const cheapest = underwriters.reduce((min, u) => 
  u.totalPremium < min.totalPremium ? u : min
);
```

## 💰 Pricing Data (`pricing/`)

### Files

**pataBima_pricing_features_preview.json**
- Comprehensive pricing features preview
- All motor insurance categories
- Pricing brackets and scales
- Feature flags for pricing models

### Data Structure

```json
{
  "features": {
    "dynamicPricing": true,
    "underwriterComparison": true,
    "realTimeCalculation": true
  },
  "categories": [
    {
      "name": "Private",
      "subcategories": [...],
      "pricingModel": "bracket-based"
    }
  ]
}
```

### Usage

**Feature Flag Checking:**
```javascript
const features = require('./data/pricing/pataBima_pricing_features_preview.json');

if (features.features.underwriterComparison) {
  // Show underwriter comparison UI
  enableUnderwriterComparison();
}
```

**Pricing Model Selection:**
```python
import json

with open('data/pricing/pataBima_pricing_features_preview.json') as f:
    pricing_features = json.load(f)

for category in pricing_features['categories']:
    if category['pricingModel'] == 'bracket-based':
        use_bracket_pricing(category)
    elif category['pricingModel'] == 'fixed':
        use_fixed_pricing(category)
```

## 📊 Data Usage Scenarios

### 1. Development Testing
- Load sample data for UI development
- Test pricing calculations with known values
- Validate underwriter comparison logic

### 2. Unit Testing
- Use as test fixtures in automated tests
- Verify pricing accuracy against expected results
- Test edge cases and boundary conditions

### 3. Analysis
- Analyze pricing trends across underwriters
- Compare premium calculations
- Validate levy calculations (ITL, PCF, Stamp Duty)

### 4. Documentation
- Generate pricing examples
- Create user guides with real data
- Demonstrate feature capabilities

## 🔍 Data Validation

### Motor 2 Data Validation

**Required Fields:**
- `category` - Motor insurance category
- `subcategory` - Specific product type
- `sumInsured` - Vehicle value
- `underwriters` - Array of underwriter pricing

**Validation Script:**
```python
def validate_motor2_data(data):
    assert 'category' in data
    assert 'subcategory' in data
    assert 'sumInsured' in data
    assert 'underwriters' in data
    assert len(data['underwriters']) > 0
    
    for underwriter in data['underwriters']:
        assert 'name' in underwriter
        assert 'premium' in underwriter
        assert 'totalPremium' in underwriter
```

### Pricing Data Validation

**Required Fields:**
- `features` - Feature flags object
- `categories` - Array of insurance categories
- `pricingModel` - Pricing calculation method

## 📝 Data Maintenance

### Adding New Data Files

1. Place file in appropriate subdirectory (`motor2/` or `pricing/`)
2. Use descriptive filename with category/purpose
3. Include date or version in filename if applicable
4. Update this README with file description

### Updating Existing Data

1. Create backup of original file
2. Update data structure
3. Validate against schema
4. Test with dependent code
5. Document changes in commit message

### Data File Naming Convention

- **Motor 2**: `motor2_{category}_{details}.json`
- **Pricing**: `pricing_{feature}_{version}.json`
- **Fixtures**: `fixture_{purpose}.json`

## 🚀 Quick Start

### Load Motor 2 Data (Python)

```python
import json

# Load comprehensive pricing data
with open('data/motor2/motor2_private_comp_1m.json') as f:
    motor_data = json.load(f)

# Access underwriter pricing
underwriters = motor_data['underwriters']
print(f"Found {len(underwriters)} underwriters")
```

### Load Motor 2 Data (JavaScript)

```javascript
const motor2Data = require('./data/motor2/motor2_sweep.json');

// Get pricing for specific category
const privatePricing = motor2Data.categories.find(
  cat => cat.name === 'Private'
);
```

### Load Pricing Features

```javascript
const pricingFeatures = require('./data/pricing/pataBima_pricing_features_preview.json');

// Check if feature is enabled
if (pricingFeatures.features.dynamicPricing) {
  console.log('Dynamic pricing enabled');
}
```

## 🔗 Related Documentation

- [Motor 2 Implementation](../docs/motor2/)
- [Pricing Guide](../docs/CAR_2M_INSURANCE_PRICING_GUIDE.md)
- [Testing Guide](../tests/README.md)

---

**Last Updated**: October 17, 2025  
**Total Data Files**: 3 (2 motor2, 1 pricing)  
**Format**: JSON
