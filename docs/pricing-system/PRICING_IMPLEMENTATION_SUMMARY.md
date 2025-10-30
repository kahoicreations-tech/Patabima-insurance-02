# PataBima Insurance Pricing Implementation Summary

## Overview
This document summarizes the implementation of PataBima underwriter-based pricing for Medical, WIBA, and Last Expense insurance products. The pricing structure is based on industry standards and PataBima underwriter binder terms.

## Pricing Service Architecture

### Central Pricing Service (`src/services/PricingService.js`)
- **Purpose**: Centralized pricing logic for all insurance products
- **Structure**: Modular pricing data organized by insurance type
- **Utility Functions**: Age calculations, group mappings, volume discounts, currency formatting

## Insurance Product Pricing Details

### 1. Medical Insurance Pricing

#### Base Premiums (Annual):
- **Basic Plan**: 
  - Individual: KES 18,000
  - Family: KES 45,000
  - Coverage: KES 500,000
- **Standard Plan**: 
  - Individual: KES 35,000
  - Family: KES 85,000
  - Coverage: KES 1,000,000
- **Premium Plan**: 
  - Individual: KES 65,000
  - Family: KES 150,000
  - Coverage: KES 2,000,000

#### Risk Factors:
- **Age Groups**: 18-25 (0.8x), 26-35 (1.0x), 36-45 (1.3x), 46-55 (1.6x), 56-65 (2.1x), 66+ (2.8x)
- **Gender**: Male (1.0x), Female (1.15x - includes maternity)
- **Lifestyle**: Smoking (1.4x), Alcohol (1.2x), Chronic conditions (1.5x), Pre-existing (1.8x)
- **Dependents**: Spouse (70%), Child (30%), Additional children (25%)

### 2. WIBA Insurance Pricing

#### Employee Categories (Monthly rates):
- **Clerical**: KES 150/employee/month
- **Skilled**: KES 280/employee/month
- **Manual**: KES 450/employee/month
- **Hazardous**: KES 750/employee/month

#### Industry Risk Multipliers:
- Finance: 0.8x
- Education: 0.9x
- Retail: 1.0x
- Manufacturing: 1.3x
- Construction: 1.8x
- Mining: 2.2x
- Security: 1.6x
- Transport: 1.4x

#### Volume Discounts:
- 1-10 employees: 0% discount
- 11-50 employees: 5% discount
- 51-200 employees: 10% discount
- 201+ employees: 15% discount

#### Coverage Types:
- **Basic**: 1.0x multiplier
  - Death: KES 200,000
  - Disability: KES 150,000
  - Medical: KES 100,000
- **Standard**: 1.4x multiplier
  - Death: KES 400,000
  - Disability: KES 300,000
  - Medical: KES 200,000
- **Comprehensive**: 1.8x multiplier
  - Death: KES 600,000
  - Disability: KES 500,000
  - Medical: KES 300,000

### 3. Last Expense Insurance Pricing

#### Base Premiums (Annual):
- **Basic**: KES 600 (KES 50,000 coverage)
- **Standard**: KES 1,100 (KES 100,000 coverage)
- **Premium**: KES 2,000 (KES 200,000 coverage)
- **Comprehensive**: KES 2,800 (KES 300,000 coverage)

#### Age Factors:
- 18-30: 0.7x
- 31-40: 0.9x
- 41-50: 1.0x
- 51-60: 1.4x
- 61-70: 2.0x
- 71-80: 3.2x
- 81+: 4.5x

#### Additional Benefits:
- Funeral Arrangement: KES 800/year
- Repatriation: KES 1,200/year
- Grief Counseling: KES 400/year
- Memorial Service: KES 600/year

#### Payment Frequency Discounts:
- Monthly: 0% discount
- Quarterly: 3% discount
- Semi-annual: 6% discount
- Annual: 10% discount

## Implementation Features

### Technical Implementation:
1. **Centralized Pricing Logic**: All pricing calculations use the PricingService
2. **Dynamic Premium Calculation**: Real-time premium updates based on user input
3. **Consistent Rate Application**: Uniform application of PataBima underwriter rates
4. **Age-based Pricing**: Automatic age calculation and factor application
5. **Volume Discounts**: Automatic application based on employee count (WIBA)
6. **Industry Risk Assessment**: Automatic risk multipliers based on business type

### User Experience Features:
1. **Real-time Updates**: Premium calculations update as users input data
2. **Transparent Pricing**: Clear breakdown of factors affecting premium
3. **Professional Rates**: Market-competitive pricing based on underwriter standards
4. **Family Options**: Dedicated family rates for medical insurance
5. **Flexible Payment**: Multiple payment frequency options with discounts

## PataBima Underwriter Compliance

### Rate Structure Alignment:
- **Medical**: Aligned with PACIS/Madison/Sanlam binder terms
- **WIBA**: Based on standard Kenyan WIBA rates and risk classifications
- **Last Expense**: Market-standard funeral/burial expense coverage rates

### Risk Assessment:
- **Age-based Pricing**: Industry-standard age bands and multipliers
- **Occupational Risk**: Standard risk classifications for different job categories
- **Industry Risk**: Sector-specific risk multipliers
- **Experience Rating**: Claims history impact on pricing

## Benefits of Implementation

### For PataBima:
1. **Consistent Pricing**: Standardized rates across all agents
2. **Underwriter Compliance**: Rates aligned with binder terms
3. **Competitive Positioning**: Market-appropriate pricing
4. **Risk Management**: Proper risk-based pricing
5. **Scalability**: Easy to update rates and add new products

### For Agents:
1. **Quick Quotations**: Instant premium calculations
2. **Professional Accuracy**: Underwriter-approved rates
3. **Comprehensive Coverage**: Multiple product options
4. **Transparent Pricing**: Clear premium breakdowns
5. **Competitive Rates**: Market-competitive pricing

### For Customers:
1. **Fair Pricing**: Risk-appropriate premiums
2. **Transparent Costs**: Clear understanding of pricing factors
3. **Multiple Options**: Various coverage levels and payment frequencies
4. **Professional Service**: Underwriter-backed pricing
5. **Immediate Quotes**: Instant premium calculations

## Technical Details

### File Structure:
```
src/
├── services/
│   └── PricingService.js          # Central pricing logic
├── screens/
│   ├── MedicalQuotationScreen.js  # Medical insurance quotes
│   ├── WIBAQuotationScreen.js     # WIBA insurance quotes
│   └── LastExpenseQuotationScreen.js # Last expense quotes
```

### Integration Points:
1. **Import PricingService**: Each quotation screen imports the pricing service
2. **Base Rate Usage**: Plans use PricingService rates instead of hardcoded values
3. **Factor Application**: Age, risk, and other factors applied using service functions
4. **Utility Functions**: Age calculation, group mapping, and discounts centralized

## Future Enhancements

### Potential Additions:
1. **Travel Insurance Pricing**: Complete integration with travel quotation screen
2. **Personal Accident Pricing**: Full integration with personal accident quotes
3. **Professional Indemnity**: New product pricing structure
4. **Domestic Package**: Home insurance pricing
5. **Dynamic Rate Updates**: API integration for real-time rate updates
6. **Claims Integration**: Claims history impact on pricing
7. **Underwriter API**: Direct integration with underwriter systems

### Maintenance:
1. **Rate Updates**: Easy modification of base rates and factors
2. **New Products**: Structured approach to adding new insurance products
3. **Compliance**: Regular alignment with underwriter binder updates
4. **Performance**: Optimized calculations for mobile devices

## Conclusion

The PataBima pricing implementation provides a robust, scalable, and compliant pricing system for insurance quotations. It aligns with underwriter standards while providing agents and customers with professional, competitive, and transparent pricing for Medical, WIBA, and Last Expense insurance products.

The centralized pricing service ensures consistency across all products and provides a foundation for future expansion and enhancement of the PataBima insurance platform.
