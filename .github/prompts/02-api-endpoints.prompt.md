---
mode: agent
title: "Motor Insurance API Endpoints"
phase: "Backend Phase 2"
priority: "high"
dependencies: ["01-database-setup"]
---

# Task: Implement Motor Insurance API Endpoints

## Objective
Create comprehensive REST API endpoints that handle all motor insurance categories with unified pricing calculations, mandatory levies, and multi-underwriter support.

## Requirements

### 1. Core API Endpoints to Implement

#### Category & Product Endpoints
- `GET /api/v1/public_app/insurance/motor_categories` - Get all categories with subcategories
- `GET /api/v1/public_app/insurance/motor_pricing` - Get pricing for specific subcategory
- `GET /api/v1/public_app/insurance/underwriters` - Get available underwriters

#### Pricing Calculation Endpoints  
- `POST /api/v1/public_app/insurance/calculate_motor_premium` - Universal premium calculation
- `POST /api/v1/public_app/insurance/compare_motor_pricing` - Multi-underwriter comparison
- `GET /api/v1/public_app/insurance/pricing_factors` - Get additional pricing factors

#### Quote Management Endpoints
- `POST /api/v1/public_app/insurance/submit_quotation` - Submit complete quotation
- `GET /api/v1/public_app/insurance/quotations` - List agent quotations
- `GET /api/v1/public_app/insurance/quotations/{id}` - Get specific quotation

### 2. Pricing Engine Implementation

#### Core Pricing Service
Create `MotorPricingEngine` class with methods:
- `calculate_premium()` - Main calculation dispatcher
- `_calculate_tor_premium()` - Time on Risk products (fixed pricing)
- `_calculate_third_party_premium()` - Third-party with factors
- `_calculate_comprehensive_premium()` - Bracket-based pricing
- `_calculate_commercial_tonnage_premium()` - Tonnage-based pricing
- `_apply_mandatory_levies()` - ITL, PCF, Stamp Duty calculations

#### Mandatory Levies (Applied to ALL Products)
- Insurance Training Levy (ITL): 0.25% of premium
- Policyholders Compensation Fund (PCF): 0.25% of premium  
- Stamp Duty: KSh 40 fixed amount per policy
#### Commercial Tonnage Pricing
Implement tonnage scale pricing:
- Upto 3 Tons: KSh 4,500
- 3.5 to 8 Tons: KSh 5,500
- 8.5 to 12 Tons: KSh 6,500
- 12.5 to 15 Tons: KSh 7,500
- 15.5 to 20 Tons: KSh 10,000
- Over 20 Tons: KSh 15,000
- Prime mover: KSh 10,000

#### PSV PLL Pricing
- Standard PSV: KSh 500 per person
- Commercial Institutional: KSh 250 per person

### 3. API Response Specifications

#### Category Response Format
```json
{
  "categories": [
    {
      "id": 1,
      "category_code": "private",
      "category_name": "Private Vehicles",
      "subcategories": [
        {
          "id": 1,
          "subcategory_code": "private_comprehensive",
          "subcategory_name": "Private Comprehensive",
          "product_type": "comprehensive",
          "additional_fields": ["sum_insured", "vehicle_age"],
          "pricing_requirements": {
            "sum_insured": {"required": true, "min": 100000, "max": 50000000}
          }
        }
      ]
    }
  ]
}
```

#### Premium Calculation Response
```json
{
  "calculation_type": "comprehensive",
  "base_premium": 75000.00,
  "mandatory_levies": {
    "insurance_training_levy": 187.50,
    "pcf_levy": 187.50,
    "stamp_duty": 40.00
  },
  "additional_coverages": {
    "excess_protector": 2250.00,
    "pvt": 1500.00
  },
  "total_premium": 79165.00,
  "underwriter": {
    "id": 1,
    "company_name": "ABC Insurance"
  }
}
```

### 4. Error Handling & Validation

#### Input Validation
- Validate all required fields for each product type
- Check sum insured ranges for comprehensive products
- Validate tonnage ranges for commercial vehicles
- Verify passenger counts for PSV products

#### Error Response Format
```json
{
  "error": true,
  "message": "Invalid pricing inputs",
  "details": {
    "sum_insured": ["Sum insured must be between 100,000 and 50,000,000"],
    "vehicle_age": ["Vehicle age is required for comprehensive products"]
  }
}
```

### 5. Performance Requirements
- API response time < 500ms for pricing calculations
- Support for concurrent pricing comparisons
- Implement caching for frequently accessed pricing data
- Database query optimization with proper indexes

## Success Criteria
- [ ] All API endpoints implemented and tested
- [ ] Universal pricing calculation handles all 60+ products
- [ ] Mandatory levies correctly applied to all calculations
- [ ] Commercial tonnage pricing working for all brackets
- [ ] PSV PLL pricing implemented correctly
- [ ] Multi-underwriter comparison functional
- [ ] Error handling covers all edge cases
- [ ] API performance meets requirements
- [ ] Comprehensive API documentation created

## Technical Implementation Details

### Service Layer Architecture
```python
class MotorPricingEngine:
    def calculate_premium(self, pricing_request):
        # Main dispatcher based on product type
        
    def _apply_mandatory_levies(self, base_premium):
        # ITL: 0.25%, PCF: 0.25%, Stamp Duty: KSh 40
        
    def _get_commercial_tonnage_rate(self, tonnage):
        # Return rate based on tonnage brackets
```

### Database Optimization
- Index on frequently queried fields
- Optimized joins for pricing calculations
- Query result caching strategy

## Files to Modify/Create
- `apps/insurance/views.py` - API endpoint views
- `apps/insurance/serializers.py` - Request/response serializers
- `apps/insurance/services/motor_pricing_engine.py` - Core pricing logic
- `apps/insurance/urls.py` - URL routing
- `apps/insurance/utils.py` - Helper functions
- Unit test files for all endpoints

## Testing Requirements
- Unit tests for all pricing calculations
- Integration tests for API endpoints
- Test coverage for all product types
- Performance testing for concurrent requests
- Error handling validation tests

## Next Steps After Completion
This enables:
- Frontend integration with backend APIs
- Real-time premium calculations
- Multi-underwriter pricing comparisons
- Quote submission and management
- Progressive form flow implementation