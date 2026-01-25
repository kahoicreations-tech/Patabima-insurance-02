# Motor3 Error Handling - Quick Reference

## 🚀 Quick Status Check

### ✅ What's Working Now

1. **Backend** - Returns warnings for certificate failures
2. **Frontend** - Displays warning toasts automatically
3. **Mock Certificates** - Clearly marked with explanation
4. **Double Insurance** - DMVIC check blocks duplicate policies
5. **User Experience** - Clear, informative messages at every step

---

## 📋 Certificate Status States

| Status | Icon | Color | User Action |
|--------|------|-------|-------------|
| `ISSUED` | ✅ | Green | Download |
| `MOCK_GENERATED` | 🧪 | Orange | Download + Warning |
| `PREVIEW_GENERATED` | 🔍 | Blue | View Preview |
| `PENDING` | ⏳ | Yellow | Retry |
| `PENDING_MANUAL_ISSUE` | ⚠️ | Yellow | Wait/Support |
| `NO_INVENTORY` | 📦 | Yellow | View Preview |
| `UAT_ERROR` | ⚠️ | Red | No Action |

---

## 🔧 Code Snippets

### Backend: Return Warning

```python
# In policy_management.py
response_data['warning'] = {
    'type': 'CERTIFICATE_PENDING',
    'message': 'User-friendly explanation here...',
    'showToast': True,
    'technicalDetails': error_msg if settings.DEBUG else None
}
```

### Frontend: Display Warning

```javascript
// In PolicySuccess.js
const { warning } = route?.params || {};

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

### Detect Mock Certificate

```javascript
// In PolicySuccess.js
const isMockCertificate = 
  dmvicCertificate?.response_data?.mock === true || 
  dmvicCertificate?.certificateNumber?.startsWith('MOCK-');
```

### Pass Warning to Success Screen

```javascript
// In PolicySubmission.js
const result = {
  policyNumber: response.policyNumber,
  policyId: response.policyId,
  dmvicCertificate: response.dmvic_certificate,
  warning: response.warning || null  // ← Add this
};

navigation.navigate('PolicySuccess', result);
```

---

## 🧪 Testing Commands

### Run Smoke Test
```powershell
cd scripts
.\test-motor3-smoke.ps1
```

### Expected Output
```
✅ Policy created successfully!
Policy Number: POL-2026-737914

⚠️ Warning from backend:
Your payment was successful and policy is active!
However, we couldn't fetch your certificate...

📋 Certificate Status:
   • Status: PENDING_MANUAL_ISSUE
   • Type: CERTIFICATE_PENDING
```

---

## 🎨 UI Colors

```javascript
// Success
backgroundColor: '#d4edda', // Light green
color: '#28a745' // Green

// Warning
backgroundColor: '#FFF9E6', // Light yellow
color: '#856404' // Dark yellow

// Mock Certificate
backgroundColor: '#FFF3E0', // Light orange
borderColor: '#FF9800' // Orange

// Error/Blocking
backgroundColor: '#f8d7da', // Light red
color: '#D32F2F' // Red
```

---

## 📱 User Messages

### Certificate Pending
> "Your payment was successful and policy is active! However, we couldn't fetch your certificate from DMVIC at this time due to a temporary system connection issue. Our team will issue your certificate within 24 hours."

### Mock Certificate
> "This is a test certificate generated for UAT/development purposes. In production, you will receive an official DMVIC certificate issued directly from the regulatory authority."

### Double Insurance
> "DMVIC database confirms this vehicle has active insurance. Kenyan law prohibits duplicate motor insurance. The existing policy must expire or be cancelled before a new one can be issued."

### No Inventory
> "Your policy is active, but DMVIC certificate issuance requires sticker inventory allocation. Certificate will be available shortly."

---

## 🔍 Debugging

### Check Backend Response
```javascript
console.log('Backend response:', response);
console.log('Warning:', response.warning);
console.log('DMVIC Certificate:', response.dmvic_certificate);
```

### Check Frontend Props
```javascript
console.log('Route params:', route?.params);
console.log('Warning param:', route?.params?.warning);
console.log('Is Mock:', isMockCertificate);
```

### Check Certificate Status
```javascript
console.log('DMVIC Status:', dmvicStatus);
console.log('Certificate Number:', dmvicCertificate?.certificateNumber);
console.log('Response Data:', dmvicCertificate?.response_data);
```

---

## 📂 Files Modified

1. `frontend/screens/quotations/Motor3/shared/Success/PolicySuccess.js`
   - Added warning toast display
   - Added mock certificate detection
   - Added mock certificate warning UI

2. `frontend/screens/quotations/Motor3/shared/Submission/Submission/PolicySubmission.js`
   - Added warning passthrough to result object

3. `insurance-app/app/views/policy_management.py` (already done)
   - Added graceful DMVIC error handling
   - Added user-friendly warning messages

---

## 🚨 Common Issues

### Warning Not Showing
**Check:**
- Backend returns `warning` object in response
- `warning.showToast` is `true`
- Frontend extracts `warning` from route params
- useEffect has correct dependency array

### Mock Warning Not Showing
**Check:**
- Certificate number starts with "MOCK-"
- OR `response_data.mock` is `true`
- `isMockCertificate` logic is correct
- Conditional rendering checks `isMockCertificate`

### Double Insurance Not Blocking
**Check:**
- `validateDoubleInsurance` API call succeeds
- `has_active_cover` is `true` in response
- Alert is shown with correct options
- Early `return` statement exits function

---

## 📊 Success Metrics

Track these metrics in production:

| Metric | Target | Current |
|--------|--------|---------|
| Certificate Success Rate | > 95% | TBD |
| Warning Toast Display Rate | 100% when warning exists | TBD |
| Mock Certificate Usage (UAT) | High in UAT, 0% in prod | TBD |
| Double Insurance Detection | 100% of duplicates | TBD |
| User Support Contacts | < 5% | TBD |

---

## 🎯 Key Principles

1. **Success First** - Always show policy creation success
2. **Clear Communication** - No technical jargon
3. **User Empowerment** - Provide actionable next steps
4. **Regulatory Compliance** - BLOCK double insurance
5. **Environment Awareness** - Explain test vs production

---

## 📖 Full Documentation

For detailed information, see:
- [MOTOR3_ERROR_HANDLING_COMPLETE.md](MOTOR3_ERROR_HANDLING_COMPLETE.md) - Technical details
- [MOTOR3_USER_EXPERIENCE_GUIDE.md](MOTOR3_USER_EXPERIENCE_GUIDE.md) - Visual mockups
- [MOTOR3_ERROR_HANDLING_SUMMARY.md](MOTOR3_ERROR_HANDLING_SUMMARY.md) - Implementation summary

---

**Quick Start:** Read this card → Run smoke test → Verify in UAT → Deploy to production
