---
mode: agent
title: "Motor Insurance Database Setup"
phase: "Backend Phase 1"
priority: "high"
dependencies: []
---

# Task: Set up Motor Insurance Database Schema

## Objective
Create a comprehensive PostgreSQL database schema that supports all 60+ motor insurance products with dynamic pricing, mandatory levies, and multi-underwriter support.

## Requirements

### 1. Core Tables to Create
- `motor_categories` - Main insurance categories (Private, Commercial, PSV, etc.)
- `motor_subcategories` - Specific products within each category  
- `motor_pricing` - Base pricing with bracket support for comprehensive products
- `commercial_tonnage_pricing` - Commercial vehicle tonnage-based pricing
- `psv_pll_pricing` - PSV Personal Liability Limit pricing
- `underwriters` - Insurance company information and capabilities
- `vehicle_adjustment_factors` - Age, usage, and other adjustment factors
- `additional_field_pricing` - Pricing for tonnage, passengers, etc.

### 2. Mandatory Features
- **Mandatory Levies Support**: ITL (0.25%), PCF (0.25%), Stamp Duty (KSh 40)
- **Multiple Pricing Types**: Fixed, bracket-based, tonnage-based
- **Commercial Tonnage Scale**: From "Upto 3 Tons" to "Over 20 Tons"
- **PSV PLL Options**: KSh 500 and KSh 250 per person rates
- **Historical Pricing**: Support for effective dates and pricing changes
- **Multi-underwriter**: Each product can have multiple underwriter pricing

### 3. Database Schema Requirements
Use the exact schema from MOTOR_INSURANCE_IMPLEMENTATION_GUIDE.md section 3.1, including:
- All table structures with proper relationships
- JSONB fields for flexible pricing factors
- Indexes for performance optimization
- Constraints for data integrity

### 4. Sample Data Requirements
Insert comprehensive sample data for:
- All 6 main categories with proper subcategories
- At least 2-3 underwriters with complete pricing matrices
- Commercial tonnage pricing for all weight brackets
- PSV PLL pricing options
- Vehicle adjustment factors for common scenarios

### 5. Database Management Commands
Create Django management commands:
- `seed_motor_categories.py` - Populate categories and subcategories
- `seed_comprehensive_pricing.py` - Insert all pricing data
- `seed_underwriters.py` - Set up underwriter information
- `validate_pricing_data.py` - Verify data consistency

## Success Criteria
- [ ] All tables created with proper relationships
- [ ] Sample data covers all 60+ motor insurance products
- [ ] Mandatory levies properly configured for all products
- [ ] Commercial tonnage scale fully implemented
- [ ] PSV PLL pricing options available
- [ ] Multiple underwriters with complete pricing
- [ ] Database queries perform efficiently with indexes
- [ ] Data validation commands run successfully

## Technical Constraints
- Use PostgreSQL as the database
- Follow Django ORM conventions
- Implement proper foreign key relationships
- Use JSONB for flexible fields
- Add appropriate database indexes
- Include proper data validation

## Files to Modify/Create
- `apps/insurance/models.py` - Database models
- `apps/insurance/management/commands/` - Seeding commands
- Database migration files
- `apps/insurance/admin.py` - Admin interface for data management

## Testing Requirements
- Create unit tests for all models
- Test all relationships and constraints
- Validate pricing calculations with sample data
- Test performance with realistic data volumes
- Verify mandatory levy calculations

## Next Steps After Completion
This task enables:
- Backend API development for pricing calculations
- Frontend category selection implementation  
- Real-time premium calculation features
- Multi-underwriter comparison functionality