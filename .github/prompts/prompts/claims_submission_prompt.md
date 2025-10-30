# Claims Submission Feature - Build Prompt

This prompt defines the end-to-end implementation scope for a Claims Submission feature in PataBima, covering backend (Django REST) and frontend (React Native) integration.

## Objectives
- Allow authenticated users to submit an insurance claim against an existing policy
- Capture structured claim details and upload supporting documents
- Persist claims and documents in the backend; send notifications for triage
- Provide a simple status tracking endpoint for the frontend

## High-Level Flow
1. User opens "Submit a Claim" screen from Claims tab
2. User fills claim form (policy number, loss details, date of loss, location, description)
3. User attaches documents (photos, police abstract, logbook, ID, etc.)
4. App uploads documents to S3 (presigned URLs) and submits claim metadata to Django
5. Backend creates Claim and ClaimDocument records; returns claim reference
6. Frontend shows confirmation and navigates to Claim Details

## Data Model (Django)
- Claim
  - id (UUID)
  - user (FK to auth user)
  - policy_number (string)
  - product (string) e.g., 'MOTOR'
  - loss_date (date/time)
  - loss_location (string)
  - loss_description (text)
  - status (choices): DRAFT, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, CLOSED
  - created_at, updated_at
- ClaimDocument
  - id (UUID)
  - claim (FK)
  - doc_type (string) e.g., 'POLICE_ABSTRACT', 'VEHICLE_PHOTO'
  - s3_key (string)
  - file_name (string)
  - file_size (int)
  - content_type (string)
  - created_at

## API Contract (Django REST)
- POST /api/v1/claims/presign
  - body: { fileName, contentType, docType }
  - resp: { url, fields, key }
- POST /api/v1/claims/submit
  - body: {
      policy_number,
      product, // 'MOTOR'
      loss_date, // ISO string
      loss_location,
      loss_description,
      documents: [
        { doc_type, s3_key, file_name, content_type, file_size }
      ]
    }
  - resp: { success, claim: {...} }
- GET /api/v1/claims/
  - resp: { results: [ claim_summary... ] }
- GET /api/v1/claims/{id}/
  - resp: { claim, documents }

## Validation Rules
- policy_number: required, exists in a policy the user owns
- product: required, enum ['MOTOR'] (extendable)
- loss_date: required, not in the future
- loss_description: required, min length 10
- documents: optional but recommended; max 10

## Security
- Auth required (JWT)
- Ownership check: claim must be tied to requesting user
- S3 presign uses server-side key prefix: `claims/{user_id}/{yyyy}/{MM}/{uuid}/{fileName}`
- Limit content types to images/pdf and size to e.g., 20MB

## Notifications (Out of scope - note)
- On submission: optional email/slack to operations

## Frontend Integration
- New service methods in `DjangoAPIService`:
  - `getClaimPresign(fileName, contentType, docType)` → { url, fields, key }
  - `submitClaim(payload)` → { success, claim }
  - `getClaims()` → list
  - `getClaim(id)` → full details
- Wire to screens:
  - `ClaimsSubmissionScreen` collects form + uploads files via presign to S3, then calls submit
  - `ClaimsScreenNew` lists claims using `getClaims()`
  - `ClaimDetailsScreen` displays details and documents

## Frontend Form Fields
- Policy Number (text, with optional picker from existing policies)
- Product (readonly: Motor for now)
- Loss Date (date/time picker)
- Loss Location (text)
- Loss Description (multiline)
- Attachments (up to 10): camera/gallery picker; show upload progress

## Error Handling
- Show inline errors for validation failures
- For presign/upload errors: retry option
- For submit errors: keep form state so user can retry without re-entering all data

## Acceptance Criteria
- User can submit a claim with at least one document
- Claim appears in list and detail screens after submission
- Uploaded documents are stored under correct S3 prefix
- API validates ownership and required fields

## Next Steps
1. Implement Django models/serializers/views/urls under `insurance-app/app/claims/`
2. Add S3 presign endpoint using existing AWS helper
3. Add DjangoAPIService methods and connect to `ClaimsSubmissionScreen`
4. Add simple list/detail views in frontend (if not present)
5. QA with a sample claim and verify persistence and retrieval
