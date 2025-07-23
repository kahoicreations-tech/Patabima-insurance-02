# Motor Insurance Module

## Overview

The Motor Insurance module handles all vehicle-related insurance products in the PataBima app. This includes various insurance types for different vehicle categories such as private vehicles, commercial vehicles, PSVs (Public Service Vehicles), and motorcycles.

## Structure

- `components/` - Reusable UI components specific to motor insurance
- `data.js` - Motor insurance product data (being migrated to centralized data store)
- `index.js` - Main exports for the motor module
- Product-specific modules:
  - `private/` - Private vehicle insurance products
  - `tor/` - TOR insurance products
  - More product categories to be added as implementation progresses

## Available Products

Currently implemented insurance products:

1. **Private Third-Party Insurance**
   - Basic third-party liability coverage for private vehicles
   - Path: `private/PrivateThirdPartyScreen.js`

2. **TOR For Private**
   - Enhanced third-party insurance with additional features
   - Path: `tor/TORQuotationFlowScreen.js`

## Implementation Status

| Product | Status | Implementation Level |
|---------|--------|----------------------|
| TOR For Private | Complete | 100% |
| Private Third-Party | Complete | 100% |
| Commercial Third-Party | Planned | 0% |
| PSV Third-Party | Planned | 0% |
| Motorcycle Third-Party | Planned | 0% |
| Comprehensive Covers | Planned | 0% |

## Development Guidelines

When implementing new motor insurance products:

1. Create a product-specific directory under `motor/` (e.g., `commercial/`)
2. Implement the product-specific screens in the new directory
3. Update the navigation in AppNavigator.js to include the new screens
4. Update the product selection screens to navigate to the new screens
5. Follow the same UI/UX patterns established in existing products

## Data Sources

- Primary: Centralized data store at `src/data/motorCategories.js`
- Legacy: Local `data.js` file (being phased out)
