# Form Validation Enhancements - Motor 2 Flow

## Overview

Comprehensive validation has been added to prevent users from proceeding without completing required steps properly. This includes document upload validation and client field format validation.

## 1. Document Upload Validation

### Implementation Location

**File**: `frontend/screens/quotations/Motor 2/MotorInsuranceFlow/MotorInsuranceContainer.js`

### Validation Rules

Users **CANNOT** proceed from the Documents step until ALL required documents are uploaded:

✅ **Required Documents**:

1. Vehicle Logbook
2. National ID
3. KRA PIN Certificate

### Code Implementation

```javascript
case 'Documents': {
  // Validate that required documents are uploaded
  const uploadedDocs = state.uploadedDocuments || {};
  const requiredDocs = ['logbook', 'id_copy', 'kra_pin'];
  const missingDocs = requiredDocs.filter(doc => !uploadedDocs[doc]);

  const allUploaded = missingDocs.length === 0;
  let msg = '';
  if (!allUploaded) {
    msg = `Please upload: ${missingDocs.map(d => {
      switch(d) {
        case 'logbook': return 'Vehicle Logbook';
        case 'id_copy': return 'National ID';
        case 'kra_pin': return 'KRA PIN Certificate';
        default: return d;
      }
    }).join(', ')}`;
  }
  return { canProceed: allUploaded, validationMessage: msg };
}
```

### User Experience

- **Red "Next" button** when documents missing
- **Clear error message** showing which documents are required
- **Green "Next" button** when all documents uploaded
- **Cannot navigate** to Client Details step until complete

## 2. Client Details Field Validation

### Implementation Location

**File**: `frontend/screens/quotations/Motor 2/MotorInsuranceFlow/ClientDetails/EnhancedClientForm.js`

### Validation Rules

#### A. **Email Validation**

- **Required**: ✅ Yes
- **Format**: Must be valid email (contains @ and domain)
- **Regex**: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- **Examples**:
  - ✅ Valid: `john@example.com`, `agent@patabima.co.ke`
  - ❌ Invalid: `john@`, `@example.com`, `john.com`

#### B. **Phone Number Validation**

- **Required**: ✅ Yes
- **Format**: Kenyan phone number (07XXXXXXXX, 01XXXXXXXX, +2547XXXXXXXX)
- **Regex**: `/^(\+254|254|0)?[17]\d{8}$/`
- **Examples**:
  - ✅ Valid: `0712345678`, `0112345678`, `+254712345678`, `254712345678`
  - ❌ Invalid: `0812345678`, `07123`, `123456789`
- **Error Message**: "Enter valid Kenyan phone (e.g., 0712345678)"

#### C. **KRA PIN Validation**

- **Required**: ⚠️ Optional (but validated if provided)
- **Format**: Letter + 9 digits + Letter (e.g., A000000000X)
- **Regex**: `/^[A-Z]\d{9}[A-Z]$/`
- **Examples**:
  - ✅ Valid: `A000000000X`, `P123456789M`
  - ❌ Invalid: `A00000000X` (too short), `12345678901` (no letters), `a000000000x` (lowercase)
- **Error Message**: "Enter valid KRA PIN (e.g., A000000000X)"

#### D. **ID Number Validation**

- **Required**: ⚠️ Optional (but validated if provided)
- **Format**: 7-8 digits
- **Regex**: `/^\d{7,8}$/`
- **Examples**:
  - ✅ Valid: `1234567`, `12345678`
  - ❌ Invalid: `123456` (too short), `123456789` (too long), `ABC1234` (contains letters)
- **Error Message**: "Enter valid ID number (7-8 digits)"

#### E. **Name Validation**

- **Required**: ✅ Yes (both first and last name)
- **Format**: Minimum 2 characters
- **Examples**:
  - ✅ Valid: `John`, `Maria`
  - ❌ Invalid: `J` (too short), `` (empty)
- **Error Message**: "First/Last name is required" or "Name too short (minimum 2 characters)"

### Container-Level Validation

**File**: `frontend/screens/quotations/Motor 2/MotorInsuranceFlow/MotorInsuranceContainer.js`

Enhanced validation logic prevents navigation from Client Details step:

```javascript
case 'Client Details': {
  const fullName = str(client.fullName || client.name);
  const phone = str(client.phone || client.phoneNumber || client.msisdn);
  const email = str(client.email);
  const kraPin = str(client.kra_pin || client.kraPin);
  const idNumber = str(client.id_number || client.idNumber);

  // Basic presence validation
  if (!fullName) {
    return { canProceed: false, validationMessage: 'Enter client full name' };
  }
  if (!phone) {
    return { canProceed: false, validationMessage: 'Enter client phone number' };
  }
  if (!email) {
    return { canProceed: false, validationMessage: 'Enter client email address' };
  }

  // Phone number validation (Kenyan format)
  const phoneRegex = /^(\+254|254|0)?[17]\d{8}$/;
  if (!phoneRegex.test(phone.replace(/[\s\-]/g, ''))) {
    return { canProceed: false, validationMessage: 'Enter valid Kenyan phone number (e.g., 0712345678)' };
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { canProceed: false, validationMessage: 'Enter valid email address' };
  }

  // KRA PIN validation (format: A000000000X)
  if (kraPin) {
    const kraPinRegex = /^[A-Z]\d{9}[A-Z]$/;
    if (!kraPinRegex.test(kraPin.replace(/[\s\-]/g, ''))) {
      return { canProceed: false, validationMessage: 'Enter valid KRA PIN (e.g., A000000000X)' };
    }
  }

  // ID Number validation (8 digits minimum)
  if (idNumber && idNumber.length < 7) {
    return { canProceed: false, validationMessage: 'Enter valid ID number (minimum 7 digits)' };
  }

  return { canProceed: true, validationMessage: '' };
}
```

### Real-Time Field Validation

#### Visual Feedback System

**Field States**:

1. **Error State** (Red border, red background):

   - Invalid format detected
   - Shows specific error message below field
   - Border: `#ff6b6b`, Background: `#fff5f5`

2. **Complete State** (Green border):

   - Valid data auto-filled from documents
   - Shows "✓ Auto-filled from document"
   - Border: `#51cf66`, Background: `#f0fff4`

3. **Manual Entry** (Blue border):

   - User manually entered valid data
   - Shows "ℹ️ Manually entered"
   - Border: `#4dabf7`, Background: `#f0f8ff`

4. **Missing State** (Orange/Red border):
   - Required field not filled
   - Shows warning message
   - Border: `#ffa500`, Background: `#fff8f0`

#### Validation Triggers

1. **onBlur** (Field loses focus):

   - Field-level validation runs
   - Error message displayed if invalid
   - Visual border color changes

2. **onChange** (User types):

   - Clears previous error message
   - Allows user to correct mistake
   - Re-validates on blur

3. **Form-level** (Next button):
   - Validates all fields together
   - Prevents navigation if errors exist
   - Shows summary error message

## Validation Helper Functions

### Email Validator

```javascript
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
```

### Phone Validator

```javascript
const validatePhone = (phone) => {
  // Kenyan phone format
  const phoneRegex = /^(\+254|254|0)?[17]\d{8}$/;
  return phoneRegex.test(phone.replace(/[\s\-]/g, ""));
};
```

### KRA PIN Validator

```javascript
const validateKraPin = (kraPin) => {
  // Format: A000000000X (letter + 9 digits + letter)
  const kraPinRegex = /^[A-Z]\d{9}[A-Z]$/;
  return kraPinRegex.test(kraPin.replace(/[\s\-]/g, ""));
};
```

### ID Number Validator

```javascript
const validateIdNumber = (idNumber) => {
  // Minimum 7 digits, maximum 8 digits
  return /^\d{7,8}$/.test(idNumber);
};
```

## User Experience Flow

### Documents Step

```
1. User arrives at Documents step
2. UI shows 3 required document upload cards
3. User uploads each document → checkmark appears
4. "Next" button remains RED until all 3 uploaded
5. Once all uploaded → "Next" turns GREEN
6. User can proceed to Client Details
```

### Client Details Step

```
1. User arrives at Client Details step
2. Fields auto-filled from documents (green borders)
3. User fills missing fields (email, phone)
4. On field blur → format validation runs
5. Invalid field → RED border + error message
6. User corrects → error clears on typing
7. All fields valid → "Next" button GREEN
8. Invalid fields exist → "Next" button RED with message
```

## Error Messages Reference

### Document Upload Errors

| Condition              | Message                                                            |
| ---------------------- | ------------------------------------------------------------------ |
| Missing all documents  | "Please upload: Vehicle Logbook, National ID, KRA PIN Certificate" |
| Missing some documents | "Please upload: Vehicle Logbook, KRA PIN Certificate" (example)    |

### Client Field Errors

| Field      | Error Condition | Message                                       |
| ---------- | --------------- | --------------------------------------------- |
| First Name | Empty           | "First name is required"                      |
| First Name | Too short       | "Name too short (minimum 2 characters)"       |
| Last Name  | Empty           | "Last name is required"                       |
| Email      | Empty           | "Email is required"                           |
| Email      | Invalid format  | "Enter valid email address"                   |
| Phone      | Empty           | "Phone number is required"                    |
| Phone      | Invalid format  | "Enter valid Kenyan phone (e.g., 0712345678)" |
| KRA PIN    | Invalid format  | "Enter valid KRA PIN (e.g., A000000000X)"     |
| ID Number  | Invalid format  | "Enter valid ID number (7-8 digits)"          |

## Testing Checklist

### Document Upload Validation

- [ ] Try to click "Next" with 0 documents uploaded → Should show error
- [ ] Upload 1 document → Button still disabled
- [ ] Upload 2 documents → Button still disabled
- [ ] Upload all 3 documents → Button enabled (green)
- [ ] Navigate to next step → Should succeed

### Email Validation

- [ ] Enter invalid email "test@" → Should show error on blur
- [ ] Enter invalid email "test.com" → Should show error
- [ ] Enter valid email "test@example.com" → Should clear error
- [ ] Try to proceed with invalid email → Should block navigation

### Phone Validation

- [ ] Enter invalid phone "0812345678" → Should show error (starts with 08)
- [ ] Enter invalid phone "12345" → Should show error (too short)
- [ ] Enter valid phone "0712345678" → Should clear error
- [ ] Enter valid phone "+254712345678" → Should clear error
- [ ] Try to proceed with invalid phone → Should block navigation

### KRA PIN Validation

- [ ] Leave KRA PIN empty → Should allow (optional field)
- [ ] Enter invalid "A00000000X" → Should show error (only 8 digits)
- [ ] Enter invalid "12345678901" → Should show error (no letters)
- [ ] Enter valid "A000000000X" → Should clear error

### ID Number Validation

- [ ] Leave ID empty → Should allow (optional field)
- [ ] Enter "123456" → Should show error (too short)
- [ ] Enter "123456789" → Should show error (too long)
- [ ] Enter "1234567" → Should clear error
- [ ] Enter "12345678" → Should clear error

### Navigation Blocking

- [ ] All documents uploaded + all fields valid → "Next" green, can proceed
- [ ] Missing documents → "Next" red, cannot proceed
- [ ] Invalid email → "Next" red, cannot proceed
- [ ] Invalid phone → "Next" red, cannot proceed
- [ ] Fix all errors → "Next" green, can proceed

## Files Modified

1. **MotorInsuranceContainer.js**:

   - Added document upload validation in Documents step
   - Enhanced Client Details validation with format checks
   - Added phone, email, KRA PIN, ID validation logic

2. **EnhancedClientForm.js**:
   - Added validation helper functions (email, phone, KRA PIN, ID)
   - Added field-level validation on blur
   - Added real-time error state management
   - Enhanced Field component to show errors with priority
   - Updated visual feedback system

## Benefits

✅ **Data Quality**: Only valid, properly formatted data proceeds  
✅ **User Guidance**: Clear error messages guide users to fix issues  
✅ **Document Compliance**: Ensures all required documents uploaded  
✅ **Real-time Feedback**: Users see errors immediately on blur  
✅ **Visual Clarity**: Color-coded fields (red=error, green=complete, blue=manual)  
✅ **Kenyan Standards**: Phone and KRA PIN validation matches Kenyan formats  
✅ **Prevention**: Blocks navigation until requirements met

## Next Steps

1. **Test the validation flow** end-to-end
2. **Monitor user feedback** on error messages
3. **Consider adding**:
   - Character counters for fields with limits
   - Format hints (placeholders showing format)
   - Autocomplete for common domains (gmail.com, etc.)
   - Paste formatting for phone numbers (auto-remove spaces/dashes)
