# Test Fixtures

This directory contains sample documents for testing the Motor 2 document processing flow.

## Required Test Documents

Place the following test documents in this directory:

1. **test_logbook.pdf** - Sample vehicle logbook with:

   - Vehicle registration number (e.g., KCB 123A)
   - Owner name
   - Make and model
   - Year of manufacture
   - Engine number
   - Chassis number

2. **test_id.pdf** - Sample national ID card with:

   - Full name
   - ID number
   - Date of birth

3. **test_kra_pin.pdf** - Sample KRA PIN certificate with:
   - Full name
   - KRA PIN number

## Document Requirements

- All documents should be PDF format
- Readable text (not heavily scanned/blurry)
- Contain the key fields listed above
- No sensitive/real personal information

## Usage

The integration test script (`motor2_flow_integration_test.py`) will automatically use these fixtures when testing the document processing flow.

If fixtures are not available, those tests will be skipped with a warning.
