# Backend Version Management for Motor2 Static Data

## Where Versions Are Stored

### 1. Django Settings (PRIMARY LOCATION)

**File**: `insurance-app/insurance-app/settings.py`

```python
# Motor2 Static Data Version
# Manually increment when categories/subcategories change
MOTOR2_STATIC_VERSION = '1.0.0'

# Version History:
# 1.0.0 - Initial release (Nov 10, 2025)
# 1.1.0 - Added PRIVATE_TOR_WITH_PLL subcategory
# 1.2.0 - Added AVIATION category
```

### 2. Environment Variables (PRODUCTION)

**File**: `.env` (not committed to git)

```bash
MOTOR2_STATIC_VERSION=1.2.5
```

**File**: `insurance-app/insurance-app/settings.py`

```python
import os
from dotenv import load_dotenv

load_dotenv()

MOTOR2_STATIC_VERSION = os.getenv('MOTOR2_STATIC_VERSION', '1.0.0')
```

---

## API Endpoint Implementation

**File**: `insurance-app/app/views/motor2_metadata_views.py`

```python
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from app.models import MotorCategory, MotorSubcategory
from datetime import datetime

class Motor2MetadataView(APIView):
    """
    Returns metadata for Motor2 static data versioning

    Endpoint: GET /api/v1/motor2/metadata/version/

    Response:
    {
        "version": "1.2.5",
        "last_updated": "2025-11-10T10:30:00Z",
        "total_categories": 6,
        "total_subcategories": 60,
        "category_versions": {
            "PRIVATE": "1.2.5",
            "COMMERCIAL": "1.2.5",
            ...
        }
    }
    """

    permission_classes = []  # Public endpoint (or add authentication)

    def get(self, request):
        # Get version from settings
        version = getattr(settings, 'MOTOR2_STATIC_VERSION', '1.0.0')

        # Get database statistics
        categories = MotorCategory.objects.filter(is_active=True).order_by('-updated_at')
        subcategories = MotorSubcategory.objects.filter(is_active=True).order_by('-updated_at')

        # Get most recent update timestamp
        last_updated = None
        if categories.exists():
            last_updated = categories.first().updated_at
        if subcategories.exists() and (last_updated is None or subcategories.first().updated_at > last_updated):
            last_updated = subcategories.first().updated_at

        # Build category versions map
        category_versions = {}
        for cat in categories:
            category_versions[cat.code] = version

        return Response({
            'version': version,
            'last_updated': last_updated.isoformat() if last_updated else None,
            'total_categories': categories.count(),
            'total_subcategories': subcategories.count(),
            'category_versions': category_versions,
            'schema_version': '1.0',  # For future schema changes
        }, status=status.HTTP_200_OK)
```

---

## URL Configuration

**File**: `insurance-app/app/urls.py`

```python
from django.urls import path
from app.views.motor2_metadata_views import Motor2MetadataView

urlpatterns = [
    # Existing routes...

    # Motor2 Static Data Versioning
    path('api/v1/motor2/metadata/version/', Motor2MetadataView.as_view(), name='motor2-metadata-version'),
]
```

---

## Version Update Workflow

### Scenario 1: Adding New Subcategory

```bash
# 1. Add subcategory via Django Admin
# - Login: http://localhost:8000/admin/
# - Navigate to: Motor Subcategories
# - Add new: "Private - Windscreen Extension"

# 2. Increment version in settings.py
# OLD: MOTOR2_STATIC_VERSION = '1.0.0'
# NEW: MOTOR2_STATIC_VERSION = '1.1.0'

# 3. Export updated data
cd insurance-app
python manage.py export_motor2_static

# 4. Verify version endpoint
curl http://localhost:8000/api/v1/motor2/metadata/version/

# Response:
# {
#   "version": "1.1.0",
#   "total_subcategories": 61,  ← Increased from 60
#   ...
# }

# 5. Update frontend static files (see MOTOR2_STATIC_DATA_IMPLEMENTATION.md Step 2)
```

### Scenario 2: Production Deployment

```bash
# Production Server (.env file)
MOTOR2_STATIC_VERSION=1.2.5

# Restart Django
sudo systemctl restart gunicorn

# Verify
curl https://api.patabima.com/api/v1/motor2/metadata/version/
```

---

## Database Schema for Tracking

**Optional**: Add version tracking table for audit trail

**File**: `insurance-app/app/models/motor2_version.py`

```python
from django.db import models
from django.utils import timezone

class Motor2DataVersion(models.Model):
    """
    Audit trail for Motor2 static data versions
    """
    version = models.CharField(max_length=20)
    description = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)
    created_by = models.ForeignKey('auth.User', on_delete=models.SET_NULL, null=True)

    # Changelog
    categories_added = models.JSONField(default=list)
    subcategories_added = models.JSONField(default=list)
    categories_modified = models.JSONField(default=list)
    subcategories_modified = models.JSONField(default=list)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Motor2 Data Version'
        verbose_name_plural = 'Motor2 Data Versions'

    def __str__(self):
        return f"v{self.version} - {self.created_at.date()}"
```

**Migration**:

```bash
python manage.py makemigrations
python manage.py migrate
```

**Admin Registration**:

```python
# insurance-app/app/admin.py
from django.contrib import admin
from app.models import Motor2DataVersion

@admin.register(Motor2DataVersion)
class Motor2DataVersionAdmin(admin.ModelAdmin):
    list_display = ['version', 'description', 'created_at', 'created_by']
    readonly_fields = ['created_at']
```

---

## Version Comparison Logic

**File**: `insurance-app/app/utils/version_utils.py`

```python
def compare_versions(v1: str, v2: str) -> int:
    """
    Compare two semantic versions

    Returns:
        -1 if v1 < v2
         0 if v1 == v2
         1 if v1 > v2

    Examples:
        compare_versions('1.2.3', '1.2.5') → -1
        compare_versions('1.2.5', '1.2.5') → 0
        compare_versions('1.3.0', '1.2.5') → 1
    """
    parts1 = [int(x) for x in v1.split('.')]
    parts2 = [int(x) for x in v2.split('.')]

    for i in range(max(len(parts1), len(parts2))):
        p1 = parts1[i] if i < len(parts1) else 0
        p2 = parts2[i] if i < len(parts2) else 0

        if p1 < p2:
            return -1
        elif p1 > p2:
            return 1

    return 0

def is_newer_version(backend_version: str, current_version: str) -> bool:
    """
    Check if backend version is newer than current version

    Examples:
        is_newer_version('1.2.5', '1.2.3') → True
        is_newer_version('1.2.3', '1.2.3') → False
        is_newer_version('1.2.1', '1.2.3') → False
    """
    return compare_versions(backend_version, current_version) > 0
```

---

## Testing Version Endpoint

```bash
# Local Development
curl http://localhost:8000/api/v1/motor2/metadata/version/

# Expected Response:
{
  "version": "1.0.0",
  "last_updated": "2025-11-10T10:30:00.000000Z",
  "total_categories": 6,
  "total_subcategories": 60,
  "category_versions": {
    "PRIVATE": "1.0.0",
    "COMMERCIAL": "1.0.0",
    "PSV": "1.0.0",
    "MOTORCYCLE": "1.0.0",
    "TUKTUK": "1.0.0",
    "SPECIAL": "1.0.0"
  },
  "schema_version": "1.0"
}

# Python Test Script
python -c "
import requests
response = requests.get('http://localhost:8000/api/v1/motor2/metadata/version/')
print(f'Version: {response.json()[\"version\"]}')
print(f'Categories: {response.json()[\"total_categories\"]}')
"
```

---

## Frontend Integration

The frontend compares versions like this:

**File**: `frontend/services/Motor2StaticDataService.js`

```javascript
async _backgroundSync() {
  // Get backend version
  const backendMetadata = await DjangoAPIService.getInstance().makeRequest(
    '/api/v1/motor2/metadata/version/'
  );

  // Get frontend embedded version
  const currentVersion = MOTOR2_STATIC_METADATA.version; // From metadata.js

  console.log(`Backend: ${backendMetadata.version}, Frontend: ${currentVersion}`);

  // Compare
  if (this._isNewerVersion(backendMetadata.version, currentVersion)) {
    console.log('Update available! Downloading...');
    // Download updated data
  } else {
    console.log('Already up to date');
  }
}

_isNewerVersion(backendVersion, currentVersion) {
  const backend = backendVersion.split('.').map(Number); // [1, 2, 5]
  const current = currentVersion.split('.').map(Number); // [1, 2, 3]

  for (let i = 0; i < 3; i++) {
    if (backend[i] > current[i]) return true; // 5 > 3 → TRUE
    if (backend[i] < current[i]) return false;
  }
  return false; // Equal
}
```

---

## Summary

| Location                 | File                               | Purpose                 | Update Frequency           |
| ------------------------ | ---------------------------------- | ----------------------- | -------------------------- |
| **Backend Settings**     | `settings.py`                      | PRIMARY version storage | Manual (when data changes) |
| **Environment Variable** | `.env`                             | Production override     | Deployment                 |
| **Database Timestamp**   | `MotorCategory.updated_at`         | Auto-tracked            | Every edit in admin        |
| **API Endpoint**         | `/api/v1/motor2/metadata/version/` | Frontend checks this    | Every 24h (background)     |
| **Frontend Metadata**    | `metadata.js`                      | Embedded app version    | New app release            |

**Key Point**: Backend version in `settings.py` is the **source of truth**. Frontend compares its embedded version against this to decide if updates are needed.
