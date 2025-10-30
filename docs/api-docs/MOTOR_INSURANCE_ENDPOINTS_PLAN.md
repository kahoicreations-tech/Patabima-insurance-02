# Motor Insurance Categories - Endpoint Planning & Implementation Strategy

## 📋 **Overview**

Based on the complete motor insurance fields document and existing frontend structure, we need to create comprehensive endpoints for all motor insurance categories with their specific field requirements.

## 🎯 **Motor Insurance Categories Analysis**

### **Current Frontend Structure**

```
frontend/screens/quotations/motor/
├── private/          # Private vehicle insurance
├── commercial/       # Commercial vehicle insurance
├── psv/             # Public Service Vehicle
├── motorcycle/      # Motorcycle insurance
├── tuktuk/          # TukTuk/Three-wheeler
├── special/         # Special vehicle types
└── tor/             # Certificate of Insurance (TOR)
```

### **Categories from MD Document**

#### **🚗 PRIVATE THIRD PARTY**

1. **TOR For Private**
2. **Private Third-Party**
3. **Private Third-Party Extendible**

#### **🚚 COMMERCIAL THIRD PARTY**

1. **TOR For Commercial**
2. **Commercial Third-Party**

#### **🛡️ COMPREHENSIVE INSURANCE**

1. **Private Comprehensive**
2. **Commercial TukTuk Comprehensive**

## 🔧 **Endpoint Structure Plan**

### **Base API Structure**

```
/api/v1/public_app/motor/
├── categories/                    # Get available categories
├── products/                      # Get products by category
├── quotations/                    # Quotation management
│   ├── create/                   # Create new quotation
│   ├── calculate/                # Premium calculation
│   ├── submit/                   # Submit quotation
│   └── status/{id}/              # Get quotation status
├── payments/                      # Payment processing
├── policies/                      # Policy management
└── documents/                     # Document handling
```

### **Category-Specific Endpoints**

#### **🚗 Private Vehicle Endpoints**

```
POST /motor/private/tor/quotation/           # TOR For Private
POST /motor/private/third-party/quotation/   # Private Third-Party
POST /motor/private/extendible/quotation/    # Private Third-Party Extendible
POST /motor/private/comprehensive/quotation/ # Private Comprehensive
```

#### **🚚 Commercial Vehicle Endpoints**

```
POST /motor/commercial/tor/quotation/           # TOR For Commercial
POST /motor/commercial/third-party/quotation/   # Commercial Third-Party
POST /motor/commercial/comprehensive/quotation/ # Commercial Comprehensive
POST /motor/commercial/tuktuk/quotation/        # Commercial TukTuk
```

#### **🏍️ Motorcycle Endpoints**

```
POST /motor/motorcycle/third-party/quotation/   # Motorcycle Third-Party
POST /motor/motorcycle/comprehensive/quotation/ # Motorcycle Comprehensive
```

#### **🚌 PSV Endpoints**

```
POST /motor/psv/third-party/quotation/    # PSV Third-Party
POST /motor/psv/comprehensive/quotation/  # PSV Comprehensive
POST /motor/psv/matatu/quotation/         # Matatu Cover
```

## 📝 **Field Requirements by Category**

### **Common Fields (All Categories)**

```javascript
// Base vehicle information
{
  financial_interest: boolean,
  vehicle_identification_type: "registration" | "chassis",
  vehicle_registration: string,
  vehicle_make: string,
  vehicle_model: string,
  cover_start_date: string,
  kyc_documents: {
    national_id: file,
    kra_pin: file,
    logbook: file
  }
}
```

### **Category-Specific Fields**

#### **TOR For Private/Commercial**

```javascript
{
  ...commonFields,
  tonnage?: number,              // Only for commercial
  underwriter_selection: {
    provider_id: string,
    premium_amount: number
  }
}
```

#### **Third-Party Insurance**

```javascript
{
  ...commonFields,
  cover_type: "third_party" | "third_party_fire_theft",
  underwriter_selection: {
    provider_id: string,
    premium_amount: number,
    features: string[]
  }
}
```

#### **Comprehensive Insurance**

```javascript
{
  ...commonFields,
  vehicle_valuation: number,
  year_of_manufacture: number,
  windscreen_value?: number,
  radio_cassette_value?: number,
  tonnage?: number,              // For commercial
  optional_addons: {
    excess_protector: boolean,
    political_violence: boolean,
    terrorism_cover: boolean
  },
  underwriter_selection: {
    provider_id: string,
    base_premium: number,
    addon_costs: object
  }
}
```

## 🏗️ **Implementation Plan**

### **Phase 1: Core API Endpoints** 🎯

1. **Extend InsuranceServicesAPI.js** with category-specific methods
2. **Create form validation schemas** for each category
3. **Implement premium calculation** logic per category
4. **Add document upload** handling per category

### **Phase 2: Enhanced Form Components** 🎨

1. **CategorySpecificForm.js** - Dynamic form based on category
2. **VehicleDetailsForm.js** - Enhanced vehicle information
3. **UnderwriterSelection.js** - Premium comparison component
4. **DocumentUploadForm.js** - Category-specific document requirements

### **Phase 3: Payment & Policy Integration** 💳

1. **PaymentGateway.js** - M-PESA and DPO Pay integration
2. **PolicySummary.js** - Category-specific policy display
3. **ReceiptGeneration.js** - Professional receipt formatting
4. **PolicyManagement.js** - Policy lifecycle management

## 🔄 **Data Flow Architecture**

```
User Selects Category
        ↓
Category-Specific Form
        ↓
Vehicle Verification (DMVIC)
        ↓
Premium Calculation
        ↓
Underwriter Selection
        ↓
Document Upload
        ↓
Payment Processing
        ↓
Policy Issuance
        ↓
Receipt Generation
```

## 📊 **Endpoint Specifications**

### **Create Quotation Endpoint**

```javascript
POST /motor/{category}/{product}/quotation/

Request Body:
{
  agent_id: string,
  category: "private" | "commercial" | "psv" | "motorcycle",
  product_type: string,
  vehicle_details: VehicleDetailsSchema,
  cover_details: CoverDetailsSchema,
  kyc_documents: DocumentsSchema,
  payment_info?: PaymentInfoSchema
}

Response:
{
  success: boolean,
  quotation_id: string,
  quotation_number: string,
  premium_breakdown: PremiumBreakdownSchema,
  payment_reference?: string,
  next_steps: string[]
}
```

### **Calculate Premium Endpoint**

```javascript
POST /motor/{category}/calculate-premium/

Request Body:
{
  category: string,
  product_type: string,
  vehicle_details: VehicleDetailsSchema,
  cover_options: CoverOptionsSchema,
  underwriter_id?: string
}

Response:
{
  success: boolean,
  base_premium: number,
  training_levy: number,
  stamp_duty: number,
  addon_costs?: object,
  total_premium: number,
  available_underwriters: UnderwriterSchema[]
}
```

## 🎯 **Implementation Strategy**

### **1. API Service Enhancement**

```javascript
// InsuranceServicesAPI.js enhancement
class MotorInsuranceAPI {
  // Category-specific quotation creation
  async createPrivateTORQuotation(data) { ... }
  async createPrivateThirdPartyQuotation(data) { ... }
  async createCommercialTORQuotation(data) { ... }
  async createComprehensiveQuotation(data) { ... }

  // Premium calculation per category
  async calculatePremium(category, productType, data) { ... }

  // Document upload per category
  async uploadCategoryDocuments(category, documents) { ... }
}
```

### **2. Form Component Architecture**

```javascript
// Dynamic form component
const CategoryInsuranceForm = ({ category, productType }) => {
  const formConfig = useMemo(
    () => getFormConfigForCategory(category, productType),
    [category, productType]
  );

  return <DynamicForm config={formConfig} />;
};
```

### **3. Validation Schemas**

```javascript
// Category-specific validation
const validationSchemas = {
  "private.tor": PrivateTORSchema,
  "private.third_party": PrivateThirdPartySchema,
  "private.comprehensive": PrivateComprehensiveSchema,
  "commercial.tor": CommercialTORSchema,
  "commercial.comprehensive": CommercialComprehensiveSchema,
};
```

## 🚀 **Next Steps**

1. **Extend InsuranceServicesAPI.js** with category-specific methods
2. **Create form validation schemas** for each insurance category
3. **Build dynamic form components** that adapt to category requirements
4. **Implement premium calculation** logic per category
5. **Test end-to-end workflows** for each insurance category

## 📈 **Expected Outcomes**

✅ **Comprehensive Coverage** - All motor insurance categories supported  
✅ **Dynamic Forms** - Category-specific field requirements  
✅ **Premium Accuracy** - Category-specific calculation logic  
✅ **Document Management** - Category-appropriate document handling  
✅ **Payment Integration** - Seamless payment processing  
✅ **Policy Management** - Complete policy lifecycle

This implementation will provide a robust, scalable foundation for all motor insurance categories while maintaining consistency and user experience across different vehicle types and coverage options.
