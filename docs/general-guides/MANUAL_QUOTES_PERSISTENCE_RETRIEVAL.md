# Manual Quotes Persistence & Retrieval Specification

Status: Draft (v1)
Owner: Engineering
Scope: Introduce persistent storage and retrieval workflow for simplified non-motor manual quotations (Travel, Personal Accident, Last Expense, future lines)

---

## 1. Problem Statement

Currently simplified non-motor quotes (manual lines) are POSTed to `/api/v1/public_app/insurance/submit_manual_quote` and returned immediately with an ephemeral reference. No persistence exists, so:

- Admins cannot track or process submissions centrally.
- Agents cannot view history or statuses.
- No audit trail or enrichment lifecycle.

---

## 2. Goals

| Goal              | Description                                                             |
| ----------------- | ----------------------------------------------------------------------- |
| Persistence       | Store every manual quote with immutable reference & payload             |
| Retrieval (Agent) | Allow agents to list and inspect their own submissions                  |
| Admin Processing  | Provide admin endpoints to transition status & annotate                 |
| Status Workflow   | Standardize lifecycle for tracking progress                             |
| Extensibility     | Easy to add new line_key types without schema changes                   |
| Safety            | Minimal validation (line_key + payload presence) but structure-friendly |

---

## 3. Out of Scope (v1)

- Automated premium calculation for manual lines
- Payment initiation or policy issuance
- File/document attachments (future iteration)
- Complex role-based fine-grained permissions beyond staff vs agent

---

## 4. Data Model

**Model: `ManualQuote`**

```python
class ManualQuote(models.Model):
    reference = models.CharField(max_length=40, unique=True, db_index=True)
    line_key = models.CharField(max_length=40, db_index=True)
    agent = models.ForeignKey(User, on_delete=models.CASCADE, related_name='manual_quotes')
    payload = models.JSONField()  # Raw form data from mobile
    preferred_underwriters = models.JSONField(default=list, blank=True)
    status = models.CharField(max_length=30, default='PENDING_ADMIN_REVIEW', db_index=True)
    computed_premium = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    levies_breakdown = models.JSONField(null=True, blank=True)
    admin_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
```

**Status Enum** (string-based, no dedicated choices class yet)

```
PENDING_ADMIN_REVIEW -> IN_PROGRESS -> COMPLETED
PENDING_ADMIN_REVIEW -> REJECTED
```

Optional transitions allowed from `IN_PROGRESS` -> `REJECTED` | `COMPLETED`.

---

## 5. Reference Generation Strategy

Current ephemeral format: `MNL-{LINE_KEY}-{timestamp}`.
Upgrade to ULID or UUID for collision resistance.
Implementation:

```python
import uuid
ref = f"MNL-{line_key}-{uuid.uuid4().hex[:8].upper()}"
```

_Store full UUID in a hidden field later if needed._

---

## 6. API Endpoints (v1)

### 6.1 Create Manual Quote (Agent)

`POST /api/v1/public_app/insurance/manual_quotes`
Request:

```json
{
  "line_key": "TRAVEL",
  "payload": {
    "client_name": "John Doe",
    "travelers_age": 33,
    "destination": "UK"
  },
  "preferred_underwriters": ["MADISON", "BRITAM"],
  "notes": "High net worth client"
}
```

Response (201):

```json
{
  "success": true,
  "reference": "MNL-TRAVEL-AB12CD34",
  "status": "PENDING_ADMIN_REVIEW"
}
```

Validation Fail (400):

```json
{ "detail": "line_key required" }
```

### 6.2 List Manual Quotes (Agent)

`GET /api/v1/public_app/insurance/manual_quotes?status=PENDING_ADMIN_REVIEW&line_key=TRAVEL`
Response:

```json
{
  "results": [
    {
      "reference": "MNL-TRAVEL-AB12CD34",
      "line_key": "TRAVEL",
      "status": "PENDING_ADMIN_REVIEW",
      "created_at": "2025-10-08T11:05:22Z"
    }
  ],
  "count": 1
}
```

### 6.3 Retrieve Manual Quote (Agent)

`GET /api/v1/public_app/insurance/manual_quotes/{reference}`
Response:

```json
{
  "reference": "MNL-TRAVEL-AB12CD34",
  "line_key": "TRAVEL",
  "payload": { "client_name": "John Doe", ... },
  "preferred_underwriters": ["MADISON"],
  "status": "PENDING_ADMIN_REVIEW",
  "computed_premium": null,
  "levies_breakdown": null,
  "admin_notes": "",
  "created_at": "2025-10-08T11:05:22Z",
  "updated_at": "2025-10-08T11:05:22Z"
}
```

### 6.4 Admin List Quotes

`GET /api/v1/admin/manual_quotes?status=IN_PROGRESS&line_key=TRAVEL&agent_code=AG123`

- Staff only; same shape as agent list plus optional filtering by agent_code.

### 6.5 Admin Update Status

`PATCH /api/v1/admin/manual_quotes/{reference}`
Request:

```json
{
  "status": "IN_PROGRESS",
  "admin_notes": "Reviewing documents",
  "computed_premium": 12500.0,
  "levies_breakdown": { "ITL": 31.25, "PCF": 31.25, "stamp_duty": 40 }
}
```

Response:

```json
{ "success": true, "status": "IN_PROGRESS" }
```

### 6.6 Optional: Bulk Admin Update (Future)

`POST /api/v1/admin/manual_quotes/bulk_update` with references array.

---

## 7. Permissions Matrix

| Endpoint              | Role                | Allowed                |
| --------------------- | ------------------- | ---------------------- |
| Create Manual Quote   | Authenticated Agent | Yes                    |
| List Own Quotes       | Agent               | Yes (filtered by user) |
| Retrieve Own Quote    | Agent               | Yes                    |
| Admin List            | Staff               | Yes                    |
| Admin Update          | Staff               | Yes                    |
| Access Others' Quotes | Agent               | No                     |

DRF Permissions:

- Agent endpoints: `IsAuthenticated`
- Admin endpoints: custom `IsStaffOrSuperUser` permission class.

---

## 8. Serializers

```python
class ManualQuoteCreateSerializer(serializers.Serializer):
    line_key = serializers.CharField(max_length=40)
    payload = serializers.JSONField()
    preferred_underwriters = serializers.ListField(child=serializers.CharField(), required=False)
    notes = serializers.CharField(allow_blank=True, required=False)

class ManualQuoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = ManualQuote
        fields = '__all__'
```

Admin partial update serializer:

```python
class ManualQuoteAdminUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=['PENDING_ADMIN_REVIEW','IN_PROGRESS','COMPLETED','REJECTED'])
    admin_notes = serializers.CharField(allow_blank=True, required=False)
    computed_premium = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    levies_breakdown = serializers.JSONField(required=False)
```

---

## 9. Views Outline

```python
class ManualQuoteViewSet(ViewSet):
    permission_classes = [IsAuthenticated]

    def create(self, request):
        s = ManualQuoteCreateSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        ref = generate_reference(s.validated_data['line_key'])
        obj = ManualQuote.objects.create(
            reference=ref,
            line_key=s.validated_data['line_key'].upper(),
            agent=request.user,
            payload=s.validated_data['payload'],
            preferred_underwriters=s.validated_data.get('preferred_underwriters', [])
        )
        return Response({'success': True, 'reference': obj.reference, 'status': obj.status}, status=201)

    def list(self, request):
        qs = ManualQuote.objects.filter(agent=request.user)
        # Optional filters
        if 'status' in request.query_params: qs = qs.filter(status=request.query_params['status'])
        if 'line_key' in request.query_params: qs = qs.filter(line_key=request.query_params['line_key'].upper())
        data = [{ 'reference': q.reference, 'line_key': q.line_key, 'status': q.status, 'created_at': q.created_at.isoformat() } for q in qs[:200]]
        return Response({'results': data, 'count': len(data)})

    def retrieve(self, request, pk=None):
        q = get_object_or_404(ManualQuote, reference=pk, agent=request.user)
        return Response(ManualQuoteSerializer(q).data)
```

Admin viewset: similar pattern with additional filters + PATCH for status.

---

## 10. URL Configuration

```
# public_app routes (agent)
router.register('insurance/manual_quotes', ManualQuoteViewSet, basename='manual-quotes')

# admin routes
router.register('admin/manual_quotes', ManualQuoteAdminViewSet, basename='admin-manual-quotes')
```

---

## 11. Indexes & Performance

- `reference` unique + indexed
- `line_key` indexed (reporting/filtering)
- `status` indexed (queues)
- Consider composite B-Tree index `(status, line_key)` if admin filtering heavy

---

## 12. Migration Plan

1. Create model `ManualQuote`
2. Generate migration: `python manage.py makemigrations app`
3. Apply: `python manage.py migrate`
4. (Optional) Create superuser if none exists
5. Add model to admin for quick inspection

---

## 13. Admin Integration (Django Admin)

```python
@admin.register(ManualQuote)
class ManualQuoteAdmin(admin.ModelAdmin):
    list_display = ('reference','line_key','agent','status','created_at')
    list_filter = ('line_key','status','created_at')
    search_fields = ('reference','agent__email','agent__agent_code')
    readonly_fields = ('reference','created_at','updated_at','payload')
```

---

## 14. Frontend Roadmap (Agent App)

| Phase | Feature                                                         |
| ----- | --------------------------------------------------------------- |
| 1     | After submission navigate to Confirmation screen with reference |
| 2     | Manual Quotes list screen (pull from list endpoint)             |
| 3     | Quote detail view with payload & admin notes                    |
| 4     | Pull-to-refresh + status badges                                 |
| 5     | Retry queue for offline submissions                             |

---

## 15. Test Matrix

| Case                           | Endpoint                          | Expectation             |
| ------------------------------ | --------------------------------- | ----------------------- |
| Create valid                   | POST create                       | 201 + reference         |
| Missing line_key               | POST create                       | 400                     |
| List own                       | GET list                          | 200 only own refs       |
| Retrieve unauthorized          | GET retrieve other agent          | 404/403                 |
| Admin list filter              | GET admin list?status=IN_PROGRESS | Filtered set            |
| Status transition              | PATCH admin -> IN_PROGRESS        | 200 updated             |
| Invalid status                 | PATCH admin                       | 400                     |
| Large payload                  | POST create                       | 201 (within size limit) |
| Over limit future (if applied) | POST create                       | 429/400                 |

---

## 16. Security & Validation Notes

- Enforce authentication everywhere.
- Ensure agents cannot query others' references.
- Size guard (future): reject payload > 25KB.
- Sanitize / trim strings in admin_notes.

---

## 17. Future Extensions

| Feature                  | Rationale                       |
| ------------------------ | ------------------------------- |
| Attach documents         | Allow supporting evidence       |
| Premium auto-calc plugin | Gradually automate simple lines |
| Notifications            | Email/SMS on status change      |
| Export CSV               | Operational reporting           |
| Tagging                  | Segment quotes (e.g., VIP)      |

---

## 18. Implementation Checklist

- [ ] Add model `ManualQuote`
- [ ] Register in admin
- [ ] Add serializers (create, full, admin update)
- [ ] Add agent viewset (create/list/retrieve)
- [ ] Add admin viewset (list/retrieve/partial_update)
- [ ] Wire URLs (public_app + admin)
- [ ] Update existing submission endpoint to optionally persist OR deprecate in favour of new one
- [ ] Write tests (creation, permissions, status transitions)
- [ ] Frontend: adapt submit to new endpoint once deployed
- [ ] Document in README or link this spec

---

## 19. Example cURL Commands

```bash
# Create
curl -X POST -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" \
  -d '{"line_key":"TRAVEL","payload":{"client_name":"Jane"}}' \
  http://localhost:8001/api/v1/public_app/insurance/manual_quotes

# List
curl -H "Authorization: Bearer <TOKEN>" \
  http://localhost:8001/api/v1/public_app/insurance/manual_quotes?line_key=TRAVEL

# Retrieve
curl -H "Authorization: Bearer <TOKEN>" \
  http://localhost:8001/api/v1/public_app/insurance/manual_quotes/MNL-TRAVEL-AB12CD34

# Admin status update
curl -X PATCH -H "Authorization: Bearer <ADMIN_TOKEN>" -H "Content-Type: application/json" \
  -d '{"status":"IN_PROGRESS","admin_notes":"Review started"}' \
  http://localhost:8001/api/v1/admin/manual_quotes/MNL-TRAVEL-AB12CD34
```

---

## 20. Risks / Mitigations

| Risk                        | Mitigation                                |
| --------------------------- | ----------------------------------------- |
| Payload schema drift        | Keep raw JSON; add schema registry later  |
| High volume spam            | Add per-agent daily rate limit later      |
| Manual endpoint duplication | Deprecate old submit_manual_quote post-v1 |
| Large JSON bloat            | Enforce size cap when observed            |

---

## 21. Decision Log

| Decision                                            | Date       | Notes              |
| --------------------------------------------------- | ---------- | ------------------ |
| Use single flexible JSON instead of per-line tables | 2025-10-08 | Speed + agility    |
| UUID-based reference suffix                         | 2025-10-08 | Low collision risk |

---

## 22. Next Steps After Approval

1. Implement model + migrations
2. Implement serializers & viewsets
3. Replace old ephemeral endpoint calls in frontend
4. Add backend tests
5. Release behind feature flag if needed

---

_End of Spec_
