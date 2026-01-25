# Motor Insurance Pricing Guide

Scope

- Source: Backend Phase 2 spec (MotorPricingEngine) and the API test script.
- Covers: Pricing flow, levies, category rules, inputs, validation, and example responses.

Key Endpoints

- GET /api/v1/public_app/insurance/motor_categories
- GET /api/v1/public_app/insurance/motor_pricing
- GET /api/v1/public_app/insurance/underwriters
- GET /api/v1/public_app/insurance/pricing_factors
- POST /api/v1/public_app/insurance/calculate_motor_premium
- POST /api/v1/public_app/insurance/compare_motor_pricing
- POST /api/v1/public_app/insurance/submit_quotation
- GET /api/v1/public_app/insurance/quotations
- GET /api/v1/public_app/insurance/quotations/{id}

Notes on Path Variants

- In scripts you may see /api/v1/public_app/insurance/insurance/... depending on URL routing. The logical resources are as listed above.

Pricing Engine Flow

1. Resolve Product

- Input contains subcategory_code (e.g., PRIVATE_COMPREHENSIVE, COMM_TONNAGE, PSV_STANDARD).
- The backend maps subcategory_code → product_type:
  - tor (Time on Risk)
  - third_party
  - comprehensive
  - commercial_tonnage
  - psv (with PLL)
  - motorcycle
  - tuktuk
  - special_class

2. Resolve Underwriter Tariffs

- Underwriter can be selected via underwriter_code or in comparisons via underwriter_codes[].
- Tariffs, brackets, and add-on rates are underwriter-specific and stored in DB.

3. Compute Base Premium per Product Type

- Time on Risk (tor): Fixed product pricing (from DB). Some products may be per-period; current engine treats them as fixed according to product setup.
- Third-party (third_party): Fixed base premium possibly adjusted by configured factors (e.g., vehicle class, engine capacity, usage). Factors come from GET /pricing_factors.
- Comprehensive (comprehensive):
  - Bracket/Rate-based on sum_insured and sometimes vehicle_age.
  - Typical formula: base_premium = max(sum_insured \* rate, min_premium) with potential loadings/discounts per underwriter and product config.
- Commercial Tonnage (commercial_tonnage):
  - Base premium is bracketed by declared tonnage:
    - Up to 3 Tons: KSh 4,500
    - 3.5 to 8 Tons: KSh 5,500
    - 8.5 to 12 Tons: KSh 6,500
    - 12.5 to 15 Tons: KSh 7,500
    - 15.5 to 20 Tons: KSh 10,000
    - Over 20 Tons: KSh 15,000
    - Prime mover: KSh 10,000
- PSV (psv) and PLL:
  - Base PSV premium per product setup.
  - Passenger Legal Liability (PLL):
    - Standard PSV: KSh 500 per person
    - Commercial Institutional: KSh 250 per person
  - Final PSV base may be: base_psv + (passenger_count \* pll_rate) depending on product configuration.
- Motorcycle:
  - Base premium by engine capacity brackets as configured (e.g., <=100cc, 101–250cc, >250cc).
- TukTuk:
  - Base premium by seating/capacity brackets per product setup.
- Special Classes:
  - Category-specific fixed or rate-based premiums (e.g., agricultural, institutional, specialized commercial), as configured.

4. Add-ons and Additional Coverages

- Request field: add_ons (e.g., excess_protector, pvt, windscreen_value, radio_value).
- Each add-on uses underwriter-defined rates or fixed amounts, typically:
  - Excess protector: percentage of sum_insured or base, per underwriter rules.
  - PVT (Political Violence & Terrorism): configured rate or fixed.
  - Windscreen and Radio: tariff applied to declared values.
- These are returned under additional_coverages in the response.

5. Apply Mandatory Levies (on base premium only)

- ITL (Insurance Training Levy): 0.25% of base_premium
- PCF (Policyholders Compensation Fund): 0.25% of base_premium
- Stamp Duty: KSh 40 fixed amount
- Important: Levies are calculated strictly on the base premium, not on add-ons.
  - Example: base=75,000 → ITL=187.50, PCF=187.50, Stamp=40.00

6. Total Premium

- total_premium = base_premium + sum(additional_coverages) + ITL + PCF + Stamp Duty

Inputs by Product

- Common:
  - subcategory_code (required)
  - underwriter_code (required unless compare endpoint)
- Comprehensive:
  - sum_insured (required; validated against min/max for product)
  - vehicle_age (if required by product)
  - add_ons (optional)
- Third-party:
  - possible factors (engine capacity, usage) per product
  - add_ons (optional)
- Commercial Tonnage:
  - tonnage (required; validated into defined brackets)
- PSV:
  - passenger_count (required; validated)
  - institution_type or psv_type (if applicable to choose 500 vs 250 per person)
- Motorcycle/TukTuk/Special:
  - capacity or class-specific fields per product config

Validation and Errors

- Sum insured range checks for comprehensive products.
- Tonnage bracket validation for commercial vehicles.
- Passenger count validation for PSV products.
- Required fields by subcategory.
- Error format:
  {
  "error": true,
  "message": "Invalid pricing inputs",
  "details": {
  "sum_insured": ["Sum insured must be between 100,000 and 50,000,000"]
  }
  }

Sample Calculation Response

- Comprehensive example:
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
  "underwriter": { "id": 1, "company_name": "ABC Insurance" }
  }
- Note the levies are on base_premium only. Add-ons are then added to arrive at total_premium.

Compare Pricing

- POST /compare_motor_pricing
- Input: subcategory_code, underwriter_codes[], and required pricing fields (e.g., sum_insured).
- Returns array of per-underwriter calculations using the same flow above.

Performance Notes

- Target < 500ms per calculation.
- Cache frequently fetched reference data (categories, underwriters, pricing factors).
- Ensure DB indexes on category/subcategory, underwriter, and pricing lookup tables.

Quick Test Script (PowerShell)

- scripts/test-motor-api-simple.ps1 covers:
  - Signup/login/OTP exchange
  - Categories, underwriters, pricing factors
  - calculate_motor_premium for:
    - PRIVATE_COMPREHENSIVE with add_ons
    - COMM_TONNAGE using 7.5 tons
    - PSV_STANDARD with passenger_count=14
  - compare_motor_pricing across multiple underwriters

Field Reference (Common)

- subcategory_code: string (e.g., PRIVATE_COMPREHENSIVE, COMM_TONNAGE, PSV_STANDARD)
- underwriter_code: string (e.g., APA, JUB)
- sum_insured: number (comprehensive)
- vehicle_age: number (years; if required)
- tonnage: number (commercial tonnage)
- passenger_count: number (PSV)
- add_ons: object
  - excess_protector: boolean
  - pvt: boolean
  - windscreen_value: number
  - radio_value: number

Implementation Reference (Engine Methods)

- calculate_premium(pricing_request): dispatches by product_type
- \_calculate_tor_premium(): fixed pricing
- \_calculate_third_party_premium(): factor-based pricing
- \_calculate_comprehensive_premium(): bracket-based on sum_insured (+constraints)
- \_calculate_commercial_tonnage_premium(): uses tonnage scale above
- \_apply_mandatory_levies(base_premium):
  - ITL = base \* 0.0025
  - PCF = base \* 0.0025
  - Stamp Duty = 40.00

Assumptions and Notes

- Detailed numeric rates (e.g., comprehensive rate %, add-on rates, min premiums) are underwriter-specific and stored in DB. The engine pulls these per product/underwriter.
- PSV PLL rate selection (500 vs 250) is driven by PSV type (standard vs commercial institutional).
- If your backend deviates from these rules, update this document to reflect the actual tariff tables and formulas.

User Simulation for Motor Insurance Product Selection
Scenario: User Selects Third-Party Insurance Products
Let me walk through what happens when a user selects these specific motor insurance products.

Product Flow Overview
When a user selects any of these products, the app follows this general flow:

Category Selection → User selects "Private" category
Subcategory Selection → User selects specific third-party product type
Vehicle Details → App requests relevant vehicle information
Pricing Calculation → Backend calculates premium with mandatory levies
Underwriter Selection/Comparison → User views multiple underwriter options
Client Details → User enters policyholder information
Payment → User proceeds to payment
Policy Generation → System generates documentation
Specific Product Simulations

1. TOR For Private (Time on Risk)
   User Journey:

User selects "Private" category from the insurance categories
User selects "TOR For Private" subcategory
System requests minimal vehicle information:
Vehicle Registration Number
Vehicle Make/Model
Vehicle Use
Behind the Scenes:

The API identifies this as a tor product type
\_calculate_tor_premium() method is called
Fixed pricing applies (no sum_insured calculations needed)
Mandatory levies are applied:
ITL: 0.25% of the fixed premium
PCF: 0.25% of the fixed premium
Stamp Duty: KSh 40
Sample Response:

2. Private Third-Party
   User Journey:

User selects "Private" category
User selects "Private third-party" subcategory
System requests:
Vehicle Registration Number
Vehicle Make/Model
Vehicle Use
Engine Capacity (might be required for some third-party products)
Behind the Scenes:

The API identifies this as a third_party product type
\_calculate_third_party_premium() method is called
Fixed base premium possibly adjusted by factors like engine capacity
Mandatory levies are applied as above
Sample Response:

3. Private Third-Party Extendible
   User Journey:

User selects "Private" category
User selects "Private third-party Extendible" subcategory
System requests:
Same fields as Private third-party
Extension period options (likely shows duration options)
Behind the Scenes:

Similar to regular third-party but with extension period factored in
Premium may be prorated based on extension period
Same mandatory levies applied to the adjusted base premium 4. Private Motorcycle Third-Party
User Journey:

User selects "Private" category
User selects "Private motorcycle third-party" subcategory
System requests:
Registration Number
Make/Model
Engine Capacity (crucial for motorcycle pricing)
Behind the Scenes:

The API identifies this as a motorcycle product with third-party coverage
Premium calculated based on engine capacity brackets
Lower brackets for smaller engines (e.g., ≤100cc)
Higher brackets for larger engines (e.g., >250cc)
Mandatory levies applied to the base premium
Sample Response:

Common Next Steps
After premium calculation for any product:

User can compare prices across multiple underwriters (using /compare_motor_pricing)
User enters client details
User submits quotation (using /submit_quotation)
User proceeds to payment integration
Policy documents are generated
Technical Process Summary
The frontend sends a request to POST /insurance/insurance/calculate_motor_premium with:

Plus any product-specific fields (e.g., engine_capacity for motorcycles)

The backend pricing engine:

Maps the subcategory to the correct product type
Calls the appropriate calculation method
Applies mandatory levies (ITL, PCF, Stamp Duty)
Returns the complete pricing breakdown
The frontend displays the calculated premium to the user with options to proceed

All these products use simpler pricing models compared to comprehensive insurance (which would require sum_insured and potentially vehicle_age inputs) or commercial tonnage products.
