# Document Upload Integration - Complete Implementation

## Issue: Documents Not Being Submitted to Backend

**Problem**: Uploaded documents (logbook, KRA PIN, ID) were being uploaded to S3 but not included in the policy submission payload, resulting in empty `documents: []` array.

## Root Cause Analysis

1. **DocumentsUpload** component uploads files to S3 successfully
2. Calls `onDocumentsChange(documents)` callback with document metadata
3. **BUT** `DocumentsStep` wrapper didn't pass the callback to save data
4. **AND** `MotorInsuranceContext` had no state field for uploaded documents
5. **RESULT**: Document metadata was lost, never reached `PolicySubmission`

## Complete Fix Implementation

### 1. Frontend Context Updates

#### Added `uploadedDocuments` to Context State

**File**: `frontend/contexts/MotorInsuranceContext.js`

```javascript
const initialState = {
  // ... existing fields
  extractedDocuments: {}, // Extracted data FROM documents (names, KRA PIN, etc.)
  uploadedDocuments: {}, // ✅ NEW: Uploaded document metadata (S3 URLs, IDs, etc.)
  // ... rest of state
};
```

#### Added Reducer Case

```javascript
case 'UPDATE_UPLOADED_DOCUMENTS':
  return { ...state, uploadedDocuments: { ...state.uploadedDocuments, ...action.payload } };
```

#### Added Action Method

```javascript
updateUploadedDocuments: (updates) => {
  dispatch({ type: 'UPDATE_UPLOADED_DOCUMENTS', payload: updates });
},
```

### 2. DocumentsStep Wiring

**File**: `frontend/screens/quotations/Motor 2/MotorInsuranceFlow/steps/DocumentsStep.js`

**Before**:

```javascript
export default function DocumentsStep({ onExtractedData }) {
  const { state } = useMotorInsurance();
  // ...
  return (
    <DocumentsUpload
      selectedProduct={selectedProduct}
      vehicleData={vehicleData}
      onExtractedData={onExtractedData}
      // ❌ Missing: onDocumentsChange callback
    />
  );
}
```

**After**:

```javascript
export default function DocumentsStep({ onExtractedData }) {
  const { state, actions } = useMotorInsurance();
  const uploadedDocuments = state?.uploadedDocuments || {};

  const handleDocumentsChange = useCallback(
    (documents) => {
      console.log("[DocumentsStep] Documents updated:", Object.keys(documents));
      actions.updateUploadedDocuments(documents);
    },
    [actions]
  );

  return (
    <DocumentsUpload
      selectedProduct={selectedProduct}
      vehicleData={vehicleData}
      initialDocuments={uploadedDocuments}
      onDocumentsChange={handleDocumentsChange} // ✅ Now saves to context
      onExtractedData={onExtractedData}
    />
  );
}
```

### 3. PolicySubmission Document Extraction

**File**: `frontend/screens/quotations/Motor 2/MotorInsuranceFlow/Submission/PolicySubmission.js`

#### Added Helper Function

```javascript
/**
 * Map document keys from frontend to backend document types
 */
function mapDocTypeToBackend(key) {
  const mapping = {
    logbook: "logbook",
    id_copy: "national_id",
    kra_pin: "kra_pin",
    valuation: "valuation_report",
    business_permit: "business_permit",
  };
  return mapping[key] || "generic";
}
```

#### Added Documents Fallback in Context Enrichment

```javascript
// Documents fallbacks - convert uploaded documents to array format expected by backend
if (!composed.documents || composed.documents.length === 0) {
  const ctxUploadedDocs = ctx.uploadedDocuments || {};
  composed.documents = Object.entries(ctxUploadedDocs).map(([key, doc]) => ({
    type: doc.type || mapDocTypeToBackend(key),
    document_type: mapDocTypeToBackend(key),
    name: doc.name || key,
    s3_key: doc.s3_key,
    s3_url: doc.s3_url,
    document_id: doc.document_id,
    uploaded_at: doc.uploadedAt || doc.uploaded_at || new Date().toISOString(),
    status: doc.status || "uploaded",
  }));
}
```

### 4. Backend Validation & Storage

#### Enhanced Serializer Validation

**File**: `insurance-app/app/serializers.py`

```python
def validate_documents(self, value):
    """Validate documents array structure"""
    if not isinstance(value, list):
        raise serializers.ValidationError("Documents must be a list")

    # Documents are optional, but if provided, validate structure
    for i, doc in enumerate(value):
        if not isinstance(doc, dict):
            raise serializers.ValidationError(
                f"Document at index {i} must be an object"
            )
        # Validate document has required fields if s3_key present
        if doc.get('s3_key') and not doc.get('document_type'):
            raise serializers.ValidationError(
                f"Document at index {i} has s3_key but missing document_type"
            )

    return value
```

#### Added Logging in Policy Creation

**File**: `insurance-app/app/views/policy_management.py`

```python
policy.documents = validated_data.get('documents', [])

# Log documents for debugging
documents_count = len(policy.documents)
print(f"📎 Documents attached to policy: {documents_count}")
if documents_count > 0:
    for idx, doc in enumerate(policy.documents):
        doc_type = doc.get('document_type', 'unknown')
        doc_id = doc.get('document_id', 'N/A')
        print(f"  [{idx+1}] {doc_type} - ID: {doc_id}")
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER UPLOADS DOCUMENT (Step 5: Documents)                    │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. DocumentsUpload Component                                     │
│    - Picks document via DocumentPicker                           │
│    - Uploads to S3 via S3DocumentService                         │
│    - Receives: { s3_key, s3_url, document_id }                  │
│    - Stores in local state: documents[documentKey] = {...}      │
│    - Calls: onDocumentsChange(documents)                        │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. DocumentsStep (Wrapper)                                       │
│    - Receives callback: handleDocumentsChange(documents)         │
│    - Calls: actions.updateUploadedDocuments(documents)          │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. MotorInsuranceContext                                         │
│    - Reducer: UPDATE_UPLOADED_DOCUMENTS                          │
│    - State: uploadedDocuments = {                               │
│        logbook: { s3_key, s3_url, document_id, ... },          │
│        id_copy: { ... },                                        │
│        kra_pin: { ... }                                         │
│      }                                                           │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. PolicySubmission (Step 8: Submission)                        │
│    - Reads: ctx.uploadedDocuments from context                  │
│    - Transforms object to array:                                │
│      [                                                           │
│        { document_type: 'logbook', s3_key: '...', ... },       │
│        { document_type: 'national_id', s3_key: '...', ... },   │
│        { document_type: 'kra_pin', s3_key: '...', ... }        │
│      ]                                                           │
│    - Includes in composed payload                               │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. Backend API (POST /api/v1/policies/motor/create/)           │
│    - Validates via MotorPolicySubmissionSerializer              │
│    - Validates documents array structure                        │
│    - Saves: policy.documents = validated_data['documents']      │
│    - Logs document count and types                              │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. Database                                                      │
│    - MotorPolicy.documents (JSONField) stores array             │
│    - Each document has: document_type, s3_key, s3_url, etc.    │
└─────────────────────────────────────────────────────────────────┘
```

## Expected Payload After Fix

```json
{
  "quoteId": "QUOTE-1762431849810",
  "clientDetails": { ... },
  "vehicleDetails": { ... },
  "productDetails": { ... },
  "premiumBreakdown": { ... },
  "paymentDetails": { ... },
  "underwriterDetails": { ... },
  "addons": [],
  "documents": [
    {
      "type": "application/pdf",
      "document_type": "logbook",
      "name": "vehicle_logbook.pdf",
      "s3_key": "motor-insurance/documents/QUOTE-1234/logbook_abc123.pdf",
      "s3_url": "https://patabima-documents.s3.amazonaws.com/...",
      "document_id": "doc_xyz789",
      "uploaded_at": "2025-11-06T10:30:00.000Z",
      "status": "uploaded"
    },
    {
      "type": "image/jpeg",
      "document_type": "national_id",
      "name": "national_id.jpg",
      "s3_key": "motor-insurance/documents/QUOTE-1234/national_id_def456.jpg",
      "s3_url": "https://patabima-documents.s3.amazonaws.com/...",
      "document_id": "doc_uvw456",
      "uploaded_at": "2025-11-06T10:31:00.000Z",
      "status": "uploaded"
    },
    {
      "type": "application/pdf",
      "document_type": "kra_pin",
      "name": "kra_pin_cert.pdf",
      "s3_key": "motor-insurance/documents/QUOTE-1234/kra_pin_ghi789.pdf",
      "s3_url": "https://patabima-documents.s3.amazonaws.com/...",
      "document_id": "doc_rst123",
      "uploaded_at": "2025-11-06T10:32:00.000Z",
      "status": "uploaded"
    }
  ]
}
```

## Backend Database Schema

**MotorPolicy Model** (already supports documents):

```python
class MotorPolicy(models.Model):
    # ... other fields ...
    documents = models.JSONField(default=list, blank=True)
    # Stores array of document objects with S3 metadata
```

**Document Object Structure**:

```json
{
  "document_type": "logbook" | "national_id" | "kra_pin" | "valuation_report" | "business_permit",
  "s3_key": "motor-insurance/documents/{quoteId}/{type}_{hash}.{ext}",
  "s3_url": "https://patabima-documents.s3.amazonaws.com/{s3_key}",
  "document_id": "doc_{uuid}",
  "name": "original_filename.pdf",
  "type": "application/pdf" | "image/jpeg" | "image/png",
  "uploaded_at": "ISO 8601 timestamp",
  "status": "uploaded"
}
```

## Testing Checklist

### Frontend Tests

- [ ] Upload document in Documents step
- [ ] Verify document appears in UI with upload status
- [ ] Navigate to next steps without losing document data
- [ ] Check console for `[DocumentsStep] Documents updated:` log
- [ ] Verify documents array populated in submission payload logs

### Backend Tests

- [ ] Submit policy with documents array
- [ ] Check backend logs for `📎 Documents attached to policy: N`
- [ ] Verify documents saved to database
- [ ] Query policy to confirm documents field populated
- [ ] Test validation with invalid document structure

### Integration Tests

- [ ] Complete full Motor 2 flow with document uploads
- [ ] Verify policy created with documents attached
- [ ] Check S3 URLs are accessible
- [ ] Verify document IDs can be used for retrieval

## Console Logs to Monitor

### Frontend (DocumentsStep)

```
[DocumentsStep] Documents updated: ['logbook', 'id_copy', 'kra_pin']
```

### Frontend (PolicySubmission)

```
PolicySubmission - Composed Data BEFORE Normalization:
{
  "documents": [
    { "document_type": "logbook", "s3_key": "...", ... },
    ...
  ]
}

PolicySubmission - Normalized Payload BEING SENT:
{
  "documents": [ ... ]  // Should NOT be empty
}
```

### Backend (policy_management.py)

```
📎 Documents attached to policy: 3
  [1] logbook - ID: doc_xyz789
  [2] national_id - ID: doc_uvw456
  [3] kra_pin - ID: doc_rst123
```

## Files Changed

### Frontend

1. `frontend/contexts/MotorInsuranceContext.js`

   - Added `uploadedDocuments` to initialState
   - Added `UPDATE_UPLOADED_DOCUMENTS` reducer case
   - Added `updateUploadedDocuments` action

2. `frontend/screens/quotations/Motor 2/MotorInsuranceFlow/steps/DocumentsStep.js`

   - Added `handleDocumentsChange` callback
   - Wired `onDocumentsChange` prop to DocumentsUpload
   - Added `initialDocuments` prop from context

3. `frontend/screens/quotations/Motor 2/MotorInsuranceFlow/Submission/PolicySubmission.js`
   - Added `mapDocTypeToBackend` helper function
   - Added documents fallback in context enrichment
   - Transforms `uploadedDocuments` object to array

### Backend

1. `insurance-app/app/serializers.py`

   - Added `validate_documents` method
   - Validates document array structure
   - Ensures s3_key has corresponding document_type

2. `insurance-app/app/views/policy_management.py`
   - Added logging for document count and types
   - Already saves documents to policy (no change needed)

## Benefits

✅ **Documents properly tracked** through entire flow  
✅ **S3 metadata preserved** (URLs, keys, IDs)  
✅ **Backend validation** ensures data integrity  
✅ **Debugging logs** for easy troubleshooting  
✅ **No data loss** - documents persist across navigation  
✅ **Type safety** - proper document type mapping

## Next Steps

1. **Test the complete flow** end-to-end
2. **Verify documents in database** after policy creation
3. **Implement document retrieval** for policy viewing
4. **Add document download** functionality in policy details
5. **Consider document versioning** for policy updates
