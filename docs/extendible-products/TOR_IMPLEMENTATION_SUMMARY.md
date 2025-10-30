# TOR Insurance Document Support Implementation Summary

## Overview
The Third Party Only Risk (TOR) insurance functionality is fully implemented with comprehensive document support in the PataBima application. This document provides an overview of the existing implementation to help understand the structure and functionality.

## Key Components

### 1. Data Layer
- **File**: `src/data/torMotorData.js`
- **Purpose**: Defines all TOR-specific data structures and calculation logic
- **Key Exports**:
  - `TOR_UNDERWRITERS`: Array of underwriters offering TOR products with detailed rates
  - `TOR_REQUIRED_DOCUMENTS`: Array defining all document requirements for TOR insurance
  - `TOR_DOCUMENT_STATUS`: Object defining document upload/processing statuses
  - `TOR_VALIDATION_MESSAGES`: Object with validation error messages
  - `calculateTORPremium()`: Function for calculating TOR premiums based on vehicle details

### 2. Document Handling
- **File**: `src/components/TORDocumentUpload.js`
- **Purpose**: Specialized component for TOR document upload and validation
- **Features**:
  - Document type selection modal
  - Camera capture and gallery selection
  - Document validation against required fields
  - OCR processing for extracting data from documents
  - Upload progress tracking
  - Preview and delete functionality

### 3. TOR Insurance Flow
- **File**: `src/screens/quotations/motor/TORQuotationFlowScreen.js`
- **Purpose**: Multi-step quotation flow for TOR insurance
- **Steps**:
  1. Personal Details
  2. Vehicle Details
  3. Underwriter Selection
  4. Document Upload (uses TORDocumentUpload component)
  5. Premium Review and Payment

### 4. Navigation Integration
- **File**: `src/navigation/AppNavigator.js`
- **Integration**: TOR screens are already integrated in the navigation system
- **Route**: `<Stack.Screen name="TORQuotationFlow" component={TORQuotationFlowScreen} />`
- **Access Path**: Users can access the TOR flow from the Motor Category/Product selection screens

## Document Requirements
The following documents are defined for TOR insurance:

1. **National ID Copy** (Required)
   - Extracts: Full name, ID number, date of birth
   - Validation: ID number format, matches owner details

2. **Driving License** (Required)
   - Extracts: Full name, license number, expiry date
   - Validation: License number format, expiry date validation, name matching

3. **Vehicle Logbook** (Required)
   - Extracts: Registration number, make/model, year, engine capacity, chassis number
   - Validation: Registration format, year format, matches vehicle details

4. **KRA PIN Certificate** (Optional)
   - Extracts: Full name, PIN number
   - Validation: PIN format, name matching

5. **Previous Insurance Certificate** (Optional)
   - No extraction or specific validation

6. **Vehicle Valuation Report** (Optional)
   - Extracts: Vehicle value, valuation date
   - Validation: For vehicles above KES 3M

## Validation Process
The document validation process is comprehensive:
- Format validation (jpg, png, pdf)
- Size validation (max file size limits)
- Data extraction via OCR
- Data matching against form inputs
- Required document verification

## Calculation Logic
The premium calculation is sophisticated, considering:
- Vehicle value
- Vehicle age (with different multipliers)
- Engine capacity (with different categories)
- Usage type (private, business, ride-hailing)
- Driver age
- Selected underwriter's base rates
- Statutory levies and minimum premiums

## Status
The TOR insurance document support is fully implemented and integrated with the navigation system. The functionality offers a complete end-to-end flow from quotation to document submission.
