# Motor Insurance Implementation Guide

## Overview

This document outlines the comprehensive implementation strategy for the Motor Insurance system supporting all vehicle categories with dynamic pricing from multiple underwriters.

## 1. System Architecture

### 1.1 Category Structure

```
Motor Insurance
├── Private (7 products)
│   ├── Third Party
│   │   ├── TOR For Private
│   │   ├── Private Third-Party
│   │   ├── Private Third-Party Extendible
│   │   └── Private Motorcycle Third-Party
│   ├── Comprehensive
│   │   └── Private Comprehensive
│   └── Time on Risk
│       ├── Motor Private Time on Risk cover @ Ksh. 650
│       └── Motor Commercial Time on Risk cover @ Ksh. 850
├── Commercial (15 products)
│   ├── Third Party (12)
│   │   ├── TOR For Commercial (+ tonnage)
│   │   ├── Own Goods Third-Party (+ tonnage)
│   │   ├── General Cartage Third-Party (+ tonnage)
│   │   ├── Commercial TukTuk Third-Party
│   │   ├── Commercial TukTuk Third-Party Extendible
│   │   ├── Own Goods Third-Party Extendible (+ tonnage)
│   │   ├── General Cartage Third-Party Extendible (+ tonnage)
│   │   ├── General Cartage Third-Party Prime Mover (+ tonnage)
│   │   ├── General Cartage Third-Party Extendible Prime Mover (+ tonnage)
│   │   ├── Motor Commercial TPO Tonnage Scale (Upto 3 Tons - Over 20 Tons)
│   │   ├── Motor Commercial TPO Tonnage Scale FLEET (Upto 3 Tons - Over 20 Tons)
│   │   └── Prime Mover
│   └── Comprehensive (3)
│       ├── Commercial TukTuk Comprehensive (+ tonnage)
│       ├── General Cartage Comprehensive (+ tonnage)
│       └── Own Goods Comprehensive (+ tonnage)
├── PSV (15 products)
│   ├── Third Party (13)
│   │   ├── PSV Uber Third-Party (+ passengers)
│   │   ├── PSV TukTuk Third-Party (+ passengers)
│   │   ├── PSV TukTuk Third-Party Extendible (+ passengers)
│   │   ├── 1 Month PSV Matatu Third-Party (+ passengers)
│   │   ├── 2 Weeks PSV Matatu Third-Party (+ passengers)
│   │   ├── PSV Uber Third-Party Extendible (+ passengers)
│   │   ├── PSV Tour Van Third-Party (+ passengers)
│   │   ├── 1 Week PSV Matatu Third-Party Extendible (+ passengers)
│   │   ├── PSV Plain TPO (+ passengers)
│   │   ├── PSV Tour Van Third-Party Extendible (+ passengers)
│   │   ├── Motor PSV chauffeurdriven T.O.R @ Ksh. 1,000 + 100 PLL per pax
│   │   ├── Motorcycle PSV T.O.R @ Ksh. 500
│   │   └── PLL @ 500 Per person for All PSVs
│   └── Comprehensive (2)
│       ├── PSV Uber Comprehensive (+ passengers)
│       └── PSV Tour Van Comprehensive (+ passengers)
├── Motorcycle (6 products)
│   ├── Third Party (3)
│   │   ├── Private Motorcycle Third-Party
│   │   ├── PSV Motorcycle Third-Party
│   │   └── PSV Motorcycle Third-Party 6 Months
│   └── Comprehensive (3)
│       ├── Private Motorcycle Comprehensive
│       ├── PSV Motorcycle Comprehensive
│       └── PSV Motorcycle Comprehensive 6 Months
├── TukTuk (6 products)
│   ├── Third Party (4)
│   │   ├── PSV TukTuk Third-Party
│   │   ├── PSV TukTuk Third-Party Extendible
│   │   ├── Commercial TukTuk Third-Party
│   │   └── Commercial TukTuk Third-Party Extendible
│   └── Comprehensive (2)
│       ├── Commercial TukTuk Comprehensive
│       └── PSV TukTuk Comprehensive
└── Special Classes (11 products)
    ├── Third Party (6)
    │   ├── Agricultural Tractor Third-Party (+ tonnage)
    │   ├── Commercial Institutional Third-Party (+ passengers + type)
    │   ├── Commercial Institutional Third-Party Extendible (+ passengers + type)
    │   ├── KG Plate Third-Party
    │   ├── Driving School Third-Party (+ tonnage + passengers)
    │   └── PLL @ 250 Per person for Motor commercial Institutional
    └── Comprehensive (5)
        ├── Agricultural Tractor Comprehensive
        ├── Commercial Institutional Comprehensive
        ├── Driving School Comprehensive
        ├── Fuel Tankers Comprehensive
        └── Commercial Ambulance Comprehensive

Additional Notes:
- Max Age Comprehensive – 15 Years Private, 20 Years Commercial
- Probox, Succeed, Voxy, Wish, Noah, Sienta – Covered on referral basis subject to filled declaration of use form
- For vehicles registered as Private but used as commercial apply the commercial rates
- Copies Of Log Book And Pin Certificate Are Mandatory
- Vehicles Above 15Yrs Must Go For Mechanical Inspection
```

## 2. Comprehensive Pricing Strategy

### 2.1 Pricing Structure Analysis

Based on comprehensive motor insurance requirements, our pricing system must handle:

**Mandatory Levies (Applied to ALL Motor Insurance Products):**

- **Insurance Training Levy (ITL)**: 0.25% of the premium (to fund training and regulation)
- **Policyholders Compensation Fund (PCF)**: 0.25% of the premium (to protect policyholders if insurer becomes insolvent)
- **Stamp Duty**: KSh 40 per policy document (fixed amount, not percentage)

**Sum Insured Brackets (for Comprehensive products):**

- Different rate ranges based on vehicle value
- Base rates that vary by bracket (3.00% - 5.50%)
- Minimum premium enforcement
- Additional coverage calculations

**Category-Specific Factors:**

- **Private**: Sum insured brackets, vehicle age, usage type, Time on Risk covers
- **Commercial**: Tonnage ratings (Upto 3 Tons to Over 20 Tons), business type, vehicle age, Fleet pricing
- **PSV**: Passenger capacity, route type, vehicle age, PLL (Personal Liability Limit) options
- **Motorcycle**: Engine capacity, usage type (private/commercial), PSV options
- **TukTuk**: Passenger/cargo capacity, commercial usage
- **Special Classes**: Specialized factors (agricultural, institutional, etc.)

**Commercial Tonnage Scale Pricing:**

- Upto 3 Tons: KSh 4,500
- 3.5 to 8 Tons: KSh 5,500
- 8.5 to 12 Tons: KSh 6,500
- 12.5 to 15 Tons: KSh 7,500
- 15.5 to 20 Tons: KSh 10,000
- Over 20 Tons: KSh 15,000
- Prime mover: KSh 10,000

**Fleet Pricing (same tonnage brackets with potential discounts)**

**PSV Additional Coverage:**

- PLL @ KSh 500 per person for All PSVs
- PLL @ KSh 250 per person for Motor commercial Institutional

### 2.2 Unified Pricing Endpoint Approach ✅ RECOMMENDED

**Single endpoint handling all categories and pricing types:**

```
GET /api/v1/public_app/insurance/motor_pricing
Query Parameters:
- category: private|commercial|psv|motorcycle|tuktuk|special_classes
- sub_category: tor_for_private|private_comprehensive|etc.
- pricing_type: third_party|comprehensive|tor
- additional_params: tonnage|passengers|sum_insured|vehicle_age

POST /api/v1/public_app/insurance/calculate_motor_premium
Body Parameters:
- All pricing factors for accurate calculation
```

**Enhanced Benefits:**

- Single API endpoint for all motor insurance types
- Handles both simple (TOR/Third-Party) and complex (Comprehensive) pricing
- Supports bracket-based calculations for comprehensive products
- Centralized pricing logic with category-specific rules
- Consistent response format across all categories
- Better caching and performance optimization

### 2.3 Pricing Type Classifications

**Third Party & TOR Products:**

- Fixed premium pricing
- Category-based rates
- Simple additional factors (tonnage, passengers)

**Comprehensive Products:**

- Sum insured bracket-based pricing
- Base rate calculations with multipliers
- Complex factor adjustments (age, usage, location)
- Additional coverage calculations (excess protector, PVT, etc.)
- Minimum premium enforcement

## 3. Enhanced Database Schema Design

### 3.1 Core Tables with Comprehensive Pricing Support

```sql
-- Motor categories and subcategories
CREATE TABLE motor_categories (
    id SERIAL PRIMARY KEY,
    category_code VARCHAR(50) UNIQUE NOT NULL, -- 'private', 'commercial', etc.
    category_name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    pricing_type VARCHAR(20) DEFAULT 'fixed', -- 'fixed', 'comprehensive', 'hybrid'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE motor_subcategories (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES motor_categories(id),
    subcategory_code VARCHAR(100) UNIQUE NOT NULL, -- 'tor_for_private', etc.
    subcategory_name VARCHAR(200) NOT NULL,
    product_type VARCHAR(20) NOT NULL, -- 'third_party', 'comprehensive', 'tor'
    description TEXT,
    additional_fields JSONB DEFAULT '[]', -- ['tonnage', 'passengers', 'sum_insured', etc.]
    field_validations JSONB DEFAULT '{}',
    pricing_requirements JSONB DEFAULT '{}', -- Required fields for pricing calculation
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Enhanced pricing table supporting both fixed and bracket-based pricing
CREATE TABLE motor_pricing (
    id SERIAL PRIMARY KEY,
    underwriter_id INTEGER REFERENCES underwriters(id),
    subcategory_id INTEGER REFERENCES motor_subcategories(id),

    -- Fixed pricing (for TOR/Third-Party)
    base_premium DECIMAL(10,2),

    -- Mandatory levies (applied to ALL products)
    insurance_training_levy_rate DECIMAL(5,4) DEFAULT 0.0025, -- 0.25%
    pcf_levy_rate DECIMAL(5,4) DEFAULT 0.0025, -- 0.25%
    stamp_duty DECIMAL(10,2) DEFAULT 40, -- Fixed KSh 40
    service_fee DECIMAL(10,2) DEFAULT 0,

    -- Bracket-based pricing (for Comprehensive)
    sum_insured_min DECIMAL(15,2),
    sum_insured_max DECIMAL(15,2),
    base_rate_min DECIMAL(5,4), -- e.g., 0.0375 for 3.75%
    base_rate_max DECIMAL(5,4),
    minimum_premium DECIMAL(10,2),

    -- Additional coverage rates (for Comprehensive)
    excess_protector_rate DECIMAL(5,4),
    excess_protector_minimum DECIMAL(10,2),
    pvt_rate DECIMAL(5,4), -- Political Violence & Terrorism
    pvt_minimum DECIMAL(10,2),
    loss_of_use_amount DECIMAL(10,2),
    loss_of_use_coverage BOOLEAN DEFAULT false,
    windscreen_limit DECIMAL(10,2),
    windscreen_percentage DECIMAL(5,4),
    radio_limit DECIMAL(10,2),
    radio_percentage DECIMAL(5,4),

    -- Category-specific factors
    pricing_factors JSONB DEFAULT '{}', -- Tonnage rates, passenger rates, etc.
    currency VARCHAR(3) DEFAULT 'KES',
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(underwriter_id, subcategory_id, sum_insured_min, effective_from)
);

-- Commercial tonnage pricing table
CREATE TABLE commercial_tonnage_pricing (
    id SERIAL PRIMARY KEY,
    underwriter_id INTEGER REFERENCES underwriters(id),
    subcategory_id INTEGER REFERENCES motor_subcategories(id),
    tonnage_min DECIMAL(5,2), -- e.g., 0 for "Upto 3 Tons"
    tonnage_max DECIMAL(5,2), -- e.g., 3 for "Upto 3 Tons"
    tonnage_description VARCHAR(100), -- "Upto 3 Tons", "3.5 to 8 Tons", etc.
    base_premium DECIMAL(10,2),
    fleet_discount_percentage DECIMAL(5,2) DEFAULT 0, -- For fleet pricing
    is_fleet_pricing BOOLEAN DEFAULT false,
    is_prime_mover BOOLEAN DEFAULT false,
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PSV PLL (Personal Liability Limit) pricing
CREATE TABLE psv_pll_pricing (
    id SERIAL PRIMARY KEY,
    underwriter_id INTEGER REFERENCES underwriters(id),
    vehicle_type VARCHAR(50), -- 'psv_general', 'commercial_institutional'
    pll_rate_per_person DECIMAL(10,2), -- KSh 500 or KSh 250
    description TEXT,
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicle adjustment factors
CREATE TABLE vehicle_adjustment_factors (
    id SERIAL PRIMARY KEY,
    underwriter_id INTEGER REFERENCES underwriters(id),
    category_id INTEGER REFERENCES motor_categories(id),
    factor_type VARCHAR(50), -- 'age', 'usage', 'location', 'engine_capacity'
    factor_range_min INTEGER,
    factor_range_max INTEGER,
    rate_multiplier DECIMAL(5,4), -- e.g., 1.1 for 10% increase
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Category-specific additional fields pricing
CREATE TABLE additional_field_pricing (
    id SERIAL PRIMARY KEY,
    underwriter_id INTEGER REFERENCES underwriters(id),
    subcategory_id INTEGER REFERENCES motor_subcategories(id),
    field_name VARCHAR(50), -- 'tonnage', 'passengers', etc.
    field_range_min DECIMAL(10,2),
    field_range_max DECIMAL(10,2),
    rate_adjustment DECIMAL(10,2), -- Fixed amount or percentage
    adjustment_type VARCHAR(20) DEFAULT 'fixed', -- 'fixed', 'percentage'
    created_at TIMESTAMP DEFAULT NOW()
);

-- Underwriters table (enhanced)
CREATE TABLE underwriters (
    id SERIAL PRIMARY KEY,
    underwriter_code VARCHAR(50) UNIQUE NOT NULL,
    company_name VARCHAR(200) NOT NULL,
    logo_url VARCHAR(500),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(100),
    website VARCHAR(200),
    supported_categories JSONB DEFAULT '[]', -- Categories this underwriter supports
    supported_payment_methods JSONB DEFAULT '[]', -- ['mpesa', 'card', 'bank']
    is_active BOOLEAN DEFAULT true,
    features JSONB DEFAULT '[]', -- ['online_payment', 'instant_issuance', etc.]
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 3.2 Sample Data Structure for Different Product Types

#### 3.2.1 TOR Products (Fixed Pricing)

```json
{
  "category": "private",
  "subcategory": "tor_for_private",
  "product_type": "tor",
  "underwriters": [
    {
      "id": 1,
      "name": "Jubilee Insurance",
      "pricing": {
        "base_premium": 3500,
        "training_levy": 350,
        "stamp_duty": 40,
        "total": 3890,
        "currency": "KES"
      },
      "additional_fields": [],
      "features": ["instant_issuance"]
    }
  ]
}
```

#### 3.2.2 Third-Party Products (Fixed + Factors)

```json
{
  "category": "commercial",
  "subcategory": "tor_for_commercial",
  "product_type": "third_party",
  "underwriters": [
    {
      "id": 1,
      "name": "Jubilee Insurance",
      "pricing": {
        "base_premium": 5500,
        "training_levy": 550,
        "stamp_duty": 40,
        "total": 6090,
        "currency": "KES"
      },
      "pricing_factors": {
        "tonnage_rates": {
          "0-5": 0,
          "6-10": 2000,
          "11-15": 4000,
          "16-31": 7000
        }
      },
      "additional_fields": ["tonnage"]
    }
  ]
}
```

#### 3.2.3 Comprehensive Products (Bracket-Based Pricing)

```json
{
  "category": "private",
  "subcategory": "private_comprehensive",
  "product_type": "comprehensive",
  "underwriters": [
    {
      "id": 1,
      "name": "Jubilee Insurance",
      "pricing_brackets": [
        {
          "sum_insured_min": 500000,
          "sum_insured_max": 1500000,
          "base_rate_min": 0.0375,
          "base_rate_max": 0.045,
          "minimum_premium": 27500
        },
        {
          "sum_insured_min": 1500001,
          "sum_insured_max": 2000000,
          "base_rate_min": 0.035,
          "base_rate_max": 0.04,
          "minimum_premium": 52500
        }
      ],
      "additional_coverages": {
        "excess_protector": {
          "rate": 0.0025,
          "minimum": 3000
        },
        "pvt": {
          "rate": 0.0025,
          "minimum": 2500
        },
        "windscreen": {
          "limit": 30000,
          "percentage": 0.1
        }
      },
      "adjustment_factors": {
        "vehicle_age": {
          "0-3": 1.0,
          "4-7": 1.1,
          "8-12": 1.25,
          "13+": 1.5
        },
        "usage_type": {
          "private": 1.0,
          "commercial": 1.3,
          "hire_reward": 1.5
        }
      },
      "additional_fields": [
        "sum_insured",
        "vehicle_age",
        "usage_type",
        "windscreen_value",
        "radio_value"
      ]
    }
  ]
}
```

## 4. Comprehensive Backend Implementation

### 4.1 Enhanced Service Layer Design

```javascript
// MotorInsurancePricingService.js
export class MotorInsurancePricingService {
  async getCategories() {
    // Get all motor categories with subcategories and pricing requirements
    return await DjangoAPIService.makeRequest(
      "GET",
      "/api/v1/public_app/insurance/motor_categories"
    );
  }

  async getPricingForSubcategory(category, subcategory, productType) {
    // Get underwriter pricing for specific subcategory
    const params = new URLSearchParams({
      category,
      sub_category: subcategory,
      product_type: productType,
    });
    return await DjangoAPIService.makeRequest(
      "GET",
      `/api/v1/public_app/insurance/motor_pricing?${params}`
    );
  }

  async calculatePremium(pricingData) {
    // Calculate premium based on product type and inputs
    return await DjangoAPIService.makeRequest(
      "POST",
      "/api/v1/public_app/insurance/calculate_motor_premium",
      pricingData
    );
  }

  async comparePricing(comparisonData) {
    // Get pricing from multiple underwriters for comparison
    return await DjangoAPIService.makeRequest(
      "POST",
      "/api/v1/public_app/insurance/compare_motor_pricing",
      comparisonData
    );
  }

  async submitQuotation(quotationData) {
    // Submit complete quotation with calculated pricing
    return await DjangoAPIService.makeRequest(
      "POST",
      "/api/v1/public_app/insurance/motor_quotations",
      quotationData
    );
  }
}
```

### 4.2 Python Backend Pricing Engine

```python
# apps/insurance/services/motor_pricing_engine.py
from decimal import Decimal
from typing import Dict, Any, List, Optional
from django.db.models import Q
from ..models import (
    MotorPricing, VehicleAdjustmentFactors,
    AdditionalFieldPricing, MotorSubcategories
)

class MotorPricingEngine:

    def calculate_premium(self, pricing_request: Dict[str, Any]) -> Dict[str, Any]:
        """
        Universal premium calculation for all motor insurance products
        """
        category = pricing_request.get('category')
        subcategory = pricing_request.get('subcategory')
        product_type = pricing_request.get('product_type')
        underwriter_id = pricing_request.get('underwriter_id')

        # Get subcategory details
        subcategory_obj = MotorSubcategories.objects.get(
            category__category_code=category,
            subcategory_code=subcategory
        )

        if product_type == 'tor':
            return self._calculate_tor_premium(pricing_request, subcategory_obj)
        elif product_type == 'third_party':
            return self._calculate_third_party_premium(pricing_request, subcategory_obj)
        elif product_type == 'comprehensive':
            return self._calculate_comprehensive_premium(pricing_request, subcategory_obj)
        else:
            raise ValueError(f"Unsupported product type: {product_type}")

    def _calculate_tor_premium(self, request: Dict, subcategory) -> Dict[str, Any]:
        """Calculate TOR premium (simple fixed pricing)"""
        underwriter_id = request['underwriter_id']

        # Get base pricing
        pricing = MotorPricing.objects.filter(
            underwriter_id=underwriter_id,
            subcategory_id=subcategory.id,
            sum_insured_min__isnull=True  # TOR products don't use sum insured brackets
        ).first()

        if not pricing:
            raise ValueError("No pricing found for TOR product")

        base_premium = pricing.base_premium

        # Calculate mandatory levies
        itl_levy = base_premium * (pricing.insurance_training_levy_rate or Decimal('0.0025'))  # 0.25%
        pcf_levy = base_premium * (pricing.pcf_levy_rate or Decimal('0.0025'))  # 0.25%
        stamp_duty = pricing.stamp_duty or Decimal('40')
        service_fee = pricing.service_fee or Decimal('0')

        total_premium = base_premium + itl_levy + pcf_levy + stamp_duty + service_fee

        return {
            'calculation_type': 'fixed',
            'premium_calculation': {
                'base_premium': float(base_premium),
                'itl_levy': float(itl_levy),
                'pcf_levy': float(pcf_levy),
                'stamp_duty': float(stamp_duty),
                'service_fee': float(service_fee),
                'total_premium': float(total_premium),
                'currency': pricing.currency
            },
            'breakdown': [
                {'item': 'Base Premium', 'amount': float(base_premium)},
                {'item': 'Insurance Training Levy (0.25%)', 'amount': float(itl_levy)},
                {'item': 'Policyholders Compensation Fund (0.25%)', 'amount': float(pcf_levy)},
                {'item': 'Stamp Duty', 'amount': float(stamp_duty)},
                {'item': 'Service Fee', 'amount': float(service_fee)}
            ]
        }

    def _calculate_third_party_premium(self, request: Dict, subcategory) -> Dict[str, Any]:
        """Calculate Third Party premium (fixed + factors)"""
        underwriter_id = request['underwriter_id']
        pricing_inputs = request.get('pricing_inputs', {})

        # Check if this is a commercial tonnage-based product
        if 'tonnage' in pricing_inputs and subcategory.category.category_code == 'commercial':
            return self._calculate_commercial_tonnage_premium(request, subcategory)

        # Get base pricing
        pricing = MotorPricing.objects.filter(
            underwriter_id=underwriter_id,
            subcategory_id=subcategory.id,
            sum_insured_min__isnull=True
        ).first()

        if not pricing:
            raise ValueError("No pricing found for Third Party product")

        base_premium = pricing.base_premium
        adjusted_premium = base_premium

        # Apply additional field adjustments (passengers, etc.)
        adjustments = []
        for field_name, field_value in pricing_inputs.items():
            if field_value and field_name in subcategory.additional_fields:
                adjustment = self._get_field_adjustment(
                    underwriter_id, subcategory.id, field_name, field_value
                )
                if adjustment:
                    adjusted_premium += adjustment['amount']
                    adjustments.append({
                        'field': field_name,
                        'value': field_value,
                        'adjustment': float(adjustment['amount']),
                        'description': adjustment['description']
                    })

        # Calculate mandatory levies
        itl_levy = adjusted_premium * (pricing.insurance_training_levy_rate or Decimal('0.0025'))
        pcf_levy = adjusted_premium * (pricing.pcf_levy_rate or Decimal('0.0025'))
        stamp_duty = pricing.stamp_duty or Decimal('40')
        service_fee = pricing.service_fee or Decimal('0')

        total_premium = adjusted_premium + itl_levy + pcf_levy + stamp_duty + service_fee

        return {
            'calculation_type': 'fixed_with_factors',
            'premium_calculation': {
                'base_premium': float(base_premium),
                'adjusted_premium': float(adjusted_premium),
                'itl_levy': float(itl_levy),
                'pcf_levy': float(pcf_levy),
                'stamp_duty': float(stamp_duty),
                'service_fee': float(service_fee),
                'total_premium': float(total_premium),
                'currency': pricing.currency
            },
            'breakdown': {
                'base_premium': float(base_premium),
                'adjustments': adjustments,
                'adjusted_premium': float(adjusted_premium),
                'levies': [
                    {'item': 'Insurance Training Levy (0.25%)', 'amount': float(itl_levy)},
                    {'item': 'Policyholders Compensation Fund (0.25%)', 'amount': float(pcf_levy)},
                    {'item': 'Stamp Duty', 'amount': float(stamp_duty)},
                    {'item': 'Service Fee', 'amount': float(service_fee)}
                ]
            }
        }

    def _calculate_commercial_tonnage_premium(self, request: Dict, subcategory) -> Dict[str, Any]:
        """Calculate premium based on commercial tonnage scale"""
        underwriter_id = request['underwriter_id']
        pricing_inputs = request.get('pricing_inputs', {})
        tonnage = Decimal(str(pricing_inputs.get('tonnage', 0)))
        is_fleet = pricing_inputs.get('is_fleet', False)
        is_prime_mover = pricing_inputs.get('is_prime_mover', False)

        # Get tonnage-based pricing
        tonnage_pricing = CommercialTonnagePricing.objects.filter(
            underwriter_id=underwriter_id,
            subcategory_id=subcategory.id,
            tonnage_min__lte=tonnage,
            tonnage_max__gte=tonnage,
            is_fleet_pricing=is_fleet,
            is_prime_mover=is_prime_mover
        ).first()

        if not tonnage_pricing:
            # Default to highest tonnage bracket if not found
            tonnage_pricing = CommercialTonnagePricing.objects.filter(
                underwriter_id=underwriter_id,
                subcategory_id=subcategory.id,
                is_fleet_pricing=is_fleet,
                is_prime_mover=is_prime_mover
            ).order_by('-tonnage_max').first()

        if not tonnage_pricing:
            raise ValueError("No tonnage pricing found for commercial vehicle")

        base_premium = tonnage_pricing.base_premium

        # Apply fleet discount if applicable
        if is_fleet and tonnage_pricing.fleet_discount_percentage:
            fleet_discount = base_premium * (tonnage_pricing.fleet_discount_percentage / 100)
            base_premium -= fleet_discount

        # Calculate mandatory levies
        pricing = MotorPricing.objects.filter(
            underwriter_id=underwriter_id,
            subcategory_id=subcategory.id
        ).first()

        itl_levy = base_premium * Decimal('0.0025')  # 0.25%
        pcf_levy = base_premium * Decimal('0.0025')  # 0.25%
        stamp_duty = Decimal('40')

        total_premium = base_premium + itl_levy + pcf_levy + stamp_duty

        return {
            'calculation_type': 'commercial_tonnage',
            'premium_calculation': {
                'base_premium': float(base_premium),
                'itl_levy': float(itl_levy),
                'pcf_levy': float(pcf_levy),
                'stamp_duty': float(stamp_duty),
                'total_premium': float(total_premium),
                'currency': 'KES'
            },
            'breakdown': {
                'tonnage_details': {
                    'tonnage': float(tonnage),
                    'tonnage_bracket': tonnage_pricing.tonnage_description,
                    'is_fleet': is_fleet,
                    'is_prime_mover': is_prime_mover,
                    'base_rate': float(tonnage_pricing.base_premium)
                },
                'levies': [
                    {'item': 'Insurance Training Levy (0.25%)', 'amount': float(itl_levy)},
                    {'item': 'Policyholders Compensation Fund (0.25%)', 'amount': float(pcf_levy)},
                    {'item': 'Stamp Duty', 'amount': float(stamp_duty)}
                ]
            }
        }

    def _calculate_comprehensive_premium(self, request: Dict, subcategory) -> Dict[str, Any]:
        """Calculate Comprehensive premium (bracket-based + factors)"""
        underwriter_id = request['underwriter_id']
        pricing_inputs = request.get('pricing_inputs', {})
        selected_coverages = request.get('selected_coverages', [])

        sum_insured = Decimal(str(pricing_inputs.get('sum_insured', 0)))

        if sum_insured <= 0:
            raise ValueError("Sum insured is required for comprehensive products")

        # Find applicable pricing bracket
        pricing_bracket = MotorPricing.objects.filter(
            underwriter_id=underwriter_id,
            subcategory_id=subcategory.id,
            sum_insured_min__lte=sum_insured,
            sum_insured_max__gte=sum_insured
        ).first()

        if not pricing_bracket:
            raise ValueError("No pricing bracket found for sum insured amount")

        # Calculate base premium
        base_rate = pricing_bracket.base_rate_min  # Can be enhanced with rate selection logic
        base_premium = sum_insured * base_rate

        # Apply minimum premium rule
        base_premium = max(base_premium, pricing_bracket.minimum_premium or 0)

        # Apply vehicle adjustment factors
        adjusted_premium = self._apply_vehicle_adjustments(
            base_premium, pricing_inputs, underwriter_id, subcategory.category_id
        )

        # Calculate additional coverages
        additional_coverages = self._calculate_additional_coverages(
            sum_insured, pricing_bracket, pricing_inputs, selected_coverages
        )

        total_additional = sum(additional_coverages.values())
        gross_premium = adjusted_premium + total_additional

        # Calculate mandatory levies on gross premium
        itl_levy = gross_premium * (pricing_bracket.insurance_training_levy_rate or Decimal('0.0025'))
        pcf_levy = gross_premium * (pricing_bracket.pcf_levy_rate or Decimal('0.0025'))
        stamp_duty = pricing_bracket.stamp_duty or Decimal('40')
        service_fee = pricing_bracket.service_fee or Decimal('0')

        total_premium = gross_premium + itl_levy + pcf_levy + stamp_duty + service_fee

        return {
            'calculation_type': 'comprehensive',
            'premium_calculation': {
                'base_premium': float(base_premium),
                'adjusted_premium': float(adjusted_premium),
                'additional_coverages': {k: float(v) for k, v in additional_coverages.items()},
                'gross_premium': float(gross_premium),
                'itl_levy': float(itl_levy),
                'pcf_levy': float(pcf_levy),
                'stamp_duty': float(stamp_duty),
                'service_fee': float(service_fee),
                'total_premium': float(total_premium),
                'currency': pricing_bracket.currency
            },
            'breakdown': {
                'base_calculation': {
                    'sum_insured': float(sum_insured),
                    'base_rate': float(base_rate * 100),  # Convert to percentage
                    'base_premium': float(base_premium)
                },
                'adjustments': {
                    'vehicle_adjustments': float(adjusted_premium - base_premium),
                    'adjusted_premium': float(adjusted_premium)
                },
                'additional_coverages': [
                    {
                        'coverage': coverage.replace('_', ' ').title(),
                        'amount': float(amount)
                    }
                    for coverage, amount in additional_coverages.items()
                ],
                'totals': {
                    'base_premium': float(base_premium),
                    'vehicle_adjustments': float(adjusted_premium - base_premium),
                    'additional_coverages': float(total_additional),
                    'final_total': float(total_premium)
                }
            },
            'pricing_details': {
                'bracket_used': f"{pricing_bracket.sum_insured_min}-{pricing_bracket.sum_insured_max}",
                'rate_applied': float(base_rate * 100),
                'minimum_premium_check': 'passed' if base_premium >= (pricing_bracket.minimum_premium or 0) else 'applied'
            }
        }

    def _get_field_adjustment(self, underwriter_id, subcategory_id, field_name, field_value):
        """Get adjustment for additional fields like tonnage, passengers"""
        adjustment = AdditionalFieldPricing.objects.filter(
            underwriter_id=underwriter_id,
            subcategory_id=subcategory_id,
            field_name=field_name,
            field_range_min__lte=field_value,
            field_range_max__gte=field_value
        ).first()

        if adjustment:
            return {
                'amount': adjustment.rate_adjustment,
                'description': f"{field_name.title()}: {field_value} ({adjustment.field_range_min}-{adjustment.field_range_max})"
            }
        return None

    def _apply_vehicle_adjustments(self, base_premium, pricing_inputs, underwriter_id, category_id):
        """Apply vehicle age, usage type, and other adjustment factors"""
        adjusted_premium = base_premium

        # Vehicle age adjustment
        vehicle_age = pricing_inputs.get('vehicle_age')
        if vehicle_age is not None:
            age_factor = self._get_adjustment_factor(
                underwriter_id, category_id, 'age', vehicle_age
            )
            adjusted_premium *= age_factor

        # Usage type adjustment
        usage_type = pricing_inputs.get('usage_type')
        if usage_type:
            usage_factor = self._get_usage_type_factor(
                underwriter_id, category_id, usage_type
            )
            adjusted_premium *= usage_factor

        return adjusted_premium

    def _get_adjustment_factor(self, underwriter_id, category_id, factor_type, factor_value):
        """Get adjustment factor for vehicle characteristics"""
        factor = VehicleAdjustmentFactors.objects.filter(
            underwriter_id=underwriter_id,
            category_id=category_id,
            factor_type=factor_type,
            factor_range_min__lte=factor_value,
            factor_range_max__gte=factor_value
        ).first()

        return factor.rate_multiplier if factor else Decimal('1.0')

    def _get_usage_type_factor(self, underwriter_id, category_id, usage_type):
        """Get usage type adjustment factor"""
        # This could be stored in VehicleAdjustmentFactors or a separate table
        usage_factors = {
            'private': Decimal('1.0'),
            'commercial': Decimal('1.3'),
            'hire_reward': Decimal('1.5')
        }
        return usage_factors.get(usage_type, Decimal('1.0'))

    def _calculate_additional_coverages(self, sum_insured, pricing_bracket, pricing_inputs, selected_coverages):
        """Calculate additional coverage premiums"""
        coverages = {}

        if 'excess_protector' in selected_coverages and pricing_bracket.excess_protector_rate:
            excess_premium = max(
                sum_insured * pricing_bracket.excess_protector_rate,
                pricing_bracket.excess_protector_minimum or 0
            )
            coverages['excess_protector'] = excess_premium

        if 'pvt' in selected_coverages and pricing_bracket.pvt_rate:
            pvt_premium = max(
                sum_insured * pricing_bracket.pvt_rate,
                pricing_bracket.pvt_minimum or 0
            )
            coverages['pvt'] = pvt_premium

        if 'windscreen' in selected_coverages and pricing_bracket.windscreen_percentage:
            windscreen_value = Decimal(str(pricing_inputs.get('windscreen_value', 0)))
            if windscreen_value > (pricing_bracket.windscreen_limit or 0):
                excess_value = windscreen_value - pricing_bracket.windscreen_limit
                coverages['windscreen'] = excess_value * pricing_bracket.windscreen_percentage

        if 'radio' in selected_coverages and pricing_bracket.radio_percentage:
            radio_value = Decimal(str(pricing_inputs.get('radio_value', 0)))
            if radio_value > (pricing_bracket.radio_limit or 0):
                excess_value = radio_value - pricing_bracket.radio_limit
                coverages['radio'] = excess_value * pricing_bracket.radio_percentage

        return coverages

# apps/insurance/views.py
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .services.motor_pricing_engine import MotorPricingEngine

@api_view(['POST'])
def calculate_motor_premium(request):
    """Universal motor insurance premium calculation endpoint"""
    try:
        pricing_engine = MotorPricingEngine()
        result = pricing_engine.calculate_premium(request.data)

        return Response({
            'status': 'success',
            'data': result
        })

    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=400)

@api_view(['POST'])
def compare_motor_pricing(request):
    """Compare pricing across multiple underwriters"""
    try:
        pricing_engine = MotorPricingEngine()

        # Get all underwriters for the subcategory
        underwriters = Underwriter.objects.filter(
            is_active=True,
            supported_categories__contains=[request.data.get('category')]
        )

        comparison_results = []

        for underwriter in underwriters:
            try:
                request_data = request.data.copy()
                request_data['underwriter_id'] = underwriter.id

                result = pricing_engine.calculate_premium(request_data)

                comparison_results.append({
                    'underwriter': {
                        'id': underwriter.id,
                        'name': underwriter.company_name,
                        'logo_url': underwriter.logo_url
                    },
                    'total_premium': result['premium_calculation']['total_premium'],
                    'breakdown': result['breakdown'],
                    'features': underwriter.features,
                    'available': True
                })

            except Exception as e:
                # Log error but continue with other underwriters
                print(f"Error calculating for underwriter {underwriter.id}: {e}")
                continue

        # Sort by total premium
        comparison_results.sort(key=lambda x: x['total_premium'])

        # Calculate best value
        best_value = None
        if len(comparison_results) > 1:
            cheapest = comparison_results[0]['total_premium']
            most_expensive = comparison_results[-1]['total_premium']
            best_value = {
                'underwriter_id': comparison_results[0]['underwriter']['id'],
                'savings': most_expensive - cheapest,
                'percentage_savings': ((most_expensive - cheapest) / most_expensive) * 100
            }

        return Response({
            'status': 'success',
            'data': {
                'comparison_results': comparison_results,
                'best_value': best_value
            }
        })

    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=400)
```

## 5. Enhanced Frontend Architecture

### 5.1 Context Architecture for All Product Types

```javascript
// MotorInsuranceContext.js
import React, { createContext, useContext, useReducer } from "react";
import { MotorInsurancePricingService } from "../services/MotorInsurancePricingService";

const MotorInsuranceContext = createContext();

const initialState = {
  // Category Selection
  selectedCategory: null,
  selectedSubcategory: null,
  productType: null, // 'tor', 'third_party', 'comprehensive'

  // Vehicle Details
  vehicleDetails: {
    registration: "",
    make: "",
    model: "",
    year: "",
    chassisNumber: "",
    engineNumber: "",
  },

  // Pricing Inputs (dynamic based on product type)
  pricingInputs: {},

  // Client Details
  clientDetails: {
    name: "",
    phone: "",
    email: "",
    idNumber: "",
    kraPin: "",
  },

  // Pricing & Underwriters
  availableUnderwriters: [],
  selectedUnderwriter: null,
  pricingComparison: [],
  calculatedPremium: null,

  // Form State
  currentStep: 1,
  formValidation: {},
  isLoading: false,
  errors: {},
};

const motorInsuranceReducer = (state, action) => {
  switch (action.type) {
    case "SET_CATEGORY_SELECTION":
      return {
        ...state,
        selectedCategory: action.payload.category,
        selectedSubcategory: action.payload.subcategory,
        productType: action.payload.productType,
        pricingInputs: {}, // Reset pricing inputs when category changes
        selectedUnderwriter: null,
        calculatedPremium: null,
      };

    case "UPDATE_VEHICLE_DETAILS":
      return {
        ...state,
        vehicleDetails: { ...state.vehicleDetails, ...action.payload },
      };

    case "UPDATE_PRICING_INPUTS":
      return {
        ...state,
        pricingInputs: { ...state.pricingInputs, ...action.payload },
      };

    case "SET_AVAILABLE_UNDERWRITERS":
      return {
        ...state,
        availableUnderwriters: action.payload,
      };

    case "SET_PRICING_COMPARISON":
      return {
        ...state,
        pricingComparison: action.payload,
      };

    case "SELECT_UNDERWRITER":
      return {
        ...state,
        selectedUnderwriter: action.payload,
      };

    case "SET_CALCULATED_PREMIUM":
      return {
        ...state,
        calculatedPremium: action.payload,
      };

    case "UPDATE_CLIENT_DETAILS":
      return {
        ...state,
        clientDetails: { ...state.clientDetails, ...action.payload },
      };

    case "SET_CURRENT_STEP":
      return {
        ...state,
        currentStep: action.payload,
      };

    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      };

    case "SET_ERRORS":
      return {
        ...state,
        errors: action.payload,
      };

    case "RESET_FORM":
      return initialState;

    default:
      return state;
  }
};

export const MotorInsuranceProvider = ({ children }) => {
  const [state, dispatch] = useReducer(motorInsuranceReducer, initialState);
  const pricingService = new MotorInsurancePricingService();

  // Actions
  const setCategorySelection = (category, subcategory, productType) => {
    dispatch({
      type: "SET_CATEGORY_SELECTION",
      payload: { category, subcategory, productType },
    });
  };

  const updateVehicleDetails = (details) => {
    dispatch({ type: "UPDATE_VEHICLE_DETAILS", payload: details });
  };

  const updatePricingInputs = (inputs) => {
    dispatch({ type: "UPDATE_PRICING_INPUTS", payload: inputs });

    // Auto-calculate if we have enough data
    if (state.selectedUnderwriter && isReadyForCalculation(inputs)) {
      calculatePremium();
    }
  };

  const loadUnderwriters = async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const response = await pricingService.getPricingForSubcategory(
        state.selectedCategory.code,
        state.selectedSubcategory.code,
        state.productType
      );
      dispatch({
        type: "SET_AVAILABLE_UNDERWRITERS",
        payload: response.underwriters,
      });
    } catch (error) {
      dispatch({
        type: "SET_ERRORS",
        payload: { underwriters: error.message },
      });
    }
    dispatch({ type: "SET_LOADING", payload: false });
  };

  const calculatePremium = async (underwriterId = null) => {
    const targetUnderwriter = underwriterId || state.selectedUnderwriter?.id;
    if (!targetUnderwriter) return;

    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const calculationData = {
        category: state.selectedCategory.code,
        subcategory: state.selectedSubcategory.code,
        product_type: state.productType,
        underwriter_id: targetUnderwriter,
        vehicle_details: state.vehicleDetails,
        pricing_inputs: state.pricingInputs,
      };

      const response = await pricingService.calculatePremium(calculationData);
      dispatch({ type: "SET_CALCULATED_PREMIUM", payload: response.data });
    } catch (error) {
      dispatch({ type: "SET_ERRORS", payload: { calculation: error.message } });
    }
    dispatch({ type: "SET_LOADING", payload: false });
  };

  const comparePricing = async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const comparisonData = {
        category: state.selectedCategory.code,
        subcategory: state.selectedSubcategory.code,
        product_type: state.productType,
        vehicle_details: state.vehicleDetails,
        pricing_inputs: state.pricingInputs,
        selected_coverages: state.pricingInputs.selectedCoverages || [],
      };

      const response = await pricingService.comparePricing(comparisonData);
      dispatch({
        type: "SET_PRICING_COMPARISON",
        payload: response.data.comparison_results,
      });
    } catch (error) {
      dispatch({ type: "SET_ERRORS", payload: { comparison: error.message } });
    }
    dispatch({ type: "SET_LOADING", payload: false });
  };

  const isReadyForCalculation = (inputs = state.pricingInputs) => {
    if (!state.selectedSubcategory) return false;

    const requirements = state.selectedSubcategory.pricing_requirements || {};

    for (const [field, requirement] of Object.entries(requirements)) {
      if (requirement.required && !inputs[field]) {
        return false;
      }
    }

    return true;
  };

  const validateCurrentStep = () => {
    const errors = {};

    switch (state.currentStep) {
      case 1: // Category Selection
        if (!state.selectedCategory)
          errors.category = "Please select a category";
        if (!state.selectedSubcategory)
          errors.subcategory = "Please select a product";
        break;

      case 2: // Vehicle Details
        if (!state.vehicleDetails.registration)
          errors.registration = "Registration is required";
        if (!state.vehicleDetails.make) errors.make = "Make is required";
        if (!state.vehicleDetails.model) errors.model = "Model is required";
        break;

      case 3: // Pricing Inputs
        const requirements =
          state.selectedSubcategory?.pricing_requirements || {};
        for (const [field, requirement] of Object.entries(requirements)) {
          if (requirement.required && !state.pricingInputs[field]) {
            errors[field] = `${field.replace("_", " ")} is required`;
          }
        }
        break;

      case 4: // Underwriter Selection
        if (!state.selectedUnderwriter)
          errors.underwriter = "Please select an underwriter";
        break;

      case 5: // Client Details
        if (!state.clientDetails.name) errors.name = "Name is required";
        if (!state.clientDetails.phone) errors.phone = "Phone is required";
        if (!state.clientDetails.idNumber)
          errors.idNumber = "ID Number is required";
        break;
    }

    dispatch({ type: "SET_ERRORS", payload: errors });
    return Object.keys(errors).length === 0;
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      dispatch({ type: "SET_CURRENT_STEP", payload: state.currentStep + 1 });
    }
  };

  const previousStep = () => {
    dispatch({ type: "SET_CURRENT_STEP", payload: state.currentStep - 1 });
  };

  return (
    <MotorInsuranceContext.Provider
      value={{
        ...state,
        actions: {
          setCategorySelection,
          updateVehicleDetails,
          updatePricingInputs,
          loadUnderwriters,
          calculatePremium,
          comparePricing,
          selectUnderwriter: (underwriter) =>
            dispatch({ type: "SELECT_UNDERWRITER", payload: underwriter }),
          updateClientDetails: (details) =>
            dispatch({ type: "UPDATE_CLIENT_DETAILS", payload: details }),
          nextStep,
          previousStep,
          resetForm: () => dispatch({ type: "RESET_FORM" }),
          isReadyForCalculation,
        },
      }}
    >
      {children}
    </MotorInsuranceContext.Provider>
  );
};

export const useMotorInsurance = () => {
  const context = useContext(MotorInsuranceContext);
  if (!context) {
    throw new Error(
      "useMotorInsurance must be used within MotorInsuranceProvider"
    );
  }
  return context;
};
```

### 5.2 Dynamic Form Components

#### 5.2.1 Category Selection Component

```javascript
// components/CategorySelectionScreen.js
import React from "react";
import { View, Text, TouchableOpacity, ScrollView, Image } from "react-native";
import { useMotorInsurance } from "../contexts/MotorInsuranceContext";

const CategorySelectionScreen = ({ navigation }) => {
  const { actions } = useMotorInsurance();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const pricingService = new MotorInsurancePricingService();
      const response = await pricingService.getCategories();
      setCategories(response.categories);
    } catch (error) {
      Alert.alert("Error", "Failed to load categories");
    }
  };

  const CategoryCard = ({ category }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={() => navigation.navigate("SubcategorySelection", { category })}
    >
      <Image source={{ uri: category.icon }} style={styles.categoryIcon} />
      <Text style={styles.categoryName}>{category.name}</Text>
      <Text style={styles.categoryDescription}>{category.description}</Text>
      <Text style={styles.productCount}>
        {category.subcategories.length} products
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Select Insurance Category</Text>
      <View style={styles.categoriesGrid}>
        {categories.map((category) => (
          <CategoryCard key={category.code} category={category} />
        ))}
      </View>
    </ScrollView>
  );
};
```

#### 5.2.2 Dynamic Pricing Input Form

```javascript
// components/DynamicPricingForm.js
import React from "react";
import { View, Text, TextInput, ScrollView } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useMotorInsurance } from "../contexts/MotorInsuranceContext";

const DynamicPricingForm = () => {
  const { selectedSubcategory, pricingInputs, actions, errors } =
    useMotorInsurance();

  if (!selectedSubcategory) return null;

  const renderField = (fieldName, requirements) => {
    const value = pricingInputs[fieldName] || "";
    const error = errors[fieldName];

    switch (requirements.type) {
      case "number":
        return (
          <View key={fieldName} style={styles.inputGroup}>
            <Text style={styles.label}>
              {fieldName.replace("_", " ").toUpperCase()}
              {requirements.required && " *"}
            </Text>
            <TextInput
              style={[styles.input, error && styles.inputError]}
              value={value.toString()}
              onChangeText={(text) =>
                actions.updatePricingInputs({
                  [fieldName]: parseFloat(text) || 0,
                })
              }
              placeholder={`Enter ${fieldName.replace("_", " ")}`}
              keyboardType="numeric"
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
            {requirements.min && requirements.max && (
              <Text style={styles.helpText}>
                Range: {requirements.min} - {requirements.max}
              </Text>
            )}
          </View>
        );

      case "string":
        if (requirements.options) {
          return (
            <View key={fieldName} style={styles.inputGroup}>
              <Text style={styles.label}>
                {fieldName.replace("_", " ").toUpperCase()}
                {requirements.required && " *"}
              </Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={value}
                  onValueChange={(itemValue) =>
                    actions.updatePricingInputs({ [fieldName]: itemValue })
                  }
                  style={styles.picker}
                >
                  <Picker.Item label="Select option..." value="" />
                  {requirements.options.map((option) => (
                    <Picker.Item
                      key={option}
                      label={option.toUpperCase()}
                      value={option}
                    />
                  ))}
                </Picker>
              </View>
              {error && <Text style={styles.errorText}>{error}</Text>}
            </View>
          );
        } else {
          return (
            <View key={fieldName} style={styles.inputGroup}>
              <Text style={styles.label}>
                {fieldName.replace("_", " ").toUpperCase()}
                {requirements.required && " *"}
              </Text>
              <TextInput
                style={[styles.input, error && styles.inputError]}
                value={value}
                onChangeText={(text) =>
                  actions.updatePricingInputs({ [fieldName]: text })
                }
                placeholder={`Enter ${fieldName.replace("_", " ")}`}
              />
              {error && <Text style={styles.errorText}>{error}</Text>}
            </View>
          );
        }

      default:
        return null;
    }
  };

  // Special handling for comprehensive products
  const renderComprehensiveFields = () => {
    if (selectedSubcategory.product_type !== "comprehensive") return null;

    return (
      <View>
        <Text style={styles.sectionTitle}>Additional Coverages</Text>
        {["excess_protector", "pvt", "windscreen", "radio"].map((coverage) => (
          <CheckBox
            key={coverage}
            title={coverage.replace("_", " ").toUpperCase()}
            checked={
              pricingInputs.selectedCoverages?.includes(coverage) || false
            }
            onPress={() => {
              const current = pricingInputs.selectedCoverages || [];
              const updated = current.includes(coverage)
                ? current.filter((c) => c !== coverage)
                : [...current, coverage];
              actions.updatePricingInputs({ selectedCoverages: updated });
            }}
          />
        ))}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>
        {selectedSubcategory.name} - Pricing Details
      </Text>

      {/* Render dynamic fields based on requirements */}
      {Object.entries(selectedSubcategory.pricing_requirements || {}).map(
        ([fieldName, requirements]) => renderField(fieldName, requirements)
      )}

      {/* Comprehensive-specific fields */}
      {renderComprehensiveFields()}

      {/* Real-time premium display */}
      <PremiumCalculationDisplay />
    </ScrollView>
  );
};
```

#### 5.2.3 Real-time Premium Display

```javascript
// components/PremiumCalculationDisplay.js
const PremiumCalculationDisplay = () => {
  const { calculatedPremium, selectedUnderwriter, isLoading, actions } =
    useMotorInsurance();

  if (!selectedUnderwriter || isLoading) {
    return (
      <View style={styles.premiumContainer}>
        <Text style={styles.loadingText}>
          {isLoading
            ? "Calculating premium..."
            : "Select underwriter to see pricing"}
        </Text>
      </View>
    );
  }

  if (!calculatedPremium) return null;

  const renderBreakdown = () => {
    const { breakdown, premium_calculation } = calculatedPremium;

    if (calculatedPremium.calculation_type === "comprehensive") {
      return (
        <View style={styles.breakdownContainer}>
          <Text style={styles.breakdownTitle}>Premium Breakdown</Text>

          <View style={styles.breakdownSection}>
            <Text style={styles.sectionTitle}>Base Calculation</Text>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Sum Insured:</Text>
              <Text style={styles.breakdownValue}>
                KSh {breakdown.base_calculation.sum_insured.toLocaleString()}
              </Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Base Rate:</Text>
              <Text style={styles.breakdownValue}>
                {breakdown.base_calculation.base_rate}%
              </Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Base Premium:</Text>
              <Text style={styles.breakdownValue}>
                KSh {breakdown.base_calculation.base_premium.toLocaleString()}
              </Text>
            </View>
          </View>

          {breakdown.adjustments.vehicle_adjustments > 0 && (
            <View style={styles.breakdownSection}>
              <Text style={styles.sectionTitle}>Vehicle Adjustments</Text>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Age/Usage Factors:</Text>
                <Text style={styles.breakdownValue}>
                  KSh{" "}
                  {breakdown.adjustments.vehicle_adjustments.toLocaleString()}
                </Text>
              </View>
            </View>
          )}

          {breakdown.additional_coverages.length > 0 && (
            <View style={styles.breakdownSection}>
              <Text style={styles.sectionTitle}>Additional Coverages</Text>
              {breakdown.additional_coverages.map((coverage, index) => (
                <View key={index} style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>
                    {coverage.coverage}:
                  </Text>
                  <Text style={styles.breakdownValue}>
                    KSh {coverage.amount.toLocaleString()}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      );
    }

    // Simple breakdown for TOR/Third-Party
    return (
      <View style={styles.breakdownContainer}>
        <Text style={styles.breakdownTitle}>Premium Breakdown</Text>
        {breakdown.map((item, index) => (
          <View key={index} style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>{item.item}:</Text>
            <Text style={styles.breakdownValue}>
              KSh {item.amount.toLocaleString()}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.premiumContainer}>
      <View style={styles.totalPremiumRow}>
        <Text style={styles.totalLabel}>Total Premium:</Text>
        <Text style={styles.totalValue}>
          KSh{" "}
          {calculatedPremium.premium_calculation.total_premium.toLocaleString()}
        </Text>
      </View>

      {renderBreakdown()}

      <TouchableOpacity
        style={styles.compareButton}
        onPress={actions.comparePricing}
      >
        <Text style={styles.compareButtonText}>
          Compare with Other Underwriters
        </Text>
      </TouchableOpacity>
    </View>
  );
};
```

## 5. Implementation Phases

### Phase 1: Foundation (Week 1)

1. **Database Setup**

   - Create tables for categories, subcategories, pricing
   - Seed initial data for all motor categories
   - Set up underwriter pricing matrix

2. **Backend API Development**

   - Implement unified pricing endpoint
   - Add category and subcategory management
   - Create pricing calculation logic

3. **Frontend Core Services**
   - Implement MotorInsurancePricingService
   - Create MotorInsuranceContext
   - Set up navigation structure

### Phase 2: UI Components (Week 2)

1. **Category Selection**

   - CategorySelectionScreen with grid layout
   - SubcategorySelectionScreen with list layout
   - Dynamic field configuration

2. **Form Components**
   - DynamicVehicleForm with conditional fields
   - UnderwriterPricingList with comparison
   - ClientDetailsForm (reuse from TOR)

### Phase 3: Integration (Week 3)

1. **Payment Integration**

   - M-PESA payment gateway
   - DPO Pay integration
   - Payment status tracking

2. **Policy Management**
   - Policy issuance flow
   - Receipt generation
   - Document storage

### Phase 4: Testing & Optimization (Week 4)

1. **Testing**

   - Unit tests for pricing calculations
   - Integration tests for complete flows
   - UI testing for all categories

2. **Performance Optimization**
   - Pricing data caching
   - Image optimization
   - Bundle size optimization

## 6. Enhanced API Endpoint Specifications

### 6.1 Get Motor Categories with Pricing Types

```
GET /api/v1/public_app/insurance/motor_categories

Response:
{
  "categories": [
    {
      "code": "private",
      "name": "Private",
      "icon": "car",
      "pricing_type": "hybrid",
      "subcategories": [
        {
          "code": "tor_for_private",
          "name": "TOR For Private",
          "product_type": "tor",
          "additional_fields": [],
          "pricing_requirements": {},
          "description": "Traffic Offence Report for private vehicles"
        },
        {
          "code": "private_comprehensive",
          "name": "Private Comprehensive",
          "product_type": "comprehensive",
          "additional_fields": ["sum_insured", "vehicle_age", "usage_type"],
          "pricing_requirements": {
            "sum_insured": {"required": true, "type": "number", "min": 100000},
            "vehicle_age": {"required": true, "type": "number", "min": 0, "max": 30},
            "usage_type": {"required": true, "type": "string", "options": ["private", "commercial"]}
          },
          "description": "Comprehensive insurance for private vehicles"
        }
      ]
    },
    {
      "code": "commercial",
      "name": "Commercial",
      "icon": "truck",
      "pricing_type": "hybrid",
      "subcategories": [
        {
          "code": "tor_for_commercial",
          "name": "TOR For Commercial",
          "product_type": "tor",
          "additional_fields": ["tonnage"],
          "pricing_requirements": {
            "tonnage": {"required": true, "type": "number", "min": 0, "max": 50}
          }
        },
        {
          "code": "commercial_comprehensive",
          "name": "Commercial Comprehensive",
          "product_type": "comprehensive",
          "additional_fields": ["sum_insured", "vehicle_age", "tonnage", "business_type"],
          "pricing_requirements": {
            "sum_insured": {"required": true, "type": "number", "min": 200000},
            "vehicle_age": {"required": true, "type": "number", "min": 0, "max": 25},
            "tonnage": {"required": true, "type": "number", "min": 0, "max": 50},
            "business_type": {"required": true, "type": "string", "options": ["own_goods", "general_cartage", "institutional"]}
          }
        }
      ]
    }
  ]
}
```

### 6.2 Get Pricing for Subcategory (Enhanced)

```
GET /api/v1/public_app/insurance/motor_pricing
Query: category=private&sub_category=private_comprehensive&product_type=comprehensive

Response:
{
  "category": "private",
  "subcategory": "private_comprehensive",
  "product_type": "comprehensive",
  "pricing_model": "bracket_based",
  "underwriters": [
    {
      "id": 1,
      "name": "Jubilee Insurance",
      "logo_url": "https://...",
      "pricing_brackets": [
        {
          "sum_insured_min": 500000,
          "sum_insured_max": 1500000,
          "base_rate_min": 3.75,
          "base_rate_max": 4.50,
          "minimum_premium": 27500
        },
        {
          "sum_insured_min": 1500001,
          "sum_insured_max": 2000000,
          "base_rate_min": 3.50,
          "base_rate_max": 4.00,
          "minimum_premium": 52500
        }
      ],
      "additional_coverages": {
        "excess_protector": {
          "rate": 0.25,
          "minimum": 3000,
          "description": "Protects against excess payments"
        },
        "pvt": {
          "rate": 0.25,
          "minimum": 2500,
          "description": "Political Violence & Terrorism"
        },
        "windscreen": {
          "limit": 30000,
          "percentage": 10,
          "description": "10% of limit above KSh 30,000"
        }
      },
      "adjustment_factors": {
        "vehicle_age": [
          {"range": "0-3", "multiplier": 1.0, "description": "New vehicles"},
          {"range": "4-7", "multiplier": 1.1, "description": "4-7 years old"},
          {"range": "8-12", "multiplier": 1.25, "description": "8-12 years old"},
          {"range": "13+", "multiplier": 1.5, "description": "Over 13 years"}
        ],
        "usage_type": [
          {"type": "private", "multiplier": 1.0},
          {"type": "commercial", "multiplier": 1.3},
          {"type": "hire_reward", "multiplier": 1.5}
        ]
      },
      "features": ["instant_issuance", "online_payment"],
      "available": true
    }
  ]
}
```

### 6.3 Enhanced Premium Calculation Endpoint

```
POST /api/v1/public_app/insurance/calculate_motor_premium

Request (TOR Product):
{
  "category": "private",
  "subcategory": "tor_for_private",
  "product_type": "tor",
  "underwriter_id": 1,
  "vehicle_details": {
    "registration": "KCA123A",
    "make": "Toyota",
    "model": "Corolla",
    "year": 2020
  }
}

Response (TOR Product):
{
  "calculation_type": "fixed",
  "premium_calculation": {
    "base_premium": 3500,
    "training_levy": 350,
    "stamp_duty": 40,
    "total_premium": 3890,
    "currency": "KES"
  },
  "breakdown": [
    {"item": "Base Premium", "amount": 3500},
    {"item": "Training Levy (10%)", "amount": 350},
    {"item": "Stamp Duty", "amount": 40}
  ]
}

Request (Comprehensive Product):
{
  "category": "private",
  "subcategory": "private_comprehensive",
  "product_type": "comprehensive",
  "underwriter_id": 1,
  "vehicle_details": {
    "registration": "KCA123A",
    "make": "Toyota",
    "model": "Prado",
    "year": 2018
  },
  "pricing_inputs": {
    "sum_insured": 1800000,
    "vehicle_age": 6,
    "usage_type": "private",
    "windscreen_value": 45000,
    "radio_value": 25000
  },
  "selected_coverages": ["excess_protector", "pvt", "windscreen"]
}

Response (Comprehensive Product):
{
  "calculation_type": "comprehensive",
  "premium_calculation": {
    "base_premium": 63000,
    "adjusted_premium": 69300,
    "additional_coverages": {
      "excess_protector": 4500,
      "pvt": 4500,
      "windscreen": 1500,
      "radio": 0
    },
    "total_premium": 79800,
    "currency": "KES"
  },
  "breakdown": {
    "base_calculation": {
      "sum_insured": 1800000,
      "base_rate": 3.5,
      "base_premium": 63000
    },
    "adjustments": {
      "vehicle_age_factor": 1.1,
      "usage_factor": 1.0,
      "adjusted_premium": 69300
    },
    "additional_coverages": [
      {"coverage": "Excess Protector", "calculation": "1800000 * 0.25%", "amount": 4500},
      {"coverage": "PVT", "calculation": "1800000 * 0.25%", "amount": 4500},
      {"coverage": "Windscreen", "calculation": "(45000 - 30000) * 10%", "amount": 1500}
    ],
    "totals": {
      "base_premium": 63000,
      "vehicle_adjustments": 6300,
      "additional_coverages": 10500,
      "final_total": 79800
    }
  },
  "pricing_details": {
    "bracket_used": "1500001-2000000",
    "rate_applied": 3.5,
    "minimum_premium_check": "passed"
  }
}

Request (Commercial with Tonnage):
{
  "category": "commercial",
  "subcategory": "tor_for_commercial",
  "product_type": "tor",
  "underwriter_id": 1,
  "vehicle_details": {
    "registration": "KBZ456C",
    "make": "Isuzu",
    "model": "NKR",
    "year": 2019
  },
  "pricing_inputs": {
    "tonnage": 8.5
  }
}

Response (Commercial with Tonnage):
{
  "calculation_type": "fixed_with_factors",
  "premium_calculation": {
    "base_premium": 5500,
    "tonnage_adjustment": 2000,
    "adjusted_premium": 7500,
    "training_levy": 750,
    "stamp_duty": 40,
    "total_premium": 8290,
    "currency": "KES"
  },
  "breakdown": {
    "base_premium": 5500,
    "tonnage_factor": {
      "tonnage": 8.5,
      "bracket": "6-10 tonnes",
      "adjustment": 2000
    },
    "levies": [
      {"item": "Training Levy (10%)", "amount": 750},
      {"item": "Stamp Duty", "amount": 40}
    ]
  }
}
```

### 6.4 Bulk Pricing Comparison Endpoint

```
POST /api/v1/public_app/insurance/compare_motor_pricing

Request:
{
  "category": "private",
  "subcategory": "private_comprehensive",
  "product_type": "comprehensive",
  "vehicle_details": {
    "registration": "KCA123A",
    "make": "Toyota",
    "model": "Prado",
    "year": 2018
  },
  "pricing_inputs": {
    "sum_insured": 1800000,
    "vehicle_age": 6,
    "usage_type": "private"
  },
  "selected_coverages": ["excess_protector", "pvt"]
}

Response:
{
  "comparison_results": [
    {
      "underwriter": {
        "id": 1,
        "name": "Jubilee Insurance",
        "logo_url": "https://..."
      },
      "total_premium": 79800,
      "breakdown": {...},
      "features": ["instant_issuance", "online_payment"],
      "rating": 4.5
    },
    {
      "underwriter": {
        "id": 2,
        "name": "APA Insurance",
        "logo_url": "https://..."
      },
      "total_premium": 75600,
      "breakdown": {...},
      "features": ["24h_claims"],
      "rating": 4.2
    }
  ],
  "best_value": {
    "underwriter_id": 2,
    "savings": 4200,
    "percentage_savings": 5.3
  }
}
```

## 7. Key Implementation Decisions

### 7.1 Pricing Strategy: ✅ Single Unified Endpoint

**Reasoning:**

- **Maintainability**: One endpoint to manage vs 6+ separate endpoints
- **Consistency**: Uniform response format across all categories
- **Scalability**: Easy to add new categories without new endpoints
- **Caching**: Single cache layer for all motor pricing
- **Frontend Simplicity**: One service method handles all categories

### 7.2 Database Design: ✅ Normalized Schema

**Benefits:**

- Flexible pricing matrix supporting all categories
- Easy to add new underwriters and categories
- Efficient querying with proper indexing
- Historical pricing support with effective dates

### 7.3 Frontend Architecture: ✅ Context + Service Pattern

**Advantages:**

- Reusable form components across categories
- Centralized state management
- Type-safe with TypeScript
- Easy testing and debugging

## 8. Performance Considerations

### 8.1 Backend Optimizations

- Database indexing on frequently queried fields
- Redis caching for pricing data (15-minute cache)
- Connection pooling for database
- API response compression

### 8.2 Frontend Optimizations

- React Query for data fetching and caching
- Code splitting by category
- Image lazy loading
- Bundle optimization

## 10. Comprehensive Data Seeding Strategy

### 10.1 Category and Subcategory Seeding

```python
# management/commands/seed_motor_categories.py
from django.core.management.base import BaseCommand
from apps.insurance.models import MotorCategories, MotorSubcategories

class Command(BaseCommand):
    help = 'Seed all motor insurance categories and subcategories'

    def handle(self, *args, **options):
        categories_data = [
            {
                'category_code': 'private',
                'category_name': 'Private',
                'pricing_type': 'hybrid',
                'subcategories': [
                    {
                        'subcategory_code': 'tor_for_private',
                        'subcategory_name': 'TOR For Private',
                        'product_type': 'tor',
                        'additional_fields': [],
                        'pricing_requirements': {}
                    },
                    {
                        'subcategory_code': 'private_third_party',
                        'subcategory_name': 'Private Third-Party',
                        'product_type': 'third_party',
                        'additional_fields': [],
                        'pricing_requirements': {}
                    },
                    {
                        'subcategory_code': 'private_third_party_extendible',
                        'subcategory_name': 'Private Third-Party Extendible',
                        'product_type': 'third_party',
                        'additional_fields': [],
                        'pricing_requirements': {}
                    },
                    {
                        'subcategory_code': 'private_motorcycle_third_party',
                        'subcategory_name': 'Private Motorcycle Third-Party',
                        'product_type': 'third_party',
                        'additional_fields': ['engine_capacity'],
                        'pricing_requirements': {
                            'engine_capacity': {'required': True, 'type': 'number', 'min': 50, 'max': 1500}
                        }
                    },
                    {
                        'subcategory_code': 'private_comprehensive',
                        'subcategory_name': 'Private Comprehensive',
                        'product_type': 'comprehensive',
                        'additional_fields': ['sum_insured', 'vehicle_age', 'usage_type'],
                        'pricing_requirements': {
                            'sum_insured': {'required': True, 'type': 'number', 'min': 100000},
                            'vehicle_age': {'required': True, 'type': 'number', 'min': 0, 'max': 30},
                            'usage_type': {'required': True, 'type': 'string', 'options': ['private', 'commercial']}
                        }
                    }
                ]
            },
            {
                'category_code': 'commercial',
                'category_name': 'Commercial',
                'pricing_type': 'hybrid',
                'subcategories': [
                    {
                        'subcategory_code': 'tor_for_commercial',
                        'subcategory_name': 'TOR For Commercial',
                        'product_type': 'tor',
                        'additional_fields': ['tonnage'],
                        'pricing_requirements': {
                            'tonnage': {'required': True, 'type': 'number', 'min': 0, 'max': 50}
                        }
                    },
                    {
                        'subcategory_code': 'own_goods_third_party',
                        'subcategory_name': 'Own Goods Third-Party',
                        'product_type': 'third_party',
                        'additional_fields': ['tonnage'],
                        'pricing_requirements': {
                            'tonnage': {'required': True, 'type': 'number', 'min': 0, 'max': 50}
                        }
                    },
                    {
                        'subcategory_code': 'general_cartage_third_party',
                        'subcategory_name': 'General Cartage Third-Party',
                        'product_type': 'third_party',
                        'additional_fields': ['tonnage'],
                        'pricing_requirements': {
                            'tonnage': {'required': True, 'type': 'number', 'min': 0, 'max': 50}
                        }
                    },
                    {
                        'subcategory_code': 'commercial_tuktuk_third_party',
                        'subcategory_name': 'Commercial TukTuk Third-Party',
                        'product_type': 'third_party',
                        'additional_fields': ['cargo_capacity'],
                        'pricing_requirements': {
                            'cargo_capacity': {'required': True, 'type': 'number', 'min': 0, 'max': 2}
                        }
                    },
                    {
                        'subcategory_code': 'commercial_comprehensive',
                        'subcategory_name': 'Commercial Comprehensive',
                        'product_type': 'comprehensive',
                        'additional_fields': ['sum_insured', 'vehicle_age', 'tonnage', 'business_type'],
                        'pricing_requirements': {
                            'sum_insured': {'required': True, 'type': 'number', 'min': 200000},
                            'vehicle_age': {'required': True, 'type': 'number', 'min': 0, 'max': 25},
                            'tonnage': {'required': True, 'type': 'number', 'min': 0, 'max': 50},
                            'business_type': {'required': True, 'type': 'string', 'options': ['own_goods', 'general_cartage', 'institutional']}
                        }
                    }
                ]
            },
            {
                'category_code': 'psv',
                'category_name': 'PSV (Public Service Vehicle)',
                'pricing_type': 'hybrid',
                'subcategories': [
                    {
                        'subcategory_code': 'psv_uber_third_party',
                        'subcategory_name': 'PSV Uber Third-Party',
                        'product_type': 'third_party',
                        'additional_fields': ['passenger_capacity'],
                        'pricing_requirements': {
                            'passenger_capacity': {'required': True, 'type': 'number', 'min': 1, 'max': 7}
                        }
                    },
                    {
                        'subcategory_code': 'psv_tuktuk_third_party',
                        'subcategory_name': 'PSV TukTuk Third-Party',
                        'product_type': 'third_party',
                        'additional_fields': ['passenger_capacity'],
                        'pricing_requirements': {
                            'passenger_capacity': {'required': True, 'type': 'number', 'min': 1, 'max': 3}
                        }
                    },
                    {
                        'subcategory_code': 'psv_matatu_third_party_1_month',
                        'subcategory_name': '1 Month PSV Matatu Third-Party',
                        'product_type': 'third_party',
                        'additional_fields': ['passenger_capacity', 'route_type'],
                        'pricing_requirements': {
                            'passenger_capacity': {'required': True, 'type': 'number', 'min': 8, 'max': 33},
                            'route_type': {'required': True, 'type': 'string', 'options': ['city', 'intercity', 'rural']}
                        }
                    },
                    {
                        'subcategory_code': 'psv_comprehensive',
                        'subcategory_name': 'PSV Comprehensive',
                        'product_type': 'comprehensive',
                        'additional_fields': ['sum_insured', 'vehicle_age', 'passenger_capacity', 'route_type'],
                        'pricing_requirements': {
                            'sum_insured': {'required': True, 'type': 'number', 'min': 300000},
                            'vehicle_age': {'required': True, 'type': 'number', 'min': 0, 'max': 20},
                            'passenger_capacity': {'required': True, 'type': 'number', 'min': 1, 'max': 50},
                            'route_type': {'required': True, 'type': 'string', 'options': ['city', 'intercity', 'rural']}
                        }
                    }
                ]
            },
            {
                'category_code': 'motorcycle',
                'category_name': 'Motorcycle',
                'pricing_type': 'hybrid',
                'subcategories': [
                    {
                        'subcategory_code': 'private_motorcycle_third_party',
                        'subcategory_name': 'Private Motorcycle Third-Party',
                        'product_type': 'third_party',
                        'additional_fields': ['engine_capacity'],
                        'pricing_requirements': {
                            'engine_capacity': {'required': True, 'type': 'number', 'min': 50, 'max': 1500}
                        }
                    },
                    {
                        'subcategory_code': 'psv_motorcycle_third_party',
                        'subcategory_name': 'PSV Motorcycle Third-Party',
                        'product_type': 'third_party',
                        'additional_fields': ['engine_capacity', 'passenger_capacity'],
                        'pricing_requirements': {
                            'engine_capacity': {'required': True, 'type': 'number', 'min': 100, 'max': 500},
                            'passenger_capacity': {'required': True, 'type': 'number', 'min': 1, 'max': 2}
                        }
                    },
                    {
                        'subcategory_code': 'motorcycle_comprehensive',
                        'subcategory_name': 'Motorcycle Comprehensive',
                        'product_type': 'comprehensive',
                        'additional_fields': ['sum_insured', 'vehicle_age', 'engine_capacity', 'usage_type'],
                        'pricing_requirements': {
                            'sum_insured': {'required': True, 'type': 'number', 'min': 50000},
                            'vehicle_age': {'required': True, 'type': 'number', 'min': 0, 'max': 20},
                            'engine_capacity': {'required': True, 'type': 'number', 'min': 50, 'max': 1500},
                            'usage_type': {'required': True, 'type': 'string', 'options': ['private', 'commercial']}
                        }
                    }
                ]
            },
            {
                'category_code': 'tuktuk',
                'category_name': 'TukTuk',
                'pricing_type': 'hybrid',
                'subcategories': [
                    {
                        'subcategory_code': 'psv_tuktuk_third_party',
                        'subcategory_name': 'PSV TukTuk Third-Party',
                        'product_type': 'third_party',
                        'additional_fields': ['passenger_capacity'],
                        'pricing_requirements': {
                            'passenger_capacity': {'required': True, 'type': 'number', 'min': 1, 'max': 3}
                        }
                    },
                    {
                        'subcategory_code': 'commercial_tuktuk_third_party',
                        'subcategory_name': 'Commercial TukTuk Third-Party',
                        'product_type': 'third_party',
                        'additional_fields': ['cargo_capacity'],
                        'pricing_requirements': {
                            'cargo_capacity': {'required': True, 'type': 'number', 'min': 0, 'max': 2}
                        }
                    },
                    {
                        'subcategory_code': 'tuktuk_comprehensive',
                        'subcategory_name': 'TukTuk Comprehensive',
                        'product_type': 'comprehensive',
                        'additional_fields': ['sum_insured', 'vehicle_age', 'usage_type', 'capacity'],
                        'pricing_requirements': {
                            'sum_insured': {'required': True, 'type': 'number', 'min': 100000},
                            'vehicle_age': {'required': True, 'type': 'number', 'min': 0, 'max': 15},
                            'usage_type': {'required': True, 'type': 'string', 'options': ['psv', 'commercial']},
                            'capacity': {'required': True, 'type': 'number', 'min': 0, 'max': 3}
                        }
                    }
                ]
            },
            {
                'category_code': 'special_classes',
                'category_name': 'Special Classes',
                'pricing_type': 'hybrid',
                'subcategories': [
                    {
                        'subcategory_code': 'agricultural_tractor_third_party',
                        'subcategory_name': 'Agricultural Tractor Third-Party',
                        'product_type': 'third_party',
                        'additional_fields': ['tonnage', 'horsepower'],
                        'pricing_requirements': {
                            'tonnage': {'required': True, 'type': 'number', 'min': 1, 'max': 20},
                            'horsepower': {'required': True, 'type': 'number', 'min': 20, 'max': 500}
                        }
                    },
                    {
                        'subcategory_code': 'driving_school_third_party',
                        'subcategory_name': 'Driving School Third-Party',
                        'product_type': 'third_party',
                        'additional_fields': ['vehicle_type', 'student_capacity'],
                        'pricing_requirements': {
                            'vehicle_type': {'required': True, 'type': 'string', 'options': ['car', 'truck', 'bus']},
                            'student_capacity': {'required': True, 'type': 'number', 'min': 1, 'max': 10}
                        }
                    },
                    {
                        'subcategory_code': 'special_comprehensive',
                        'subcategory_name': 'Special Classes Comprehensive',
                        'product_type': 'comprehensive',
                        'additional_fields': ['sum_insured', 'vehicle_age', 'special_type', 'usage_intensity'],
                        'pricing_requirements': {
                            'sum_insured': {'required': True, 'type': 'number', 'min': 500000},
                            'vehicle_age': {'required': True, 'type': 'number', 'min': 0, 'max': 25},
                            'special_type': {'required': True, 'type': 'string', 'options': ['agricultural', 'institutional', 'ambulance', 'fuel_tanker']},
                            'usage_intensity': {'required': True, 'type': 'string', 'options': ['light', 'medium', 'heavy']}
                        }
                    }
                ]
            }
        ]

        for category_data in categories_data:
            # Create category
            category, created = MotorCategories.objects.get_or_create(
                category_code=category_data['category_code'],
                defaults={
                    'category_name': category_data['category_name'],
                    'pricing_type': category_data['pricing_type']
                }
            )

            # Create subcategories
            for sub_data in category_data['subcategories']:
                MotorSubcategories.objects.get_or_create(
                    category=category,
                    subcategory_code=sub_data['subcategory_code'],
                    defaults={
                        'subcategory_name': sub_data['subcategory_name'],
                        'product_type': sub_data['product_type'],
                        'additional_fields': sub_data['additional_fields'],
                        'pricing_requirements': sub_data['pricing_requirements']
                    }
                )

        self.stdout.write(self.style.SUCCESS('Successfully seeded motor categories and subcategories'))
```

### 10.2 Pricing Data Seeding

```python
# management/commands/seed_comprehensive_pricing.py
from django.core.management.base import BaseCommand
from decimal import Decimal
from apps.insurance.models import (
    MotorPricing, VehicleAdjustmentFactors,
    AdditionalFieldPricing, Underwriters, MotorSubcategories
)

class Command(BaseCommand):
    help = 'Seed comprehensive pricing data for all motor products'

    def handle(self, *args, **options):
        # Create sample underwriters first
        underwriters_data = [
            {'code': 'jubilee', 'name': 'Jubilee Insurance', 'supported_categories': ['private', 'commercial', 'psv', 'motorcycle', 'tuktuk', 'special_classes']},
            {'code': 'apa', 'name': 'APA Insurance', 'supported_categories': ['private', 'commercial', 'psv']},
            {'code': 'britam', 'name': 'Britam Insurance', 'supported_categories': ['private', 'commercial', 'special_classes']},
        ]

        for u_data in underwriters_data:
            Underwriters.objects.get_or_create(
                underwriter_code=u_data['code'],
                defaults={
                    'company_name': u_data['name'],
                    'supported_categories': u_data['supported_categories']
                }
            )

        # Seed TOR pricing (simple fixed pricing)
        self._seed_tor_pricing()

        # Seed Third-Party pricing (fixed + factors)
        self._seed_third_party_pricing()

        # Seed Comprehensive pricing (bracket-based)
        self._seed_comprehensive_pricing()

        # Seed adjustment factors
        self._seed_adjustment_factors()

        self.stdout.write(self.style.SUCCESS('Successfully seeded all pricing data'))

    def _seed_tor_pricing(self):
        """Seed TOR product pricing"""
        tor_pricing_data = [
            {'subcategory_code': 'tor_for_private', 'base_premium': 3500},
            {'subcategory_code': 'tor_for_commercial', 'base_premium': 5500},
        ]

        jubilee = Underwriters.objects.get(underwriter_code='jubilee')

        for pricing in tor_pricing_data:
            subcategory = MotorSubcategories.objects.get(subcategory_code=pricing['subcategory_code'])

            MotorPricing.objects.get_or_create(
                underwriter=jubilee,
                subcategory=subcategory,
                sum_insured_min__isnull=True,
                defaults={
                    'base_premium': Decimal(str(pricing['base_premium'])),
                    'training_levy': Decimal(str(pricing['base_premium'] * 0.1)),
                    'stamp_duty': Decimal('40'),
                    'effective_from': '2024-01-01'
                }
            )

    def _seed_comprehensive_pricing(self):
        """Seed comprehensive product pricing with brackets"""
        # Private Comprehensive brackets (based on your pricing table)
        private_comprehensive_brackets = [
            {
                'sum_insured_min': 500000,
                'sum_insured_max': 1500000,
                'base_rate_min': Decimal('0.0375'),
                'base_rate_max': Decimal('0.045'),
                'minimum_premium': Decimal('27500'),
            },
            {
                'sum_insured_min': 1500001,
                'sum_insured_max': 2000000,
                'base_rate_min': Decimal('0.035'),
                'base_rate_max': Decimal('0.04'),
                'minimum_premium': Decimal('52500'),
            },
            {
                'sum_insured_min': 2000001,
                'sum_insured_max': 2500000,
                'base_rate_min': Decimal('0.03'),
                'base_rate_max': Decimal('0.035'),
                'minimum_premium': Decimal('70000'),
            },
            {
                'sum_insured_min': 2500001,
                'sum_insured_max': 10000000,
                'base_rate_min': Decimal('0.025'),
                'base_rate_max': Decimal('0.03'),
                'minimum_premium': Decimal('87500'),
            }
        ]

        jubilee = Underwriters.objects.get(underwriter_code='jubilee')
        private_comp = MotorSubcategories.objects.get(subcategory_code='private_comprehensive')

        for bracket in private_comprehensive_brackets:
            MotorPricing.objects.get_or_create(
                underwriter=jubilee,
                subcategory=private_comp,
                sum_insured_min=bracket['sum_insured_min'],
                sum_insured_max=bracket['sum_insured_max'],
                defaults={
                    'base_rate_min': bracket['base_rate_min'],
                    'base_rate_max': bracket['base_rate_max'],
                    'minimum_premium': bracket['minimum_premium'],
                    'excess_protector_rate': Decimal('0.0025'),
                    'excess_protector_minimum': Decimal('3000'),
                    'pvt_rate': Decimal('0.0025'),
                    'pvt_minimum': Decimal('2500'),
                    'windscreen_limit': Decimal('30000'),
                    'windscreen_percentage': Decimal('0.1'),
                    'radio_limit': Decimal('30000'),
                    'radio_percentage': Decimal('0.1'),
                    'effective_from': '2024-01-01'
                }
            )

    def _seed_adjustment_factors(self):
        """Seed vehicle adjustment factors"""
        jubilee = Underwriters.objects.get(underwriter_code='jubilee')
        private_category = MotorCategories.objects.get(category_code='private')

        # Vehicle age factors
        age_factors = [
            {'min': 0, 'max': 3, 'multiplier': Decimal('1.0')},
            {'min': 4, 'max': 7, 'multiplier': Decimal('1.1')},
            {'min': 8, 'max': 12, 'multiplier': Decimal('1.25')},
            {'min': 13, 'max': 30, 'multiplier': Decimal('1.5')},
        ]

        for factor in age_factors:
            VehicleAdjustmentFactors.objects.get_or_create(
                underwriter=jubilee,
                category=private_category,
                factor_type='age',
                factor_range_min=factor['min'],
                factor_range_max=factor['max'],
                defaults={'rate_multiplier': factor['multiplier']}
            )
```

### 10.3 Additional Field Pricing Seeding

```python
def _seed_additional_field_pricing(self):
    """Seed pricing for additional fields like tonnage, passengers"""
    jubilee = Underwriters.objects.get(underwriter_code='jubilee')

    # Commercial tonnage pricing
    commercial_tor = MotorSubcategories.objects.get(subcategory_code='tor_for_commercial')

    tonnage_rates = [
        {'min': 0, 'max': 5, 'adjustment': Decimal('0')},
        {'min': 6, 'max': 10, 'adjustment': Decimal('2000')},
        {'min': 11, 'max': 15, 'adjustment': Decimal('4000')},
        {'min': 16, 'max': 31, 'adjustment': Decimal('7000')},
    ]

    for rate in tonnage_rates:
        AdditionalFieldPricing.objects.get_or_create(
            underwriter=jubilee,
            subcategory=commercial_tor,
            field_name='tonnage',
            field_range_min=rate['min'],
            field_range_max=rate['max'],
            defaults={
                'rate_adjustment': rate['adjustment'],
                'adjustment_type': 'fixed'
            }
        )

    # PSV passenger capacity pricing
    psv_subcategories = MotorSubcategories.objects.filter(
        subcategory_code__startswith='psv_'
    )

    passenger_rates = [
        {'min': 1, 'max': 7, 'adjustment': Decimal('0')},
        {'min': 8, 'max': 14, 'adjustment': Decimal('1500')},
        {'min': 15, 'max': 25, 'adjustment': Decimal('3000')},
        {'min': 26, 'max': 50, 'adjustment': Decimal('5000')},
    ]

    for subcategory in psv_subcategories:
        if 'passenger_capacity' in subcategory.additional_fields:
            for rate in passenger_rates:
                AdditionalFieldPricing.objects.get_or_create(
                    underwriter=jubilee,
                    subcategory=subcategory,
                    field_name='passenger_capacity',
                    field_range_min=rate['min'],
                    field_range_max=rate['max'],
                    defaults={
                        'rate_adjustment': rate['adjustment'],
                        'adjustment_type': 'fixed'
                    }
                )
```

## Conclusion

This implementation strategy provides a scalable, maintainable solution for the comprehensive Motor Insurance system. The unified pricing endpoint approach ensures consistency while supporting the complex category structure efficiently.

**Next Steps:**

1. Review and approve this implementation plan
2. Set up development environment
3. Begin Phase 1 implementation
4. Regular progress reviews and adjustments
