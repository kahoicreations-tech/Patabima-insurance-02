# 🔧 Quick Fix Testing Guide

## ✅ What Was Fixed

### Issue 1: Client Details Not Auto-Filling
**Problem**: Documents uploaded and extracted successfully, but Client Details form stayed empty.

**Solution**: Changed from callback pattern to direct props in `EnhancedClientForm.js`.

---

### Issue 2: S3 "results/results/" Double Path
**Problem**: S3 logs showing `head_object missing for s3://bucket/results/results/{jobId}.json` (12+ errors per document).

**Solution**: Smart prefix detection in `_maybe_complete_from_s3()` to prevent double paths.

---

## 🧪 Quick Test Steps

### Test 1: Document Auto-Fill (Frontend)

1. **Start the app and navigate to Motor Insurance**
   ```bash
   cd frontend
   npm start
   ```

2. **Upload Documents**:
   - Step 1-2: Select PRIVATE → Private Comprehensive
   - Step 3: Fill Vehicle Details (if needed for validation)
   - Step 4: Upload Documents:
     - ✅ Logbook (vehicle registration certificate)
     - ✅ KRA PIN Certificate
     - ✅ ID Card copy
   - Wait for "Uploaded" green badges

3. **Navigate to Client Details (Step 5)**:
   - Check that form fields are auto-populated:
     - ✅ First Name (from ID card)
     - ✅ Last Name (from ID card)
     - ✅ KRA PIN (from KRA certificate)
     - ✅ ID Number (from ID card)
     - ✅ Vehicle Registration (from logbook)
     - ✅ Chassis Number (from logbook)
     - ✅ Make (from logbook)
     - ✅ Model (from logbook)

4. **Check Browser Console**:
   ```
   ✅ Expected: "✅ Client form auto-filled from extracted data: {...}"
   ❌ Not expected: Empty form or errors
   ```

---

### Test 2: S3 Path Fix (Backend)

1. **Start Django server** and watch logs:
   ```bash
   cd insurance-app
   python manage.py runserver 0.0.0.0:8000
   ```

2. **Upload any document** via frontend

3. **Check Django Logs**:
   
   **✅ BEFORE FIX** (you were seeing):
   ```
   Docs pipeline: head_object missing or denied for s3://patabima-backend-dev-uploads/results/results/fcd30eb2-xxx.json
   Docs pipeline: head_object missing or denied for s3://patabima-backend-dev-uploads/results/textract/results/fcd30eb2-xxx.json
   ... (10 more similar errors)
   ```
   
   **✅ AFTER FIX** (you should now see):
   ```
   ✅ Docs pipeline: Found results at s3://patabima-backend-dev-uploads/results/fcd30eb2-xxx.json
   ```

4. **Verify Document Status**:
   - Document should change from PROCESSING → DONE
   - No "results/results/" double path errors

---

## 🎯 Expected Results

### Client Details Form
| Field | Should Auto-Fill From | Example |
|-------|----------------------|---------|
| First Name | ID Card `owner_name` | "John" |
| Last Name | ID Card `owner_name` | "Doe" |
| Email | (if in extracted data) | "john@example.com" |
| Phone | (if in extracted data) | "0712345678" |
| KRA PIN | KRA Certificate | "A123456789Z" |
| ID Number | ID Card | "24798402" |
| Vehicle Registration | Logbook | "KCA123A" |
| Chassis Number | Logbook | "ABC12345678901234" |
| Make | Logbook | "Toyota" |
| Model | Logbook | "Corolla" |

### S3 Logs
- ✅ **1 success log** per document (instead of 12+ failures)
- ✅ No "results/results/" double paths
- ✅ Document status changes to DONE

---

## 🐛 If Something's Wrong

### Auto-Fill Not Working?

**Check extractedData state**:
```javascript
// Add this in MotorInsuranceScreen.js before Client Details step (line ~1127)
console.log('📊 extractedData:', extractedData);
```

**Expected output**:
```javascript
{
  logbook: { registration_number: "KCA123A", make: "Toyota", model: "Corolla", ... },
  kra_pin: { kra_pin: "A123456789Z" },
  id_copy: { owner_name: "John Doe", id_number: "24798402" }
}
```

---

### S3 Path Still Wrong?

**Check environment variable**:
```bash
# In .env file
RESULTS_S3_PREFIX=results  # ✅ Good
# NOT:
RESULTS_S3_PREFIX=results/ # ❌ Bad (trailing slash)
```

**Check Lambda output**:
- Lambda should write to: `s3://bucket/results/{jobId}.json`
- NOT: `s3://bucket/results/results/{jobId}.json`

---

## 📊 Files Modified

| File | Lines Changed | Purpose |
|------|--------------|---------|
| `MotorInsuranceScreen.js` | 1127-1160 | Pass extractedData as prop (not callback) |
| `EnhancedClientForm.js` | 1-75 (rewrite) | Accept extractedData prop, apply via useEffect |
| `views_docs.py` | 347-420 | Prevent double "results/" in S3 paths |

---

## ✅ Success Criteria

- [ ] Documents upload and show "Uploaded" status
- [ ] Client Details form auto-populates with extracted data
- [ ] Console shows: `✅ Client form auto-filled from extracted data: {...}`
- [ ] Django logs show: `✅ Docs pipeline: Found results at s3://...`
- [ ] NO "results/results/" double path errors
- [ ] User can still edit auto-filled fields

---

**Quick Testing Time**: ~5 minutes  
**Status**: Ready to test immediately!
