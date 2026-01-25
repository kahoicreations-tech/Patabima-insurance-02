# Motor3 Error Handling - Complete Implementation

## Overview

This document describes the comprehensive error handling implementation for the Motor3 flow, covering certificate failures, double insurance warnings, and mock certificate notifications.

## 1. Backend Error Handling

### Certificate Issuance Failures

**Location:** `insurance-app/app/views/policy_management.py`

The backend now handles DMVIC certificate failures gracefully:

```python
try:
    dmvic_cert = DMVICCertificateManager.issue_certificate(policy)
except DMVICAPIError as e:
    # Map technical errors to user-friendly messages
    dmvic_error = str(e)
    error_msg = e.message if hasattr(e, 'message') else str(e)
    
    if 'Token is expired' in error_msg or 'ER001' in error_msg:
        dmvic_user_message = "Your payment was successful and policy is active! However, we couldn't fetch your certificate from DMVIC at this time due to a temporary system connection issue..."
    elif 'Invalid payload' in error_msg or 'ER002' in error_msg:
        dmvic_user_message = "Your policy is active! We need to verify some details before issuing your DMVIC certificate..."
    # ... other error mappings
    
    policy.dmvic_status = 'PENDING_MANUAL_ISSUE'
```

**Response Structure:**

```json
{
  "success": true,
  "message": "Policy activated",
  "policyNumber": "POL-2026-737914",
  "dmvicCertificate": {
    "status": "PENDING_MANUAL_ISSUE",
    "dmvicStatus": "PENDING_MANUAL_ISSUE"
  },
  "warning": {
    "type": "CERTIFICATE_PENDING",
    "message": "Your payment was successful and policy is active! However, we couldn't fetch your certificate from DMVIC...",
    "showToast": true,
    "technicalDetails": "Token is expired" // Only in DEBUG mode
  }
}
```

### Mock Certificate Generation

**Location:** `insurance-app/app/services/dmvic_certificate_manager.py`

When DMVIC API fails, the system generates a mock certificate for UAT/testing:

```python
# Generate mock certificate for testing
mock_url = generate_mock_dmvic_certificate_pdf(policy)
dmvic_cert.status = 'ISSUED'
dmvic_cert.certificate_number = f"MOCK-{policy.policy_number.split('-')[-1]}"
dmvic_cert.response_data = { 'mock': True, 'url': mock_url }
```

**Mock certificates are identified by:**
- Certificate number starts with `"MOCK-"`
- `response_data.mock = true`

## 2. Frontend Error Handling

### PolicySuccess.js Updates

**Location:** `frontend/screens/quotations/Motor3/shared/Success/PolicySuccess.js`

#### A. Warning Toast Display

Added automatic toast display for backend warnings:

```javascript
// Extract warning from route params
const { policyNumber, policyId, pdfUrl, message, dmvicCertificate, warning } = route?.params || {};

// Show warning toast if backend provided one
useEffect(() => {
  if (warning && warning.message && warning.showToast) {
    Alert.alert(
      warning.type === 'CERTIFICATE_PENDING' ? '⚠️ Certificate Pending' : '⚠️ Notice',
      warning.message,
      [{ text: 'OK', style: 'default' }]
    );
  }
}, [warning]);
```

**User Experience:**
- User sees success message for policy creation
- Toast appears explaining why certificate is pending
- User-friendly language (no technical jargon)
- Technical details hidden in production

#### B. Mock Certificate Warning

Added prominent warning when displaying mock certificates:

```javascript
// Detect mock certificates
const isMockCertificate = dmvicCertificate?.response_data?.mock === true || 
                         dmvicCertificate?.certificateNumber?.startsWith('MOCK-');

// Display mock certificate warning
{isMockCertificate && (
  <View style={styles.mockCertificateWarning}>
    <Text style={styles.mockCertificateIcon}>🧪</Text>
    <Text style={styles.mockCertificateTitle}>Test Environment Certificate</Text>
    <Text style={styles.mockCertificateText}>
      This is a test certificate generated for UAT/development purposes. In production, 
      you will receive an official DMVIC certificate issued directly from the regulatory authority.
    </Text>
    <View style={styles.mockCertificateInfoBox}>
      <Text style={styles.mockCertificateInfoTitle}>📋 What this means:</Text>
      <Text style={styles.mockCertificateInfoText}>
        • Your policy is valid and active{'\n'}
        • This certificate is for testing only{'\n'}
        • Production will issue official DMVIC certificate{'\n'}
        • Certificate number starts with "MOCK-"
      </Text>
    </View>
  </View>
)}
```

**Visual Design:**
- Orange/amber warning box (#FFF3E0 background)
- Test tube emoji (🧪) to indicate testing
- Clear explanation of mock vs real certificates
- Bullet points explaining implications

### PolicySubmission.js Updates

**Location:** `frontend/screens/quotations/Motor3/shared/Submission/Submission/PolicySubmission.js`

#### A. Double Insurance Detection (Already Implemented)

The system already had comprehensive double insurance detection:

```javascript
// DMVIC Double-Insurance Check
const doubleInsuranceResult = await djangoAPI.validateDoubleInsurance(
  registration,
  coverStartDate,
  coverEndDate
);

if (doubleInsuranceResult?.has_active_cover && doubleInsuranceResult?.dmvic_policy) {
  const dmvicPol = doubleInsuranceResult.dmvic_policy;
  const dmvicInfo = `Policy: ${dmvicPol.policy_number || 'Unknown'}\n` +
                  `Underwriter: ${dmvicPol.member_company || 'Unknown'}\n` +
                  `Cover Type: ${dmvicPol.certificate_type || 'Unknown'}\n` +
                  `Expiry: ${dmvicPol.cover_end_date || 'Unknown'}`;
  
  Alert.alert(
    '⚠️ DMVIC Insurance Active',
    `CANNOT CREATE NEW POLICY\n\nDMVIC database confirms this vehicle has active insurance:\n\n${dmvicInfo}\n\n` +
    `Kenyan law prohibits duplicate motor insurance. The existing policy must expire or be cancelled before a new one can be issued.`,
    [
      { text: 'Contact Support', onPress: () => { /* show support info */ } },
      { text: 'Go Back', style: 'cancel', onPress: () => navigation.goBack() }
    ],
    { cancelable: false }
  );
  return; // BLOCK submission
}
```

**User Experience:**
- DMVIC check runs before policy creation
- If active cover detected, submission is BLOCKED
- Shows existing policy details
- Explains legal requirement
- Offers contact support or go back
- No option to proceed (regulatory compliance)

#### B. Warning Parameter Passthrough

Updated to pass warning from backend response:

```javascript
const result = {
  policyNumber: response.policyNumber || response.policy_number || `POL-${Date.now()}`,
  policyId: response.policyId || response.policy_id || response.id,
  pdfUrl: response.pdfUrl || response.pdf_url || null,
  message: response.message || 'Policy created successfully',
  dmvicCertificate: response.dmvic_certificate || response.certificate || response.dmvicCertificate || null,
  warning: response.warning || null  // NEW: Pass backend warning
};

navigation.navigate('PolicySuccess', result);
```

## 3. Certificate Status States

The system handles multiple certificate states:

| Status | Display | User Message | Action Available |
|--------|---------|--------------|------------------|
| **ISSUED** | ✅ Green checkmark | Certificate issued successfully | Download PDF |
| **MOCK_GENERATED** | 🧪 Orange warning | Test environment certificate | Download + Warning |
| **PREVIEW_GENERATED** | 🔍 Blue preview | Preview ready, final pending | View Preview |
| **PENDING** | ⏳ Pending icon | Certificate issuance in progress | Retry Later |
| **PENDING_MANUAL_ISSUE** | ⚠️ Warning | Certificate requires manual intervention | Contact Support |
| **NO_INVENTORY** | 📦 Inventory | Waiting for DMVIC sticker allocation | View Preview |
| **UAT_ERROR** | ⚠️ Error | UAT environment unavailable | No action needed |

## 4. Error Message Mapping

Backend errors are mapped to user-friendly messages:

| Technical Error | User Message |
|-----------------|--------------|
| `Token is expired` / `ER001` | "Temporary system connection issue. Our team will issue your certificate within 24 hours." |
| `Invalid payload` / `ER002` | "We need to verify some details before issuing your DMVIC certificate." |
| `Vehicle already insured` / `ER003` | "This vehicle already has active insurance coverage in DMVIC system." |
| `No inventory` / `ER004` | "Waiting for DMVIC to allocate certificate inventory." |
| Other errors | "Certificate issuance pending. Our team is working on it." |

## 5. Testing

### Smoke Test Coverage

**Location:** `scripts/test-motor3-smoke.ps1`

The smoke test validates:
- ✅ Policy creation success
- ✅ Warning message extraction and display
- ✅ Certificate status detection
- ✅ Mock certificate identification
- ✅ Document availability

**Example Output:**

```
✅ Policy created successfully!
Policy Number: POL-2026-737914

⚠️ Warning from backend:
Your payment was successful and policy is active! However, we couldn't fetch your certificate from DMVIC at this time...

📋 Certificate Status:
   • Status: PENDING_MANUAL_ISSUE
   • Type: CERTIFICATE_PENDING
   • Is Mock: No
```

### Manual Testing Scenarios

1. **Successful Certificate Issuance**
   - Expected: Green checkmark, download button
   - Verify: No warning toast

2. **DMVIC Token Expired**
   - Expected: Warning toast about temporary issue
   - Verify: Policy activated, certificate pending
   - Verify: User sees 24-hour timeframe

3. **Mock Certificate (UAT)**
   - Expected: Orange warning box explaining test certificate
   - Verify: Certificate number starts with "MOCK-"
   - Verify: Download button still available

4. **Double Insurance Detection**
   - Expected: BLOCKING alert with existing policy details
   - Verify: Cannot proceed with new policy
   - Verify: Contact support option available

5. **No DMVIC Inventory**
   - Expected: Warning about inventory allocation
   - Verify: Preview button available if preview generated
   - Verify: User reassured policy is active

## 6. User Journey

### Happy Path (Certificate Issued)
1. User completes Motor3 flow
2. Payment succeeds
3. Policy created
4. DMVIC certificate issued
5. ✅ Success screen shows certificate details
6. Download button available

### Partial Success Path (Certificate Pending)
1. User completes Motor3 flow
2. Payment succeeds
3. Policy created
4. DMVIC API fails (token expired)
5. ✅ Success screen shows policy created
6. ⚠️ Warning toast: "Certificate pending due to temporary issue"
7. User sees retry button
8. Support contact available

### UAT/Test Path (Mock Certificate)
1. User completes Motor3 flow in UAT
2. Payment succeeds
3. Policy created
4. DMVIC UAT unavailable
5. Mock certificate generated
6. ✅ Success screen shows mock certificate
7. 🧪 Orange warning: "Test environment certificate"
8. Download button available for testing

### Blocked Path (Double Insurance)
1. User starts Motor3 flow
2. Enters vehicle registration
3. DMVIC check detects active coverage
4. ❌ BLOCKING alert shows existing policy
5. Cannot proceed
6. Must contact support or wait for expiry

## 7. Code Style & Best Practices

### Implemented Patterns

1. **Graceful Degradation**
   - Policy creation succeeds even if certificate fails
   - Mock certificates for testing environments
   - Preview URLs as fallback

2. **User-Centric Messages**
   - Technical errors hidden from users
   - Clear explanations of next steps
   - Timeframes provided (e.g., "within 24 hours")

3. **Visual Hierarchy**
   - Success shown prominently
   - Warnings in amber/orange
   - Errors in red (blocking)
   - Info in blue

4. **Consistent Styling**
   - All warning boxes use similar structure
   - Emoji icons for visual recognition
   - Bullet points for actionable items
   - Font families from design system

## 8. Future Enhancements

### Potential Improvements

1. **Real-time Certificate Status**
   - WebSocket updates when certificate issued
   - Push notifications
   - Automatic download when available

2. **Retry Mechanism**
   - Exponential backoff for certificate retry
   - Manual retry button with cooldown
   - Status polling

3. **Analytics Tracking**
   - Certificate success rate
   - Average time to issuance
   - Error type frequency
   - Mock certificate usage

4. **Support Integration**
   - One-tap support contact
   - Pre-filled support tickets
   - Policy number auto-attached

## 9. Documentation Updates

### Files Modified

1. `insurance-app/app/views/policy_management.py` - Error handling
2. `frontend/screens/quotations/Motor3/shared/Success/PolicySuccess.js` - UI updates
3. `frontend/screens/quotations/Motor3/shared/Submission/Submission/PolicySubmission.js` - Warning passthrough

### Files Already Compliant

1. `frontend/screens/quotations/Motor3/shared/Submission/Submission/PolicySubmission.js` - Double insurance detection
2. `scripts/test-motor3-smoke.ps1` - Warning extraction and display

## 10. Conclusion

The Motor3 flow now has comprehensive error handling covering:

✅ **Certificate Failures** - Graceful handling with user-friendly messages
✅ **Mock Certificates** - Clear explanation of test vs production
✅ **Double Insurance** - DMVIC validation with blocking alerts
✅ **Warning Display** - Automatic toast for backend warnings
✅ **Status States** - Visual indicators for all certificate states
✅ **User Experience** - Success-first messaging with helpful context

**Key Achievement:** Users are never blocked from completing their purchase, but are always informed about the status of their certificate with clear, actionable guidance.
