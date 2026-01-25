# Motor 2 Flow: Third Party vs Comprehensive

This document explains the **key differences** in the Motor 2 flow logic between **Third Party** and **Comprehensive** insurance products.

---

## 🔄 Flow Comparison Overview

| Aspect                     | **Third Party**                              | **Comprehensive**                            |
| :------------------------- | :------------------------------------------- | :------------------------------------------- |
| **Pricing Model**          | FIXED                                        | FIXED (but could be BRACKET for sum insured) |
| **Form Fields**            | Minimal (Registration, Cover Date)           | Extended (Sum Insured, Year, Make, Model)    |
| **Underwriter Comparison** | Auto-triggered immediately (no dependencies) | Requires Sum Insured input first             |
| **DMVIC Integration**      | ✅ Available (in KYC step)                   | ✅ Available (in KYC step)                   |
| **Add-ons**                | ❌ Not available                             | ✅ Available (Excess Protector, etc.)        |
| **Steps Count**            | 8 steps                                      | 7 steps                                      |

---

## 📋 Third Party Flow

**Product Type:** `THIRD_PARTY` | **Pricing:** `FIXED`

### Step Sequence

```
1. Category Selection (Private)
2. Subcategory Selection (Third Party)
3. Policy Details (Vehicle Registration + Cover Date)
   └─ Underwriter comparison triggers IMMEDIATELY (no input dependency)
4. KYC (ID Upload + DMVIC Verification Drawer)
5. Documents (Logbook/Receipt Upload)
6. Client Details (Personal Info)
7. Payment (M-PESA, Card, etc.)
8. Submission (Policy Generation)
```

### Key Characteristics

**✅ Simplified Form**

- Only **2 core fields**: Registration Number + Cover Start Date
- No Sum Insured required
- No vehicle valuation needed

**⚡ Instant Pricing**

- Pricing is **fixed** (e.g., KSh 2,975 base premium)
- Underwriter comparison **auto-loads** as soon as user enters Step 3
- No need to wait for user input
- Uses `isPricingDependent()` check → returns `FALSE`

**🔍 DMVIC Verification**

- Appears in **Step 4 (KYC)** as a drawer/modal
- User can optionally verify vehicle against industry database
- If verified, locks registration field to prevent editing

**💰 Levies Applied (Frontend)**

- Base Premium: KSh 2,975 (example)
- ITL (0.25%): KSh 7.44
- PCF (0.25%): KSh 7.44
- Stamp Duty: KSh 40
- **Total**: KSh 3,029.88

---

## 📋 Comprehensive Flow

**Product Type:** `COMPREHENSIVE` | **Pricing:** `FIXED` (or `BRACKET` if sum_insured-dependent)

### Step Sequence

```
1. Category Selection (Private)
2. Subcategory Selection (Comprehensive)
3. Policy Details (Extended Fields)
   ├─ Registration Number
   ├─ Sum Insured (REQUIRED)
   ├─ Year of Manufacture
   ├─ Make & Model
   └─ Underwriter comparison triggers AFTER Sum Insured entered
4. Underwriters (Side-by-side comparison with add-ons preview)
5. Add-ons Selection (Excess Protector, Windscreen, etc.)
6. Client Details (Personal Info + Payment)
7. Submission (Policy Generation)
```

### Key Characteristics

**📝 Extended Form**

- **Required Fields**:
  - Registration Number
  - **Sum Insured** (e.g., KSh 500,000 - KSh 10,000,000)
  - Year of Manufacture
  - Make & Model (optional but recommended)
- Form validates sum insured ranges

**⏳ Conditional Pricing**

- Pricing depends on **Sum Insured value**
- Underwriter comparison **waits** until user enters sum insured
- Uses `isPricingDependent()` check → returns `TRUE`
- Debounced trigger (400ms delay after typing)

**🎁 Add-ons Available**

- **Excess Protector** (waives excess in case of claim)
- **Windscreen Cover** (glass damage)
- **Political Violence & Terrorism**
- **Radio/Accessories Cover**

**🔍 DMVIC Verification**

- Same as Third Party - available in KYC step
- If used, can auto-fill vehicle details (make, model, year)

**💰 Levies Applied (Frontend)**

- Example for Sum Insured = KSh 1,000,000:
- Base Premium: KSh 35,000 (3.5% rate, example)
- ITL (0.25%): KSh 87.50
- PCF (0.25%): KSh 87.50
- Stamp Duty: KSh 40
- **Total**: KSh 35,215.00
- **+ Add-ons** (if selected)

---

## 🔀 Decision Logic in Code

The flow branches based on `coverage_type` detected in `MotorInsuranceContainer.js`:

```javascript
// Determine flow based on selected subcategory
const steps = useMemo(() => {
  const sel = state.selectedSubcategory;
  const rawType = sel?.coverage_type ?? sel?.type ?? "";
  const norm = typeof rawType === "string" ? rawType.toUpperCase().trim() : "";
  const isComprehensive = norm === "COMPREHENSIVE" || norm === "COMP";

  if (isComprehensive) {
    // 7 steps: Category → Subcategory → Policy Details → Underwriters → Add-ons → Client → Submission
    return [
      "Category",
      "Subcategory",
      "Policy Details",
      "Underwriters",
      "Add-ons",
      "Client Details",
      "Submission",
    ];
  }

  // Third Party flow (8 steps): includes KYC, Documents, Payment
  return [
    "Category",
    "Subcategory",
    "Policy Details",
    "KYC",
    "Documents",
    "Client Details",
    "Payment",
    "Submission",
  ];
}, [state.selectedSubcategory]);
```

---

## 🎯 Pricing Trigger Logic

### Third Party (No Dependency)

```javascript
// In DynamicVehicleForm.js
useEffect(() => {
  const coverageType = selectedProduct?.product_type?.toUpperCase();
  const isThirdParty =
    coverageType === "THIRD_PARTY" || coverageType === "FIXED";

  if (isThirdParty && !underwriterSelectedRef.current) {
    // Auto-trigger comparison immediately
    triggerUnderwriterComparison();
  }
}, [selectedProduct]);
```

### Comprehensive (Sum Insured Required)

```javascript
// In DynamicVehicleForm.js
const handleFieldChange = (field, value) => {
  const newData = { ...formData, [field]: value };
  setFormData(newData);

  if (field === "sum_insured" && value > 0) {
    // Debounce 400ms, then trigger
    clearTimeout(comparisonTimeoutRef.current);
    comparisonTimeoutRef.current = setTimeout(() => {
      triggerUnderwriterComparison(newData);
    }, 400);
  }
};
```

---

## 🔑 Key Takeaways

| Feature                |  Third Party   |  Comprehensive  |
| :--------------------- | :------------: | :-------------: |
| **Form Complexity**    |     Simple     |    Extended     |
| **Pricing Dependency** |      None      |   Sum Insured   |
| **Auto-comparison**    |    Instant     |   After input   |
| **Add-ons**            |       ❌       |       ✅        |
| **Steps**              |       8        |        7        |
| **DMVIC**              |       ✅       |       ✅        |
| **Target User**        | Basic coverage | Full protection |

---

**File Location:** `frontend/data/motor2/subcategories/PRIVATE.static.js`
