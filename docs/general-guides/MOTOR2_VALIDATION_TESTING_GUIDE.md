# Motor 2 Document Validation - Quick Testing Guide

## 🚀 Quick Start

### Prerequisites
- Expo dev server running
- Django backend running with AWS pipeline enabled
- Test documents ready (Logbook, ID, KRA PIN)

### Test Environment Setup
```bash
# Frontend
cd "c:\Users\USER\Desktop\PATABIMA\PATABIMA FRONT\PATA BIMA AGENCY - Copy"
npm start

# Backend (in separate terminal)
cd insurance-app
python manage.py runserver
```

---

## ✅ Test Scenarios

### Scenario 1: Happy Path - All Documents Correct
**Goal**: Verify successful validation of correct documents

**Steps**:
1. Open app → Navigate to Motor 2 Insurance
2. Complete flow to "Upload Documents" step
3. Upload **Vehicle Logbook**:
   - Select clear logbook PDF/image
   - Wait for OCR (3-10 seconds)
   - **Expected**: ✅ Green badge "Document Verified"
   - **Expected**: Alert shows chassis, engine, registration numbers
4. Upload **National ID**:
   - Select ID copy
   - Wait for OCR
   - **Expected**: ✅ Green badge "Document Verified"
   - **Expected**: Alert shows ID number, name, DOB
5. Upload **KRA PIN**:
   - Select KRA certificate
   - Wait for OCR
   - **Expected**: ✅ Green badge "Document Verified"
   - **Expected**: Alert shows PIN number

**Success Criteria**:
- All 3 documents show green badges
- Progress shows "3 of 3 required documents uploaded"
- Extracted fields visible on each document card
- "Next" button enabled

---

### Scenario 2: Document Mismatch - Wrong Type
**Goal**: Verify system catches wrong document uploads

**Steps**:
1. Navigate to "Upload Documents"
2. Click **"Upload Logbook"** button
3. **Deliberately** select National ID scan instead
4. Wait for OCR processing

**Expected Results**:
- ❌ **Red badge appears**: "Type Mismatch"
- **Alert shows**:
  ```
  Title: ❌ Document Type Mismatch
  Message: Document mismatch detected!
  
  Expected: Vehicle Logbook
  Detected: National ID
  
  Please upload the correct document or verify your selection.
  
  Actions: [Re-upload Correct Document] [Override & Continue]
  ```
- Document card shows red border/background

**Action Tests**:
- **A. Re-upload**: 
  - Tap "Re-upload Correct Document"
  - Document removed from list
  - Upload button reappears
  - Upload correct logbook → Green badge
  
- **B. Override**:
  - Tap "Override & Continue"
  - Document stays with red badge and mismatch warning
  - Can proceed but validation warning persists

**Success Criteria**:
- System correctly identifies mismatch
- Clear explanation of expected vs detected
- User can recover by re-uploading or override

---

### Scenario 3: Unknown Document Type
**Goal**: Test handling of unclear/unusual documents

**Steps**:
1. Navigate to "Upload Documents"
2. Click **"Upload Business Permit"** (optional document)
3. Upload a **generic receipt** or **unusual document type**
4. Wait for OCR

**Expected Results**:
- ⚠️ **Yellow badge**: "Type Unknown"
- **Alert shows**:
  ```
  Title: ⚠️ Document Type Unknown
  Message: Could not verify document type. Expected Business Permit.
  Please ensure you've uploaded the correct document.
  
  Extracted fields:
  [whatever fields were found]
  
  Actions: [Re-upload] [Continue Anyway]
  ```
- Document card shows yellow border/background

**Action Tests**:
- **Re-upload**: Remove and try different file
- **Continue Anyway**: Proceed with warning badge

**Success Criteria**:
- Soft warning, not hard error
- User informed but not blocked
- Can continue with caution

---

### Scenario 4: Low Quality Document
**Goal**: Test edge case of poor scan quality

**Steps**:
1. Upload very blurry/dark logbook image
2. OCR may extract partial fields

**Expected**:
- Either ✅ Verified (if enough fields extracted) OR
- ⚠️ Unknown (if too unclear)
- **Never** ❌ Mismatch (unless it's clearly a different doc type)

---

### Scenario 5: Multi-Document Upload Flow
**Goal**: Test complete workflow with validation

**Steps**:
1. Upload Logbook → ✅ Verified → View extracted fields
2. Upload ID Copy → ❌ Mismatch (upload KRA by mistake)
   - Tap "Re-upload"
   - Upload correct ID → ✅ Verified
3. Upload KRA PIN → ✅ Verified
4. Review all documents:
   - 3 green badges
   - All extracted data visible
5. Tap "Next" to advance step

**Success Criteria**:
- Can recover from mistakes
- All validations work independently
- Step advancement only allowed when ready

---

## 🔍 Debugging

### Check Console Logs
Look for detector output in console:
```javascript
[Detector] { 
  fields: ['registration', 'chassis_number', 'engine_number'],
  detected: 'logbook'
}
```

### Verify OCR Result Structure
After successful upload, check document state:
```javascript
{
  name: 'logbook.pdf',
  status: 'processed',
  result: {
    fields: { registration: 'KBX 123A', ... },
    rawText: 'KENYA MOTOR VEHICLE...'
  },
  detectedType: 'logbook',
  validationStatus: 'verified',
  validationMessage: 'Document verified as Vehicle Logbook'
}
```

### Common Issues

**Issue**: Green badge doesn't appear
- Check if `validationStatus` is set in document state
- Verify styles imported correctly
- Check React Native Inspector for style application

**Issue**: Detection always returns "unknown"
- Verify OCR result has `fields` or `rawText`
- Check if field names match indicators in detector
- Review raw OCR output for relevant keywords

**Issue**: Alert doesn't show
- Check if `response?.success` is true
- Verify RNAlert import
- Check for caught exceptions in try/catch

---

## 📸 Screenshot Checklist

Capture these for documentation:

- [ ] ✅ Green badge on verified logbook
- [ ] ❌ Red badge on mismatched document
- [ ] ⚠️ Yellow badge on unknown type
- [ ] Alert with extracted fields
- [ ] Alert with mismatch error
- [ ] Document card with validation badge
- [ ] Progress indicator showing 3/3 uploaded
- [ ] Re-upload flow (before/after)

---

## 🎯 Success Metrics

After testing, document:
- [ ] All 5 scenarios passed
- [ ] Validation accuracy: ___ % (correct type detected)
- [ ] User experience rating: ⭐⭐⭐⭐⭐
- [ ] Performance: Detection time < 100ms
- [ ] Edge cases handled gracefully
- [ ] No crashes or blocking errors

---

## 📝 Test Report Template

```markdown
## Test Report: Motor 2 Document Validation

**Date**: [Date]
**Tester**: [Name]
**Environment**: [Dev/Staging/Production]
**App Version**: [Version]

### Scenario 1: Happy Path
- Status: ✅ Pass / ❌ Fail
- Notes: 

### Scenario 2: Document Mismatch
- Status: ✅ Pass / ❌ Fail
- Notes:

### Scenario 3: Unknown Document
- Status: ✅ Pass / ❌ Fail
- Notes:

### Scenario 4: Low Quality
- Status: ✅ Pass / ❌ Fail
- Notes:

### Scenario 5: Multi-Document
- Status: ✅ Pass / ❌ Fail
- Notes:

### Issues Found
1. [Issue description]
2. [Issue description]

### Overall Assessment
- Pass Rate: ____%
- Ready for Production: Yes / No
- Recommendations:
```

---

## 🚨 Rollback Plan

If validation causes issues in production:

1. **Quick Fix**: Comment out validation alerts
   ```javascript
   // Temporarily disable validation alerts
   // if (!validation.valid) { ... }
   ```

2. **Partial Rollback**: Keep detection but make all mismatches "warnings"
   ```javascript
   // Force all to warning level
   const validation = { valid: true, warning: true, ... };
   ```

3. **Full Rollback**: Revert to previous commit
   ```bash
   git revert [commit-hash]
   ```

---

**Testing Complete?** → Update `docs/MOTOR2_DOCUMENT_TYPE_VALIDATION.md` with results!
