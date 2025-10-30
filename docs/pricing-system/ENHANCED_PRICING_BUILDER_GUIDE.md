# Enhanced Pricing Builder Guide - PataBima Admin

## Overview

The enhanced pricing builder provides a comprehensive interface for configuring motor insurance product pricing with support for:

- **Bracket-based pricing** for comprehensive products
- **Add-ons and extensions** configuration
- **Multiple pricing methods** (Percentage, Fixed, Bracket)
- **Real-time JSON preview** with syntax highlighting
- **Market positioning** options (Budget, Standard, Premium)

---

## Features

### 1. **Product Enablement**

- Toggle checkbox to enable/disable products
- Enabled products appear in the JSON configuration
- Disabled products are hidden from preview

### 2. **Pricing Methods**

#### A. **Fixed Premium** (TOR, Third-Party)

Simple fixed amount pricing for standard products.

**Configuration:**

- Base Premium: Fixed amount (e.g., KSh 5,000)

**JSON Output:**

```json
{
  "PRIVATE_TP": {
    "pricing_type": "fixed",
    "base_premium": 5000
  }
}
```

#### B. **Percentage-based** (Comprehensive)

Premium calculated as percentage of sum insured.

**Configuration:**

- Rate: Percentage (e.g., 3.5%)
- Min Premium: Minimum amount (e.g., KSh 20,000)
- Max Premium: Maximum amount (e.g., KSh 500,000)

**JSON Output:**

```json
{
  "PRIVATE_COMPREHENSIVE": {
    "pricing_type": "percentage",
    "rate": 0.035,
    "min_premium": 20000,
    "max_premium": 500000
  }
}
```

#### C. **Bracket-based** (Comprehensive - NEW! ✨)

Different premiums for different sum insured ranges.

**Configuration:**

1. Click "Configure Brackets" button
2. Define multiple brackets with:
   - Min Sum Insured
   - Max Sum Insured
   - Premium for that bracket

**Example Brackets:**
| Range | Min | Max | Premium |
|-------|-----|-----|---------|
| Bracket 1 | 0 | 1,000,000 | 25,000 |
| Bracket 2 | 1,000,001 | 3,000,000 | 35,000 |
| Bracket 3 | 3,000,001 | 5,000,000 | 50,000 |
| Bracket 4 | 5,000,001 | 10,000,000 | 75,000 |

**JSON Output:**

```json
{
  "PRIVATE_COMPREHENSIVE": {
    "pricing_type": "bracket",
    "brackets": [
      {
        "min_value": 0,
        "max_value": 1000000,
        "premium": 25000
      },
      {
        "min_value": 1000001,
        "max_value": 3000000,
        "premium": 35000
      },
      {
        "min_value": 3000001,
        "max_value": 5000000,
        "premium": 50000
      },
      {
        "min_value": 5000001,
        "max_value": 10000000,
        "premium": 75000
      }
    ]
  }
}
```

### 3. **Add-ons Configuration** (NEW! ✨)

Configure optional coverage extensions for comprehensive products.

**Common Add-ons:**

- Excess Protector
- Political Violence & Terrorism (PVT)
- Loss of Use
- Windscreen Extension
- Radio Cassette
- Personal Accident

**Configuration:**

1. Click "+ Add-ons" button on comprehensive products
2. Add multiple add-ons with:
   - Add-on Name (select from common list or custom)
   - Pricing Type (Fixed or Percentage)
   - Value (amount or percentage)

**Example Add-ons:**
| Add-on | Type | Value |
|--------|------|-------|
| Excess Protector | Fixed | KSh 5,000 |
| Political Violence & Terrorism | Percentage | 0.5% |
| Windscreen Extension | Fixed | KSh 10,000 |

**JSON Output:**

```json
{
  "PRIVATE_COMPREHENSIVE": {
    "pricing_type": "bracket",
    "brackets": [...],
    "addons": [
      {
        "name": "Excess Protector",
        "type": "fixed",
        "value": 5000
      },
      {
        "name": "Political Violence & Terrorism",
        "type": "percentage",
        "value": 0.005
      },
      {
        "name": "Windscreen Extension",
        "type": "fixed",
        "value": 10000
      }
    ]
  }
}
```

---

## Complete Configuration Example

### Scenario: Configure APA Insurance Pricing

**Products to Configure:**

1. Private Third-Party
2. Private Comprehensive (with brackets and add-ons)
3. Commercial General Cartage Comprehensive

### Step-by-Step:

#### 1. Private Third-Party (Fixed)

- [x] Enable product
- Method: Fixed Premium
- Base Premium: 5,000

#### 2. Private Comprehensive (Bracket + Add-ons)

- [x] Enable product
- Method: **Bracket (Ranges)**
- Click "Configure Brackets"
  - **Bracket 1:** 0 - 1M = KSh 25,000
  - **Bracket 2:** 1M - 3M = KSh 35,000
  - **Bracket 3:** 3M - 5M = KSh 50,000
  - **Bracket 4:** 5M+ = KSh 75,000
- Click "+ Add-ons"
  - Excess Protector: Fixed KSh 5,000
  - PVT: Percentage 0.5%
  - Windscreen: Fixed KSh 10,000

#### 3. Commercial General Cartage Comprehensive

- [x] Enable product
- Method: Percentage
- Rate: 3.5%
- Min Premium: 20,000
- Max Premium: 500,000

### Final JSON Output:

```json
{
  "pricing": {
    "PRIVATE_THIRD_PARTY": {
      "pricing_type": "fixed",
      "base_premium": 5000
    },
    "PRIVATE_COMPREHENSIVE": {
      "pricing_type": "bracket",
      "brackets": [
        {
          "min_value": 0,
          "max_value": 1000000,
          "premium": 25000
        },
        {
          "min_value": 1000001,
          "max_value": 3000000,
          "premium": 35000
        },
        {
          "min_value": 3000001,
          "max_value": 5000000,
          "premium": 50000
        },
        {
          "min_value": 5000001,
          "max_value": 99999999,
          "premium": 75000
        }
      ],
      "addons": [
        {
          "name": "Excess Protector",
          "type": "fixed",
          "value": 5000
        },
        {
          "name": "Political Violence & Terrorism",
          "type": "percentage",
          "value": 0.005
        },
        {
          "name": "Windscreen Extension",
          "type": "fixed",
          "value": 10000
        }
      ]
    },
    "COMMERCIAL_GENERAL_CARTAGE_COMP": {
      "pricing_type": "percentage",
      "rate": 0.035,
      "min_premium": 20000,
      "max_premium": 500000
    }
  },
  "addon_overrides": {},
  "market_position": "standard"
}
```

---

## User Interface Features

### Real-time JSON Preview

- **Live Updates:** Changes reflect immediately in JSON preview
- **Syntax Highlighting:** Color-coded JSON for readability
- **Stats Display:** Shows count of enabled products
- **Validation Status:** Visual indicator (green ✓ or red errors)

### Market Position Selector

Choose pricing tier:

- **Budget:** Lower pricing for competitive market
- **Standard:** Standard market pricing (default)
- **Premium:** Higher pricing for premium positioning

### Action Buttons

- **Copy JSON:** Copy configuration to clipboard
- **Validate:** Check configuration for errors

---

## Modal Interfaces

### Bracket Configuration Modal

**Layout:**

```
┌─────────────────────────────────────────────────┐
│ Configure Sum Insured Brackets: Product Name   │
├─────────────────────────────────────────────────┤
│                                                 │
│  Bracket 1                            [Remove]  │
│  ┌───────────────────────────────────────────┐ │
│  │ Min: [0]  Max: [1000000]  Premium: [25000]│ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  Bracket 2                            [Remove]  │
│  ┌───────────────────────────────────────────┐ │
│  │ Min: [1000001] Max: [3000000] Premium: [...│ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  [+ Add Bracket]                                │
│                                                 │
├─────────────────────────────────────────────────┤
│                        [Cancel] [Save Brackets] │
└─────────────────────────────────────────────────┘
```

**Features:**

- Add unlimited brackets
- Remove brackets (except first one)
- Auto-renumbering on removal
- Validation on save

### Add-ons Configuration Modal

**Layout:**

```
┌─────────────────────────────────────────────────┐
│ Configure Add-ons & Extensions: Product Name   │
├─────────────────────────────────────────────────┤
│                                                 │
│  Add-on 1                             [Remove]  │
│  ┌───────────────────────────────────────────┐ │
│  │ Name: [Excess Protector ▼]                │ │
│  │ Type: [Fixed ▼]  Value: [5000]            │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  Add-on 2                             [Remove]  │
│  ┌───────────────────────────────────────────┐ │
│  │ Name: [PVT ▼]                             │ │
│  │ Type: [Percentage ▼]  Value: [0.5]        │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  [+ Add Add-on]                                 │
│                                                 │
├─────────────────────────────────────────────────┤
│                        [Cancel] [Save Add-ons]  │
└─────────────────────────────────────────────────┘
```

**Features:**

- Dropdown with common add-ons
- Custom add-on names
- Fixed or percentage pricing
- Add unlimited add-ons

---

## Best Practices

### Bracket Configuration

1. **Start from Zero:** First bracket should start at 0
2. **No Gaps:** Ensure brackets cover all ranges without gaps
3. **Logical Progression:** Premiums should increase with higher sums insured
4. **Market Research:** Base brackets on competitor analysis

### Add-ons Pricing

1. **Fixed for Services:** Use fixed pricing for tangible benefits (windscreen, radio)
2. **Percentage for Risk:** Use percentage for risk-related add-ons (PVT, terrorism)
3. **Competitive Analysis:** Price add-ons competitively
4. **Bundle Discounts:** Consider bundling popular add-ons

### Workflow

1. **Enable Products:** Select which products to configure
2. **Set Pricing Method:** Choose appropriate method (Fixed/Percentage/Bracket)
3. **Configure Details:** Set rates, premiums, or brackets
4. **Add Extensions:** Configure add-ons for comprehensive products
5. **Preview & Validate:** Check JSON output
6. **Copy JSON:** Copy to features field
7. **Save:** Save insurance provider
8. **Materialize:** Run "Materialize pricing from features" action

---

## Troubleshooting

### Issue: Brackets button not showing

**Solution:** Change pricing method to "Bracket (Ranges)"

### Issue: Add-ons button disabled

**Solution:** Product must be enabled first

### Issue: JSON not updating

**Solution:** Click "Validate" button to refresh

### Issue: Brackets overlapping

**Solution:** Ensure max of one bracket equals min of next bracket minus 1

### Issue: Changes not saved

**Solution:** Click "Save Brackets" or "Save Add-ons" in modal, then save form

---

## Backend Integration

The pricing builder generates JSON that's consumed by:

1. **MotorPricing Model** - Stores pricing configuration
2. **Premium Calculation Engine** - Uses brackets and add-ons for quotes
3. **Underwriter Comparison** - Shows different underwriter options

### Materialize Action

After configuring pricing JSON:

1. Save the Insurance Provider
2. Select provider in admin list
3. Choose "Materialize pricing from features.json" action
4. Click "Go"
5. System creates/updates MotorPricing records

---

## Technical Reference

### JSON Schema

```typescript
interface PricingConfiguration {
  pricing: {
    [productCode: string]: PricingEntry;
  };
  addon_overrides?: AddonOverrides;
  market_position: "budget" | "standard" | "premium";
}

interface PricingEntry {
  pricing_type: "fixed" | "percentage" | "bracket";

  // For fixed
  base_premium?: number;

  // For percentage
  rate?: number;
  min_premium?: number;
  max_premium?: number;

  // For bracket
  brackets?: Array<{
    min_value: number;
    max_value: number;
    premium: number;
  }>;

  // Optional add-ons
  addons?: Array<{
    name: string;
    type: "fixed" | "percentage";
    value: number;
  }>;
}
```

### File Location

`insurance-app/app/templates/admin/app/insuranceprovider/change_form.html`

### Related Models

- `InsuranceProvider` - Stores features JSON
- `MotorPricing` - Materialized pricing records
- `MotorSubcategory` - Product definitions

---

## Changelog

### Version 2.0 (Enhanced)

- ✨ Added bracket-based pricing configuration
- ✨ Added add-ons configuration modal
- ✨ Enhanced pricing method dropdown with bracket option
- ✨ Improved JSON preview with bracket and add-on support
- 🎨 Better modal UI with responsive design
- 🐛 Fixed pricing type switching logic

### Version 1.0 (Original)

- Basic product enablement
- Fixed and percentage pricing
- JSON preview with syntax highlighting
- Market position selector

---

## Support

For assistance with the pricing builder:

1. Check this guide first
2. Review JSON output for errors
3. Test with "Validate" button
4. Contact system administrator for backend issues

---

**Last Updated:** October 25, 2025  
**Maintained By:** PataBima Development Team
