# Comprehensive Motor Insurance Pricing System

## Overview

Based on the provided pricing table, comprehensive motor insurance pricing requires a sophisticated calculation engine that handles multiple variables and brackets.

## Pricing Structure Analysis

### 1. Sum Insured Brackets

Different rate ranges apply based on vehicle value:

- 500,000 - 1,500,000: Higher base rates (4.00-4.50%)
- 1,500,001 - 2,000,000: Mid rates (3.75-4.00%)
- 2,000,001 - 2,500,000: Lower rates (3.50-3.75%)
- Over 2,500,000: Lowest rates (3.00-3.50%)

### 2. Vehicle Categories

Each category has specific rate structures:

- **Motor Private**: 3.75% - 4.50% base rates
- **Motor Commercial Own Goods**: 3.75% - 4.00% base rates
- **Motor Commercial General Cartage**: 3.75% - 4.00% base rates
- **Motor Commercial Institutional**: 3.50% - 4.00% base rates
- **Agriculture & Forestry**: 3.00% - 4.00% base rates
- **Special Vehicles**: 3.00% - 3.75% base rates
- **Driving Schools**: 3.00% - 3.75% base rates
- **Motor Asset Finance**: 3.00% - 4.00% base rates
- **Motor PSV**: 4.00% - 5.50% base rates
- **Motorcycles**: 3.00% - 4.00% base rates
- **TUK TUK**: 4.00% - 5.00% base rates

### 3. Additional Coverage Components

- **Excess Protector**: 0.25% - 0.5% minimum amounts
- **Political Violence & Terrorism (PVT)**: 0.25% - 0.35% minimum amounts
- **Loss of Use**: Fixed amounts or "No Cover"
- **Windscreen**: 10% of limit above specified amounts
- **Radio**: 10% of limit above specified amounts

## Database Schema Enhancement

### Updated Motor Pricing Table

```sql
CREATE TABLE motor_pricing_brackets (
    id SERIAL PRIMARY KEY,
    underwriter_id INTEGER REFERENCES underwriters(id),
    category_id INTEGER REFERENCES motor_categories(id),
    subcategory_id INTEGER REFERENCES motor_subcategories(id),

    -- Sum Insured Brackets
    sum_insured_min DECIMAL(15,2),
    sum_insured_max DECIMAL(15,2),
    base_rate_min DECIMAL(5,4), -- e.g., 0.0375 for 3.75%
    base_rate_max DECIMAL(5,4),
    minimum_premium DECIMAL(10,2),

    -- Additional Coverages
    excess_protector_rate DECIMAL(5,4),
    excess_protector_minimum DECIMAL(10,2),
    pvt_rate DECIMAL(5,4),
    pvt_minimum DECIMAL(10,2),
    loss_of_use_amount DECIMAL(10,2),
    loss_of_use_coverage BOOLEAN DEFAULT false,
    windscreen_limit DECIMAL(10,2),
    windscreen_percentage DECIMAL(5,4),
    radio_limit DECIMAL(10,2),
    radio_percentage DECIMAL(5,4),

    -- Pricing Factors
    pricing_factors JSONB, -- Vehicle age, usage, etc.

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicle Age Factor Table
CREATE TABLE vehicle_age_factors (
    id SERIAL PRIMARY KEY,
    underwriter_id INTEGER REFERENCES underwriters(id),
    category_id INTEGER REFERENCES motor_categories(id),
    age_range_min INTEGER, -- in years
    age_range_max INTEGER,
    rate_factor DECIMAL(5,4), -- multiplier (e.g., 1.1 for 10% increase)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Usage Type Factors
CREATE TABLE usage_type_factors (
    id SERIAL PRIMARY KEY,
    underwriter_id INTEGER REFERENCES underwriters(id),
    category_id INTEGER REFERENCES motor_categories(id),
    usage_type VARCHAR(100), -- "Private", "Commercial", "Hire/Reward"
    rate_factor DECIMAL(5,4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Pricing Calculation Engine

### Backend API Implementation

```python
# apps/insurance/services/pricing_calculator.py
from decimal import Decimal
from typing import Dict, Any, Optional
from django.db.models import Q
from .models import MotorPricingBrackets, VehicleAgeFactors, UsageTypeFactors

class MotorInsurancePricingCalculator:

    def calculate_comprehensive_premium(
        self,
        sum_insured: Decimal,
        vehicle_data: Dict[str, Any],
        underwriter_id: int,
        category_id: int,
        subcategory_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Calculate comprehensive motor insurance premium

        Args:
            sum_insured: Vehicle value
            vehicle_data: Dict containing age, usage_type, etc.
            underwriter_id: Selected underwriter
            category_id: Motor category
            subcategory_id: Optional subcategory

        Returns:
            Dict with premium breakdown
        """

        # 1. Find applicable pricing bracket
        pricing_bracket = self._get_pricing_bracket(
            sum_insured, underwriter_id, category_id, subcategory_id
        )

        if not pricing_bracket:
            raise ValueError("No pricing bracket found for the given parameters")

        # 2. Calculate base premium
        base_rate = self._determine_base_rate(sum_insured, pricing_bracket)
        base_premium = sum_insured * base_rate

        # 3. Apply minimum premium rule
        base_premium = max(base_premium, pricing_bracket.minimum_premium)

        # 4. Apply vehicle factors
        adjusted_premium = self._apply_vehicle_factors(
            base_premium, vehicle_data, underwriter_id, category_id
        )

        # 5. Calculate additional coverages
        additional_coverages = self._calculate_additional_coverages(
            sum_insured, pricing_bracket, vehicle_data
        )

        # 6. Calculate total premium
        total_premium = adjusted_premium + sum(additional_coverages.values())

        return {
            'base_premium': float(base_premium),
            'adjusted_premium': float(adjusted_premium),
            'additional_coverages': {k: float(v) for k, v in additional_coverages.items()},
            'total_premium': float(total_premium),
            'base_rate_used': float(base_rate),
            'sum_insured': float(sum_insured),
            'pricing_breakdown': self._create_breakdown(
                base_premium, adjusted_premium, additional_coverages, total_premium
            )
        }

    def _get_pricing_bracket(self, sum_insured, underwriter_id, category_id, subcategory_id):
        """Find the applicable pricing bracket"""
        query = Q(
            underwriter_id=underwriter_id,
            category_id=category_id,
            sum_insured_min__lte=sum_insured,
            sum_insured_max__gte=sum_insured
        )

        if subcategory_id:
            query &= Q(subcategory_id=subcategory_id)

        return MotorPricingBrackets.objects.filter(query).first()

    def _determine_base_rate(self, sum_insured, pricing_bracket):
        """
        Determine the base rate within the bracket range
        Could be minimum, maximum, or interpolated based on business rules
        """
        # For now, use minimum rate - can be enhanced with more sophisticated logic
        return pricing_bracket.base_rate_min

    def _apply_vehicle_factors(self, base_premium, vehicle_data, underwriter_id, category_id):
        """Apply vehicle age and usage factors"""
        adjusted_premium = base_premium

        # Apply vehicle age factor
        if 'vehicle_age' in vehicle_data:
            age_factor = self._get_age_factor(
                vehicle_data['vehicle_age'], underwriter_id, category_id
            )
            adjusted_premium *= age_factor

        # Apply usage type factor
        if 'usage_type' in vehicle_data:
            usage_factor = self._get_usage_factor(
                vehicle_data['usage_type'], underwriter_id, category_id
            )
            adjusted_premium *= usage_factor

        return adjusted_premium

    def _get_age_factor(self, vehicle_age, underwriter_id, category_id):
        """Get vehicle age adjustment factor"""
        age_factor_obj = VehicleAgeFactors.objects.filter(
            underwriter_id=underwriter_id,
            category_id=category_id,
            age_range_min__lte=vehicle_age,
            age_range_max__gte=vehicle_age
        ).first()

        return age_factor_obj.rate_factor if age_factor_obj else Decimal('1.0')

    def _get_usage_factor(self, usage_type, underwriter_id, category_id):
        """Get usage type adjustment factor"""
        usage_factor_obj = UsageTypeFactors.objects.filter(
            underwriter_id=underwriter_id,
            category_id=category_id,
            usage_type=usage_type
        ).first()

        return usage_factor_obj.rate_factor if usage_factor_obj else Decimal('1.0')

    def _calculate_additional_coverages(self, sum_insured, pricing_bracket, vehicle_data):
        """Calculate additional coverage premiums"""
        coverages = {}

        # Excess Protector
        if pricing_bracket.excess_protector_rate:
            excess_premium = max(
                sum_insured * pricing_bracket.excess_protector_rate,
                pricing_bracket.excess_protector_minimum or 0
            )
            coverages['excess_protector'] = excess_premium

        # Political Violence & Terrorism
        if pricing_bracket.pvt_rate:
            pvt_premium = max(
                sum_insured * pricing_bracket.pvt_rate,
                pricing_bracket.pvt_minimum or 0
            )
            coverages['pvt'] = pvt_premium

        # Loss of Use
        if pricing_bracket.loss_of_use_coverage and pricing_bracket.loss_of_use_amount:
            coverages['loss_of_use'] = pricing_bracket.loss_of_use_amount

        # Windscreen
        if pricing_bracket.windscreen_percentage and pricing_bracket.windscreen_limit:
            windscreen_value = vehicle_data.get('windscreen_value', 0)
            if windscreen_value > pricing_bracket.windscreen_limit:
                excess_value = windscreen_value - pricing_bracket.windscreen_limit
                coverages['windscreen'] = excess_value * pricing_bracket.windscreen_percentage

        # Radio
        if pricing_bracket.radio_percentage and pricing_bracket.radio_limit:
            radio_value = vehicle_data.get('radio_value', 0)
            if radio_value > pricing_bracket.radio_limit:
                excess_value = radio_value - pricing_bracket.radio_limit
                coverages['radio'] = excess_value * pricing_bracket.radio_percentage

        return coverages

    def _create_breakdown(self, base_premium, adjusted_premium, additional_coverages, total_premium):
        """Create detailed pricing breakdown for display"""
        return {
            'base_premium': float(base_premium),
            'vehicle_adjustments': float(adjusted_premium - base_premium),
            'additional_coverages_total': float(sum(additional_coverages.values())),
            'total_premium': float(total_premium),
            'coverage_details': additional_coverages
        }
```

### API Endpoint

```python
# apps/insurance/views.py
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .services.pricing_calculator import MotorInsurancePricingCalculator

@api_view(['POST'])
def calculate_motor_premium(request):
    """
    Calculate motor insurance premium based on comprehensive factors
    """
    try:
        data = request.data

        # Extract required parameters
        sum_insured = Decimal(data.get('sum_insured'))
        underwriter_id = data.get('underwriter_id')
        category_id = data.get('category_id')
        subcategory_id = data.get('subcategory_id')

        # Vehicle data
        vehicle_data = {
            'vehicle_age': data.get('vehicle_age'),
            'usage_type': data.get('usage_type'),
            'windscreen_value': data.get('windscreen_value', 0),
            'radio_value': data.get('radio_value', 0),
        }

        # Calculate premium
        calculator = MotorInsurancePricingCalculator()
        result = calculator.calculate_comprehensive_premium(
            sum_insured=sum_insured,
            vehicle_data=vehicle_data,
            underwriter_id=underwriter_id,
            category_id=category_id,
            subcategory_id=subcategory_id
        )

        return Response({
            'status': 'success',
            'data': result
        })

    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=400)
```

## Frontend Integration

### Enhanced Form Component

```javascript
// src/components/MotorInsuranceForm.js
import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Alert } from "react-native";
import DjangoAPIService from "../services/DjangoAPIService";

const ComprehensiveMotorForm = ({ category, subcategory, underwriter }) => {
  const [formData, setFormData] = useState({
    sum_insured: "",
    vehicle_age: "",
    usage_type: "Private",
    windscreen_value: "",
    radio_value: "",
    // ... other vehicle details
  });

  const [premiumCalculation, setPremiumCalculation] = useState(null);
  const [loading, setLoading] = useState(false);

  const calculatePremium = async () => {
    if (!formData.sum_insured || !underwriter?.id) {
      Alert.alert("Error", "Please fill in required fields");
      return;
    }

    setLoading(true);
    try {
      const response = await DjangoAPIService.makeRequest(
        "POST",
        "/api/v1/public_app/insurance/calculate_motor_premium",
        {
          sum_insured: parseFloat(formData.sum_insured),
          underwriter_id: underwriter.id,
          category_id: category.id,
          subcategory_id: subcategory?.id,
          vehicle_age: parseInt(formData.vehicle_age) || 0,
          usage_type: formData.usage_type,
          windscreen_value: parseFloat(formData.windscreen_value) || 0,
          radio_value: parseFloat(formData.radio_value) || 0,
        }
      );

      if (response.status === "success") {
        setPremiumCalculation(response.data);
      } else {
        Alert.alert("Error", response.message || "Premium calculation failed");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to calculate premium");
      console.error("Premium calculation error:", error);
    }
    setLoading(false);
  };

  // Auto-calculate when key fields change
  useEffect(() => {
    if (formData.sum_insured && formData.vehicle_age && underwriter?.id) {
      const timer = setTimeout(calculatePremium, 1000); // Debounce
      return () => clearTimeout(timer);
    }
  }, [formData.sum_insured, formData.vehicle_age, underwriter?.id]);

  return (
    <View style={styles.container}>
      {/* Sum Insured Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Sum Insured (Vehicle Value) *</Text>
        <TextInput
          style={styles.input}
          value={formData.sum_insured}
          onChangeText={(value) =>
            setFormData((prev) => ({ ...prev, sum_insured: value }))
          }
          placeholder="e.g., 1500000"
          keyboardType="numeric"
        />
      </View>

      {/* Vehicle Age Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Vehicle Age (Years) *</Text>
        <TextInput
          style={styles.input}
          value={formData.vehicle_age}
          onChangeText={(value) =>
            setFormData((prev) => ({ ...prev, vehicle_age: value }))
          }
          placeholder="e.g., 5"
          keyboardType="numeric"
        />
      </View>

      {/* Usage Type Picker */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Usage Type *</Text>
        <Picker
          selectedValue={formData.usage_type}
          onValueChange={(value) =>
            setFormData((prev) => ({ ...prev, usage_type: value }))
          }
        >
          <Picker.Item label="Private Use" value="Private" />
          <Picker.Item label="Commercial Use" value="Commercial" />
          <Picker.Item label="Hire/Reward" value="Hire/Reward" />
        </Picker>
      </View>

      {/* Additional Value Inputs */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Windscreen Value (Optional)</Text>
        <TextInput
          style={styles.input}
          value={formData.windscreen_value}
          onChangeText={(value) =>
            setFormData((prev) => ({ ...prev, windscreen_value: value }))
          }
          placeholder="e.g., 50000"
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Radio/Electronics Value (Optional)</Text>
        <TextInput
          style={styles.input}
          value={formData.radio_value}
          onChangeText={(value) =>
            setFormData((prev) => ({ ...prev, radio_value: value }))
          }
          placeholder="e.g., 30000"
          keyboardType="numeric"
        />
      </View>

      {/* Premium Display */}
      {premiumCalculation && (
        <View style={styles.premiumContainer}>
          <Text style={styles.premiumTitle}>Premium Calculation</Text>

          <View style={styles.premiumRow}>
            <Text style={styles.premiumLabel}>Base Premium:</Text>
            <Text style={styles.premiumValue}>
              KSh {premiumCalculation.base_premium.toLocaleString()}
            </Text>
          </View>

          <View style={styles.premiumRow}>
            <Text style={styles.premiumLabel}>Vehicle Adjustments:</Text>
            <Text style={styles.premiumValue}>
              KSh{" "}
              {(
                premiumCalculation.adjusted_premium -
                premiumCalculation.base_premium
              ).toLocaleString()}
            </Text>
          </View>

          {Object.entries(premiumCalculation.additional_coverages).map(
            ([coverage, amount]) => (
              <View key={coverage} style={styles.premiumRow}>
                <Text style={styles.premiumLabel}>
                  {coverage.replace("_", " ").toUpperCase()}:
                </Text>
                <Text style={styles.premiumValue}>
                  KSh {amount.toLocaleString()}
                </Text>
              </View>
            )
          )}

          <View style={[styles.premiumRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Premium:</Text>
            <Text style={styles.totalValue}>
              KSh {premiumCalculation.total_premium.toLocaleString()}
            </Text>
          </View>

          <Text style={styles.rateInfo}>
            Base Rate: {(premiumCalculation.base_rate_used * 100).toFixed(2)}%
          </Text>
        </View>
      )}

      {loading && (
        <Text style={styles.loadingText}>Calculating premium...</Text>
      )}
    </View>
  );
};
```

## Data Seeding Strategy

```python
# Management command to populate pricing data
# apps/insurance/management/commands/seed_comprehensive_pricing.py

from django.core.management.base import BaseCommand
from apps.insurance.models import MotorPricingBrackets, VehicleAgeFactors

class Command(BaseCommand):
    help = 'Seed comprehensive motor insurance pricing data'

    def handle(self, *args, **options):
        # Seed Motor Private pricing brackets
        motor_private_brackets = [
            {
                'sum_insured_min': 500000,
                'sum_insured_max': 1500000,
                'base_rate_min': 0.0375,
                'base_rate_max': 0.045,
                'minimum_premium': 27500,
                'excess_protector_rate': 0.0025,
                'excess_protector_minimum': 3000,
                'pvt_rate': 0.0025,
                'pvt_minimum': 2500,
            },
            # ... more brackets
        ]

        # Seed vehicle age factors
        age_factors = [
            {'age_range_min': 0, 'age_range_max': 3, 'rate_factor': 1.0},
            {'age_range_min': 4, 'age_range_max': 7, 'rate_factor': 1.1},
            {'age_range_min': 8, 'age_range_max': 12, 'rate_factor': 1.25},
            {'age_range_min': 13, 'age_range_max': 20, 'rate_factor': 1.5},
        ]

        # Create pricing records for each underwriter and category combination
        # Implementation details...
```

This comprehensive system handles the complex pricing structure you've shown, with flexible brackets, base rates, and multiple adjustment factors. The key features include:

1. **Bracket-based pricing** matching your table structure
2. **Dynamic rate calculation** based on sum insured ranges
3. **Vehicle factor adjustments** for age, usage, etc.
4. **Additional coverage calculations** for excess protector, PVT, etc.
5. **Real-time premium updates** as users input data
6. **Detailed breakdown display** showing how the premium is calculated

<function_calls>
<invoke name="manage_todo_list">
<parameter name="operation">write
