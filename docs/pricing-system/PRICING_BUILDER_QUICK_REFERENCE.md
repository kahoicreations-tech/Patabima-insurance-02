# Pricing Builder - Quick Reference

**Updated**: 2025-01-25  
**Status**: ✅ All pricing tables integrated into visual builder

---

## ✅ Verification: Comprehensive Products Use Percentage Pricing

**Default**: Percentage pricing (3.5%, min/max premiums)  
**Options**: Can switch to Bracket or Fixed via dropdown

---

## 🎯 New Pricing Modals

### 1. ⚙ **Tonnage Pricing** (Commercial Products)

- **Trigger**: Products with "COMMERCIAL" + "COMP"
- **Button Color**: Orange
- **Configures**: Weight-based premiums (Upto 3 Tons, 3.5-8 Tons, etc.)
- **Saves To**: `features.pricing.{PRODUCT_CODE}.tonnage_pricing`

### 2. 💜 **PLL Pricing** (PSV Products)

- **Trigger**: Products with "PSV"
- **Button Color**: Purple
- **Configures**: Passenger Legal Liability per person rates
- **Saves To**: `features.pricing.{PRODUCT_CODE}.pll_pricing`

### 3. 🔵 **Extension Terms** (Extendible Products)

- **Trigger**: Products with "EXT"
- **Button Color**: Blue
- **Configures**: Initial period, balance, grace period, penalties
- **Saves To**: `features.pricing.{PRODUCT_CODE}.extendible_config`

### 4. ⚙ **Adjustment Factors** (Global)

- **Trigger**: Header button
- **Button Color**: Gray
- **Configures**: Vehicle age, usage type, location multipliers
- **Saves To**: `features.adjustment_factors`

### 5. ✅ **Add-ons** (Comprehensive Products)

- **Trigger**: Comprehensive products
- **Button Color**: Green
- **Configures**: Excess Protector, PVT, Windscreen, etc.
- **Saves To**: `features.pricing.{PRODUCT_CODE}.addons`

---

## 📊 Button Matrix

| Product Type             | Buttons Available            |
| ------------------------ | ---------------------------- |
| Private Comprehensive    | Brackets, Add-ons            |
| Private TOR              | None (fixed pricing)         |
| Private Third-Party      | None (fixed pricing)         |
| Private Third-Party EXT  | **Extension Terms**          |
| Commercial Comprehensive | **Tonnage Pricing**, Add-ons |
| Commercial Third-Party   | None                         |
| PSV Comprehensive        | **PLL Pricing**              |
| PSV Third-Party          | None                         |
| Motorcycle Comprehensive | Brackets, Add-ons            |
| TukTuk Comprehensive     | Brackets, Add-ons            |

---

## 💾 Complete JSON Structure

```json
{
  "pricing": {
    "PRODUCT_CODE": {
      "pricing_type": "percentage|bracket|fixed",
      "rate": 0.035,
      "min_premium": 20000,
      "max_premium": 500000,
      "brackets": [...],
      "addons": [...],
      "tonnage_pricing": [...],
      "pll_pricing": [...],
      "extendible_config": {...}
    }
  },
  "adjustment_factors": [...],
  "addon_overrides": {},
  "market_position": "standard|premium|budget"
}
```

---

## 🚀 Quick Workflow

1. **Open Insurance Provider** in Django admin
2. **Enable product** checkbox
3. **Configure pricing**:
   - Comprehensive: Select percentage/bracket, enter rate/brackets
   - Fixed: Enter base premium
4. **Click relevant buttons**:
   - Tonnage (commercial)
   - PLL (PSV)
   - Extension Terms (extendible)
   - Add-ons (comprehensive)
5. **Configure in modals**, click Save
6. **Review JSON preview**
7. **Save** in Django admin

---

## 🔗 Replaced Admin URLs

**Before**: Visit multiple admin pages  
**After**: Single unified interface

- ~~`/admin/app/commercialtonnagepricing/`~~ → Tonnage Pricing modal
- ~~`/admin/app/extendiblepricing/`~~ → Extension Terms modal
- ~~`/admin/app/psvpllpricing/`~~ → PLL Pricing modal
- ~~`/admin/app/vehicleadjustmentfactor/`~~ → Adjustment Factors modal

---

## ✨ Key Features

✅ Comprehensive = Percentage pricing (default)  
✅ All extensions visible via modals  
✅ Add-ons editable for comprehensive products  
✅ Tonnage, PLL, Extension Terms integrated  
✅ Vehicle adjustment factors global configuration  
✅ Single edit page for complete pricing setup

**Result**: No more navigating between different admin pages! 🎉
