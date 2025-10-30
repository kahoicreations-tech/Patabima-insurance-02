# Document Upload & Premium Calculation Issues - Fix Guide

## Issues Identified

### Issue 1: S3 Textract Results Path Mismatch

**Symptom:** Multiple "head_object missing or denied" errors for different S3 paths

```
Docs pipeline: head_object missing or denied for s3://patabima-backend-dev-uploads/textract-results/{jobId}.json
Docs pipeline: head_object missing or denied for s3://patabima-backend-dev-uploads/uploads/results/{jobId}.json
Docs pipeline: head_object missing or denied for s3://patabima-backend-dev-uploads/uploads/textract/results/{jobId}.json
... (6 different paths)
```

**Root Cause:**

1. Lambda function may not be writing Textract results to S3
2. Lambda might be writing to a different path than backend expects
3. Lambda trigger might not be configured (no SQS message received)

### Issue 2: Motor2 Policy Premium Breakdown All Zeros

**Symptom:** Policy created with totalAmount but breakdown shows zeros

```json
{
  "premiumBreakdown": {
    "totalAmount": 3029.88,
    "basePremium": 0,
    "trainingLevy": 0,
    "pcfLevy": 0,
    "stampDuty": 40
  }
}
```

**Root Cause:** The frontend is not calculating the premium breakdown before sending to backend

---

## Fix 1: S3 Document Processing Path Configuration

### Step 1: Verify Lambda Configuration

Check if Lambda is deployed and configured:

```bash
# Check if Lambda function exists
aws lambda get-function --function-name patabima-textract-dev --region us-east-1

# Check Lambda environment variables
aws lambda get-function-configuration --function-name patabima-textract-dev --region us-east-1
```

Expected Lambda environment variables:

- `RESULTS_S3_BUCKET`: patabima-backend-dev-uploads
- `RESULTS_S3_PREFIX`: textract-results (or empty)
- `CALLBACK_URL`: Your Django API callback endpoint

### Step 2: Configure Standard Results Path

The Lambda should write results to a **single, standardized path**. Update Lambda to write to:

```
s3://patabima-backend-dev-uploads/textract-results/{jobId}.json
```

### Step 3: Update Backend Environment Variables

In `insurance-app/.env`, set:

```env
# S3 Configuration
S3_BUCKET=patabima-backend-dev-uploads
S3_PREFIX=
RESULTS_S3_BUCKET=patabima-backend-dev-uploads
RESULTS_S3_PREFIX=textract-results
RESULTS_KEY_TEMPLATE=textract-results/{jobId}.json

# SQS Configuration
SQS_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/YOUR_ACCOUNT/patabima-textract-queue-dev

# Lambda Configuration
CALLBACK_SECRET=your-secure-callback-secret-here
DJANGO_API_URL=https://your-api-domain.com
```

### Step 4: Verify SQS Queue Connection

Check if SQS messages are being sent:

```python
# In insurance-app, add logging in views_docs.py
print(f"Docs pipeline: Sending SQS message to {queue_url}")
print(f"Message: {json.dumps(msg, indent=2)}")
```

### Step 5: Lambda Code Fix

Ensure Lambda writes to the correct path:

```python
# In Lambda function
def lambda_handler(event, context):
    job_id = message['jobId']
    object_key = message['objectKey']

    # Process with Textract
    result = process_textract(object_key)

    # Write to STANDARDIZED path
    results_bucket = os.environ['RESULTS_S3_BUCKET']
    results_key = f"textract-results/{job_id}.json"

    s3.put_object(
        Bucket=results_bucket,
        Key=results_key,
        Body=json.dumps(result),
        ContentType='application/json'
    )

    print(f"Results written to s3://{results_bucket}/{results_key}")
```

---

## Fix 2: Motor2 Premium Calculation

### Problem Analysis

The Motor2 flow is sending policy data with `totalAmount: 3029.88` but all breakdown components are 0 except stamp duty. This means the premium calculation is happening somewhere but not being properly passed.

Looking at the data:

- Total: 3029.88
- Stamp Duty: 40
- If we reverse calculate: 3029.88 - 40 = 2989.88
- This suggests: base ≈ 2950, ITL ≈ 7.38, PCF ≈ 7.38, vat ≈ 25.12

### Step 1: Find Where Total is Calculated

Search for where `totalAmount: 3029.88` comes from:

```bash
# Search in Motor2 flow
grep -r "totalAmount" frontend/screens/quotations/Motor\ 2/
grep -r "3029" frontend/screens/quotations/Motor\ 2/
```

### Step 2: Update Motor2 Policy Creation to Calculate Breakdown

The issue is likely in the Motor2 flow's payment/policy creation step. We need to ensure the breakdown is calculated before submission.

**Location:** `frontend/screens/quotations/Motor 2/MotorInsuranceFlow/Payment/PaymentScreen.js` (or similar)

**Fix:** Before creating the policy, calculate the breakdown:

```javascript
// In PaymentScreen.js or wherever policy is created
import { computeLevies } from "../../../../utils/pricingCalculations";

const createPolicy = async () => {
  const total = formData.selectedUnderwriter.totalPremium || 0;

  // Calculate breakdown properly
  // Based on Kenya IRA regulations: Total = Base + ITL + PCF + Stamp
  // ITL = 0.25%, PCF = 0.25%, Stamp = 40
  const stampDuty = 40;

  // Reverse calculate base premium from total
  // Total = Base + (Base * 0.0025) + (Base * 0.0025) + 40
  // Total = Base * 1.005 + 40
  // Base = (Total - 40) / 1.005
  const basePremium = (total - stampDuty) / 1.005;
  const itlLevy = basePremium * 0.0025;
  const pcfLevy = basePremium * 0.0025;

  const policyData = {
    ...formData,
    premiumBreakdown: {
      totalAmount: total,
      basePremium: Math.round(basePremium * 100) / 100,
      trainingLevy: Math.round(itlLevy * 100) / 100,
      pcfLevy: Math.round(pcfLevy * 100) / 100,
      stampDuty: stampDuty,
    },
    // ... rest of data
  };

  await api.createMotorPolicy(policyData);
};
```

### Step 3: Alternative - Use Backend Calculation

If the backend already has pricing logic, use it:

```javascript
// Call pricing endpoint first
const pricingResponse = await api.calculatePremium({
  subcategoryCode: formData.productDetails.subcategory,
  underwriterCode: formData.underwriterDetails.code,
  sumInsured: formData.vehicleDetails.value,
  // ... other inputs
});

const policyData = {
  ...formData,
  premiumBreakdown: {
    totalAmount: pricingResponse.total_premium,
    basePremium: pricingResponse.base_premium,
    trainingLevy: pricingResponse.insurance_training_levy,
    pcfLevy: pricingResponse.pcf_levy,
    stampDuty: pricingResponse.stamp_duty,
  },
};
```

---

## Fix 3: Update Backend to Handle Missing Breakdown

Add validation/calculation on backend side as fallback:

```python
# In insurance-app/app/views.py
class MotorPolicyViewSet(viewsets.ModelViewSet):
    def create(self, request):
        premium_breakdown = request.data.get('premiumBreakdown', {})
        total = float(premium_breakdown.get('totalAmount', 0))

        # If breakdown components are missing/zero, calculate them
        base = float(premium_breakdown.get('basePremium', 0))
        if total > 0 and base == 0:
            stamp_duty = 40
            # Reverse calculate: Base = (Total - Stamp) / 1.005
            base = (total - stamp_duty) / 1.005
            itl = base * 0.0025
            pcf = base * 0.0025

            premium_breakdown.update({
                'basePremium': round(base, 2),
                'trainingLevy': round(itl, 2),
                'pcfLevy': round(pcf, 2),
                'stampDuty': stamp_duty
            })

            request.data['premiumBreakdown'] = premium_breakdown

        return super().create(request)
```

---

## Testing Checklist

### S3 Document Processing:

- [ ] Lambda function is deployed and has correct permissions
- [ ] SQS queue is configured and Lambda is triggered
- [ ] Lambda writes to `textract-results/{jobId}.json`
- [ ] Backend reads from correct path
- [ ] Upload → Process → Result retrieval works end-to-end

### Premium Calculation:

- [ ] Motor2 flow calculates breakdown before policy creation
- [ ] All components (base, ITL, PCF, stamp) are populated
- [ ] Total matches sum of components
- [ ] Backend validation/calculation fallback works
- [ ] QuotationsScreen displays breakdown correctly

---

## Quick Fix Commands

### 1. Redeploy Lambda with Correct Path:

```bash
cd scripts/aws
./deploy-textract.ps1 -Env dev -CallbackSecret "your-secret"
```

### 2. Restart Django with Updated Env:

```bash
cd insurance-app
source venv/bin/activate  # or venv\Scripts\activate on Windows
python manage.py runserver 0.0.0.0:8000
```

### 3. Test Document Upload:

```bash
# Test presign endpoint
curl -X POST http://localhost:8000/api/v1/public_app/docs/presign \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "test.jpg",
    "mimeType": "image/jpeg",
    "sizeBytes": 1024,
    "docType": "national_id"
  }'
```

---

## Monitoring

### Check Lambda Logs:

```bash
aws logs tail /aws/lambda/patabima-textract-dev --follow --region us-east-1
```

### Check Django Logs:

Look for:

```
Docs pipeline: Sending SQS message to {queue_url}
Docs pipeline: head_object missing or denied for s3://...
GET /api/v1/public_app/docs/status/{jobId} -> state: DONE
```

### Check S3 Results:

```bash
aws s3 ls s3://patabima-backend-dev-uploads/textract-results/ --region us-east-1
```

---

## Root Cause Summary

1. **S3 Path Issue**: Lambda and backend are not aligned on where to write/read Textract results
2. **Premium Breakdown Issue**: Frontend Motor2 flow is not calculating breakdown before policy submission
3. **Both issues are independent** - one is AWS infrastructure, other is business logic

Fix priority:

1. Fix premium breakdown (higher priority - affects business functionality)
2. Standardize S3 paths (important for document processing)
