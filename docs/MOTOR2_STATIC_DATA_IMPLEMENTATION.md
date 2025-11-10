# Motor2 Static Data Implementation Guide

## Hybrid Static + Background Sync Pattern

**Status**: Implementation Plan  
**Date**: November 10, 2025  
**Pattern**: Option 2 - Hybrid Static + Background Sync ⭐⭐ BEST PRACTICE  
**Expected Impact**: 95% API reduction (2000 calls/day → 100 calls/day), 0ms initial load, offline capability

---

## 📋 Implementation Overview

This guide provides step-by-step instructions for implementing a **hybrid static data system** for Motor2 categories and subcategories. The system uses **embedded static files** for instant loading while maintaining **background synchronization** with the backend for automatic updates.

### What We're Building

```
┌─────────────────────────────────────────────────────────────┐
│  USER OPENS MOTOR INSURANCE                                 │
└───────────────┬─────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────┐
│  STATIC DATA SERVICE                                        │
│  ┌──────────────────────────────────────────────┐          │
│  │ 1. Load from embedded static files (0ms)     │          │
│  │    ✓ 6 categories instantly available        │          │
│  │    ✓ 60+ subcategories by category           │          │
│  └──────────────────────────────────────────────┘          │
│                                                              │
│  ┌──────────────────────────────────────────────┐          │
│  │ 2. Background: Check version from backend    │          │
│  │    - Current: v1.2.3                         │          │
│  │    - Backend: v1.2.5 (newer!)                │          │
│  └──────────────────────────────────────────────┘          │
│                                                              │
│  ┌──────────────────────────────────────────────┐          │
│  │ 3. Background: Fetch updated data            │          │
│  │    - Download new categories/subcategories   │          │
│  │    - Save to AsyncStorage                    │          │
│  │    - Update in-memory cache                  │          │
│  └──────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────┐
│  NEXT APP OPEN: Uses AsyncStorage (updated data)            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Success Criteria

Before starting implementation, understand these goals:

- ✅ **Instant Load**: Categories appear in 0ms (no loading spinner)
- ✅ **Offline Support**: App works without internet for category/subcategory selection
- ✅ **Auto-Updates**: New products automatically sync in background
- ✅ **Zero Breaking Changes**: Existing components work without modification
- ✅ **API Reduction**: 95% fewer API calls (2000/day → 100/day)
- ✅ **User Transparency**: Updates happen silently, no user action required

---

## 📁 Project Structure

```
frontend/
├── data/
│   └── motor2/
│       ├── categories.static.js          # 6 motor categories (PRIVATE, COMMERCIAL, etc.)
│       ├── subcategories/                # Subcategories by category
│       │   ├── PRIVATE.static.js         # 7 products (Third Party, Comprehensive, TOR)
│       │   ├── COMMERCIAL.static.js      # 15 products (tonnage-based)
│       │   ├── PSV.static.js             # 15 products (capacity-based)
│       │   ├── MOTORCYCLE.static.js      # 6 products
│       │   ├── TUKTUK.static.js          # 6 products
│       │   └── SPECIAL.static.js         # 11 products
│       └── metadata.js                   # Version tracking
│
├── services/
│   ├── Motor2StaticDataService.js        # NEW: Hybrid sync service
│   └── motorPricingService.js            # EXISTING: Keep for pricing comparisons
│
└── screens/
    └── quotations/Motor 2/
        └── MotorInsuranceFlow/
            └── CategorySelection/
                └── CategorySelectionStep.js  # MODIFY: Use static service
```

---

## 🚀 Implementation Steps

### **STEP 1: Export Static Data from Backend** ⏱️ 30 minutes

Create a Django management command to export current production data to static files.

#### 1.1 Create Management Command

**File**: `insurance-app/app/management/commands/export_motor2_static.py`

```python
from django.core.management.base import BaseCommand
from django.core.serializers import serialize
import json
import os
from app.models import MotorCategory, MotorSubcategory

class Command(BaseCommand):
    help = 'Export Motor2 categories and subcategories to static JSON files'

    def handle(self, *args, **options):
        output_dir = os.path.join(os.getcwd(), 'static_exports', 'motor2')
        os.makedirs(output_dir, exist_ok=True)

        # Export categories
        categories = MotorCategory.objects.filter(is_active=True).order_by('sort_order')
        categories_data = []

        for cat in categories:
            categories_data.append({
                'id': str(cat.id),
                'code': cat.code,
                'name': cat.name,
                'description': cat.description,
                'icon': cat.icon,
                'field_requirements': cat.field_requirements,
                'is_active': cat.is_active,
                'sort_order': cat.sort_order
            })

        # Write categories
        with open(os.path.join(output_dir, 'categories.json'), 'w') as f:
            json.dump(categories_data, f, indent=2)

        self.stdout.write(self.style.SUCCESS(f'Exported {len(categories_data)} categories'))

        # Export subcategories by category
        os.makedirs(os.path.join(output_dir, 'subcategories'), exist_ok=True)

        for cat in categories:
            subcategories = MotorSubcategory.objects.filter(
                category=cat,
                is_active=True
            ).order_by('sort_order')

            subcategories_data = []
            for subcat in subcategories:
                subcategories_data.append({
                    'id': str(subcat.id),
                    'subcategory_code': subcat.subcategory_code,
                    'name': subcat.name,
                    'description': subcat.description,
                    'category_code': cat.code,
                    'pricing_model': subcat.pricing_model,
                    'coverage_type': subcat.coverage_type,
                    'field_requirements': subcat.field_requirements,
                    'is_active': subcat.is_active,
                    'sort_order': subcat.sort_order
                })

            # Write subcategories for this category
            filename = f'{cat.code}.json'
            with open(os.path.join(output_dir, 'subcategories', filename), 'w') as f:
                json.dump(subcategories_data, f, indent=2)

            self.stdout.write(
                self.style.SUCCESS(f'Exported {len(subcategories_data)} subcategories for {cat.name}')
            )

        # Generate metadata
        metadata = {
            'version': '1.0.0',  # Increment this when data changes
            'exported_at': categories.first().updated_at.isoformat() if categories.exists() else None,
            'total_categories': len(categories_data),
            'total_subcategories': MotorSubcategory.objects.filter(is_active=True).count()
        }

        with open(os.path.join(output_dir, 'metadata.json'), 'w') as f:
            json.dump(metadata, f, indent=2)

        self.stdout.write(self.style.SUCCESS('✅ Export complete! Files in static_exports/motor2/'))
```

#### 1.2 Run Export Command

```powershell
# Navigate to backend
cd insurance-app

# Activate virtual environment (if needed)
.\.venv\Scripts\Activate.ps1

# Run export command
python manage.py export_motor2_static

# Expected output:
# Exported 6 categories
# Exported 7 subcategories for Private
# Exported 15 subcategories for Commercial
# Exported 15 subcategories for PSV
# Exported 6 subcategories for Motorcycle
# Exported 6 subcategories for TukTuk
# Exported 11 subcategories for Special
# ✅ Export complete! Files in static_exports/motor2/
```

#### 1.3 Verify Exported Files

```powershell
# Check exported files
ls insurance-app/static_exports/motor2/

# Expected structure:
# categories.json
# metadata.json
# subcategories/
#   ├── PRIVATE.json
#   ├── COMMERCIAL.json
#   ├── PSV.json
#   ├── MOTORCYCLE.json
#   ├── TUKTUK.json
#   └── SPECIAL.json
```

---

### **STEP 2: Convert JSON to JavaScript Static Files** ⏱️ 20 minutes

Transform exported JSON into importable JavaScript modules for React Native.

#### 2.1 Create JavaScript Static Files

**File**: `frontend/data/motor2/categories.static.js`

```javascript
/**
 * Motor Insurance Categories - Static Data
 * Version: 1.0.0
 * Last Updated: 2025-11-10
 *
 * DO NOT EDIT MANUALLY
 * Generated from backend via: python manage.py export_motor2_static
 *
 * To update:
 * 1. Run export command in backend
 * 2. Copy JSON from static_exports/motor2/categories.json
 * 3. Paste into MOTOR_CATEGORIES array below
 * 4. Update version in metadata.js
 */

export const MOTOR_CATEGORIES = [
  {
    id: "02a099fd-e88b-4b61-8f64-0e3eb7ee173f",
    code: "PRIVATE",
    name: "Private",
    description: "Personal vehicles for private use",
    icon: "🚗",
    field_requirements: {
      core_fields: ["registration", "cover_date"],
    },
    is_active: true,
    sort_order: 1,
  },
  {
    id: "15b8c3e7-2d4a-4f9c-8e6b-1a3d5c7f9e2b",
    code: "COMMERCIAL",
    name: "Commercial",
    description: "Commercial vehicles and fleet",
    icon: "🚚",
    field_requirements: {
      core_fields: ["registration", "cover_date", "tonnage"],
    },
    is_active: true,
    sort_order: 2,
  },
  {
    id: "28c4d5f8-3e5b-4a1d-9f7c-2b4e6d8a1c3e",
    code: "PSV",
    name: "PSV (Public Service)",
    description: "Buses, matatus, and public transport",
    icon: "🚌",
    field_requirements: {
      core_fields: ["registration", "cover_date", "passenger_capacity"],
    },
    is_active: true,
    sort_order: 3,
  },
  {
    id: "3a5d6e9f-4b6c-5c2e-1a8d-3c5f7e9b2d4a",
    code: "MOTORCYCLE",
    name: "Motorcycle",
    description: "Motorcycles and boda bodas",
    icon: "🏍️",
    field_requirements: {
      core_fields: ["registration", "cover_date", "engine_capacity"],
    },
    is_active: true,
    sort_order: 4,
  },
  {
    id: "4b6e7f1a-5c7d-6d3f-2b9e-4d6a8f1c3e5b",
    code: "TUKTUK",
    name: "TukTuk",
    description: "Three-wheelers and auto-rickshaws",
    icon: "🛺",
    field_requirements: {
      core_fields: ["registration", "cover_date", "capacity"],
    },
    is_active: true,
    sort_order: 5,
  },
  {
    id: "5c7f8a2b-6d8e-7e4a-3c1f-5e7b9a2d4f6c",
    code: "SPECIAL",
    name: "Special Classes",
    description: "Agricultural, institutional, and special vehicles",
    icon: "🚜",
    field_requirements: {
      core_fields: ["registration", "cover_date", "vehicle_type"],
    },
    is_active: true,
    sort_order: 6,
  },
];

export default MOTOR_CATEGORIES;
```

**File**: `frontend/data/motor2/subcategories/PRIVATE.static.js`

```javascript
/**
 * Private Vehicle Subcategories - Static Data
 * Version: 1.0.0
 * Last Updated: 2025-11-10
 *
 * DO NOT EDIT MANUALLY
 * Generated from backend via: python manage.py export_motor2_static
 */

export const PRIVATE_SUBCATEGORIES = [
  {
    id: "aa85d49e-06a2-40ec-9a22-e09b453f8066",
    subcategory_code: "PRIVATE_THIRD_PARTY",
    name: "Third Party",
    description: "Basic liability coverage",
    category_code: "PRIVATE",
    pricing_model: "FIXED",
    coverage_type: "THIRD_PARTY",
    field_requirements: {
      core_fields: ["registration", "cover_date"],
      optional_fields: ["financial_interest"],
    },
    is_active: true,
    sort_order: 1,
  },
  {
    id: "bb96e5af-17b3-51fd-a33-f1ab564g9177",
    subcategory_code: "PRIVATE_COMPREHENSIVE",
    name: "Comprehensive",
    description: "Full coverage including theft and damage",
    category_code: "PRIVATE",
    pricing_model: "BRACKET",
    coverage_type: "COMPREHENSIVE",
    field_requirements: {
      core_fields: [
        "registration",
        "cover_date",
        "sum_insured",
        "year",
        "make",
        "model",
      ],
      optional_fields: ["financial_interest", "vehicle_modifications"],
    },
    is_active: true,
    sort_order: 2,
  },
  {
    id: "cc17f6ba-28c4-62ae-b44-a2bc675h1288",
    subcategory_code: "PRIVATE_TOR",
    name: "Time on Risk",
    description: "Temporary cover for vehicle movement",
    category_code: "PRIVATE",
    pricing_model: "FIXED",
    coverage_type: "TOR",
    field_requirements: {
      core_fields: ["registration", "cover_date", "destination"],
      optional_fields: ["travel_distance"],
    },
    is_active: true,
    sort_order: 3,
  },
  // ... remaining 4 subcategories (TOR_WITH_PLL, WINDSCREEN_EXTENSION, etc.)
];

export default PRIVATE_SUBCATEGORIES;
```

#### 2.2 Create Metadata File

**File**: `frontend/data/motor2/metadata.js`

```javascript
/**
 * Motor2 Static Data Metadata
 * Tracks version for sync purposes
 */

export const MOTOR2_STATIC_METADATA = {
  version: "1.0.0",
  lastUpdated: "2025-11-10T00:00:00.000Z",
  totalCategories: 6,
  totalSubcategories: 60,

  // Category version tracking
  categoryVersions: {
    PRIVATE: "1.0.0",
    COMMERCIAL: "1.0.0",
    PSV: "1.0.0",
    MOTORCYCLE: "1.0.0",
    TUKTUK: "1.0.0",
    SPECIAL: "1.0.0",
  },
};

export default MOTOR2_STATIC_METADATA;
```

**⚠️ CRITICAL**: Repeat step 2.1 for all remaining subcategory files:

- `COMMERCIAL.static.js`
- `PSV.static.js`
- `MOTORCYCLE.static.js`
- `TUKTUK.static.js`
- `SPECIAL.static.js`

Use the JSON from `static_exports/motor2/subcategories/` directory.

---

### **STEP 3: Build Hybrid Static Data Service** ⏱️ 45 minutes

Create the core service that manages static data with background sync.

**File**: `frontend/services/Motor2StaticDataService.js`

```javascript
/**
 * Motor2 Static Data Service - Hybrid Sync Pattern
 *
 * Architecture:
 * 1. Instant load from embedded static files (0ms)
 * 2. Background version check with backend
 * 3. Auto-update from backend if new version available
 * 4. Cache updated data in AsyncStorage for next app open
 *
 * API Reduction: 95% (2000 calls/day → 100 calls/day)
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { MOTOR_CATEGORIES } from "../data/motor2/categories.static";
import { MOTOR2_STATIC_METADATA } from "../data/motor2/metadata";
import { DjangoAPIService } from "./DjangoAPIService";

// Import all subcategory files
import PRIVATE_SUBCATEGORIES from "../data/motor2/subcategories/PRIVATE.static";
import COMMERCIAL_SUBCATEGORIES from "../data/motor2/subcategories/COMMERCIAL.static";
import PSV_SUBCATEGORIES from "../data/motor2/subcategories/PSV.static";
import MOTORCYCLE_SUBCATEGORIES from "../data/motor2/subcategories/MOTORCYCLE.static";
import TUKTUK_SUBCATEGORIES from "../data/motor2/subcategories/TUKTUK.static";
import SPECIAL_SUBCATEGORIES from "../data/motor2/subcategories/SPECIAL.static";

const SUBCATEGORIES_MAP = {
  PRIVATE: PRIVATE_SUBCATEGORIES,
  COMMERCIAL: COMMERCIAL_SUBCATEGORIES,
  PSV: PSV_SUBCATEGORIES,
  MOTORCYCLE: MOTORCYCLE_SUBCATEGORIES,
  TUKTUK: TUKTUK_SUBCATEGORIES,
  SPECIAL: SPECIAL_SUBCATEGORIES,
};

// Cache keys
const CACHE_KEYS = {
  CATEGORIES: "MOTOR2_CATEGORIES_CACHE",
  SUBCATEGORIES: "MOTOR2_SUBCATEGORIES_CACHE",
  METADATA: "MOTOR2_METADATA_CACHE",
  LAST_SYNC: "MOTOR2_LAST_SYNC",
};

// Sync interval: 24 hours
const SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000;

class Motor2StaticDataService {
  constructor() {
    this._memoryCache = {
      categories: null,
      subcategories: {},
      metadata: null,
    };
    this._syncInProgress = false;
  }

  /**
   * Get Categories - Instant Load with Background Sync
   *
   * Flow:
   * 1. Return static data immediately (0ms)
   * 2. Check AsyncStorage for updated data
   * 3. Background: Check backend version
   * 4. Background: Update if needed
   */
  async getCategories(options = {}) {
    const { forceRefresh = false, skipBackgroundSync = false } = options;

    // STEP 1: Check memory cache (instant)
    if (this._memoryCache.categories && !forceRefresh) {
      console.log("[Motor2Static] Categories from memory cache (0ms)");

      // Background sync (non-blocking)
      if (!skipBackgroundSync) {
        this._backgroundSync("categories").catch((err) =>
          console.warn("[Motor2Static] Background sync failed:", err.message)
        );
      }

      return this._memoryCache.categories;
    }

    // STEP 2: Check AsyncStorage (fast ~10ms)
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEYS.CATEGORIES);
      if (cached && !forceRefresh) {
        const parsed = JSON.parse(cached);
        this._memoryCache.categories = parsed;
        console.log("[Motor2Static] Categories from AsyncStorage (~10ms)");

        // Background sync
        if (!skipBackgroundSync) {
          this._backgroundSync("categories").catch((err) =>
            console.warn("[Motor2Static] Background sync failed:", err.message)
          );
        }

        return parsed;
      }
    } catch (error) {
      console.warn("[Motor2Static] AsyncStorage read failed:", error.message);
    }

    // STEP 3: Use embedded static data (fallback)
    console.log("[Motor2Static] Categories from static files (fallback)");
    this._memoryCache.categories = MOTOR_CATEGORIES;

    // Cache to AsyncStorage for next time
    try {
      await AsyncStorage.setItem(
        CACHE_KEYS.CATEGORIES,
        JSON.stringify(MOTOR_CATEGORIES)
      );
    } catch (error) {
      console.warn("[Motor2Static] AsyncStorage write failed:", error.message);
    }

    // Background sync
    if (!skipBackgroundSync) {
      this._backgroundSync("categories").catch((err) =>
        console.warn("[Motor2Static] Background sync failed:", err.message)
      );
    }

    return MOTOR_CATEGORIES;
  }

  /**
   * Get Subcategories by Category - Instant Load
   */
  async getSubcategoriesByCategory(categoryCode, options = {}) {
    const { forceRefresh = false, skipBackgroundSync = false } = options;

    // STEP 1: Check memory cache
    if (this._memoryCache.subcategories[categoryCode] && !forceRefresh) {
      console.log(
        `[Motor2Static] Subcategories for ${categoryCode} from memory cache (0ms)`
      );

      // Background sync
      if (!skipBackgroundSync) {
        this._backgroundSync("subcategories", categoryCode).catch((err) =>
          console.warn("[Motor2Static] Background sync failed:", err.message)
        );
      }

      return this._memoryCache.subcategories[categoryCode];
    }

    // STEP 2: Check AsyncStorage
    try {
      const cacheKey = `${CACHE_KEYS.SUBCATEGORIES}_${categoryCode}`;
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached && !forceRefresh) {
        const parsed = JSON.parse(cached);
        this._memoryCache.subcategories[categoryCode] = parsed;
        console.log(
          `[Motor2Static] Subcategories for ${categoryCode} from AsyncStorage (~10ms)`
        );

        // Background sync
        if (!skipBackgroundSync) {
          this._backgroundSync("subcategories", categoryCode).catch((err) =>
            console.warn("[Motor2Static] Background sync failed:", err.message)
          );
        }

        return parsed;
      }
    } catch (error) {
      console.warn("[Motor2Static] AsyncStorage read failed:", error.message);
    }

    // STEP 3: Use embedded static data
    const staticData = SUBCATEGORIES_MAP[categoryCode] || [];
    console.log(
      `[Motor2Static] Subcategories for ${categoryCode} from static files (fallback)`
    );
    this._memoryCache.subcategories[categoryCode] = staticData;

    // Cache to AsyncStorage
    try {
      const cacheKey = `${CACHE_KEYS.SUBCATEGORIES}_${categoryCode}`;
      await AsyncStorage.setItem(cacheKey, JSON.stringify(staticData));
    } catch (error) {
      console.warn("[Motor2Static] AsyncStorage write failed:", error.message);
    }

    // Background sync
    if (!skipBackgroundSync) {
      this._backgroundSync("subcategories", categoryCode).catch((err) =>
        console.warn("[Motor2Static] Background sync failed:", err.message)
      );
    }

    return staticData;
  }

  /**
   * Background Sync - Non-blocking Version Check & Update
   *
   * Flow:
   * 1. Check last sync time (avoid excessive checks)
   * 2. Call backend /api/v1/motor2/metadata/version/
   * 3. Compare versions
   * 4. If newer, fetch updated data
   * 5. Save to AsyncStorage + memory cache
   */
  async _backgroundSync(dataType, categoryCode = null) {
    // Prevent concurrent syncs
    if (this._syncInProgress) {
      console.log("[Motor2Static] Sync already in progress, skipping");
      return;
    }

    // Check last sync time
    try {
      const lastSyncStr = await AsyncStorage.getItem(CACHE_KEYS.LAST_SYNC);
      if (lastSyncStr) {
        const lastSync = parseInt(lastSyncStr, 10);
        const timeSinceSync = Date.now() - lastSync;

        if (timeSinceSync < SYNC_INTERVAL_MS) {
          console.log(
            `[Motor2Static] Sync skipped - last sync ${Math.round(
              timeSinceSync / 1000 / 60
            )} minutes ago`
          );
          return;
        }
      }
    } catch (error) {
      console.warn("[Motor2Static] Last sync check failed:", error.message);
    }

    this._syncInProgress = true;

    try {
      // STEP 1: Get backend version
      const backendMetadata = await DjangoAPIService.getInstance().makeRequest(
        "/api/v1/motor2/metadata/version/",
        { method: "GET", _suppressErrorLog: true }
      );

      const currentVersion = MOTOR2_STATIC_METADATA.version;
      const backendVersion = backendMetadata.version;

      console.log(
        `[Motor2Static] Version check - Current: ${currentVersion}, Backend: ${backendVersion}`
      );

      // STEP 2: Compare versions
      if (this._isNewerVersion(backendVersion, currentVersion)) {
        console.log(
          `[Motor2Static] New version available (${backendVersion}), updating...`
        );

        // STEP 3: Fetch updated data
        if (dataType === "categories") {
          const updated = await DjangoAPIService.getInstance().makeRequest(
            "/api/v1/motor2/categories/",
            { method: "GET" }
          );

          // STEP 4: Save to caches
          this._memoryCache.categories = updated.categories;
          await AsyncStorage.setItem(
            CACHE_KEYS.CATEGORIES,
            JSON.stringify(updated.categories)
          );
          console.log("[Motor2Static] Categories updated from backend");
        }

        if (dataType === "subcategories" && categoryCode) {
          const updated = await DjangoAPIService.getInstance().makeRequest(
            `/api/v1/motor2/subcategories/?category=${categoryCode}`,
            { method: "GET" }
          );

          // STEP 4: Save to caches
          this._memoryCache.subcategories[categoryCode] = updated.subcategories;
          const cacheKey = `${CACHE_KEYS.SUBCATEGORIES}_${categoryCode}`;
          await AsyncStorage.setItem(
            cacheKey,
            JSON.stringify(updated.subcategories)
          );
          console.log(
            `[Motor2Static] Subcategories for ${categoryCode} updated from backend`
          );
        }

        // Update last sync time
        await AsyncStorage.setItem(CACHE_KEYS.LAST_SYNC, Date.now().toString());
      } else {
        console.log("[Motor2Static] Static data is up to date");

        // Update last sync time even if no update needed
        await AsyncStorage.setItem(CACHE_KEYS.LAST_SYNC, Date.now().toString());
      }
    } catch (error) {
      console.warn("[Motor2Static] Background sync error:", error.message);
      // Fail silently - static data still works
    } finally {
      this._syncInProgress = false;
    }
  }

  /**
   * Compare semantic versions (e.g., "1.2.5" > "1.2.3")
   */
  _isNewerVersion(backendVersion, currentVersion) {
    const backend = backendVersion.split(".").map(Number);
    const current = currentVersion.split(".").map(Number);

    for (let i = 0; i < 3; i++) {
      if (backend[i] > current[i]) return true;
      if (backend[i] < current[i]) return false;
    }
    return false; // Equal versions
  }

  /**
   * Force refresh all data from backend (manual update)
   */
  async forceUpdate() {
    console.log("[Motor2Static] Force update initiated");
    this._memoryCache = { categories: null, subcategories: {}, metadata: null };
    await AsyncStorage.multiRemove([
      CACHE_KEYS.CATEGORIES,
      CACHE_KEYS.LAST_SYNC,
    ]);

    // Fetch fresh data
    await this.getCategories({ forceRefresh: true, skipBackgroundSync: true });

    console.log("[Motor2Static] Force update complete");
  }

  /**
   * Clear all cached data (troubleshooting)
   */
  async clearCache() {
    console.log("[Motor2Static] Clearing all cached data");
    this._memoryCache = { categories: null, subcategories: {}, metadata: null };
    await AsyncStorage.multiRemove([
      CACHE_KEYS.CATEGORIES,
      CACHE_KEYS.SUBCATEGORIES,
      CACHE_KEYS.METADATA,
      CACHE_KEYS.LAST_SYNC,
    ]);
  }
}

// Singleton instance
let instance = null;

export const getMotor2StaticService = () => {
  if (!instance) {
    instance = new Motor2StaticDataService();
  }
  return instance;
};

export default Motor2StaticDataService;
```

---

### **STEP 4: Add Backend Version Endpoint** ⏱️ 15 minutes

Create API endpoint for version checking.

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

    Frontend uses this to check if updates are available
    """

    def get(self, request):
        # Get version from settings or calculate from last update
        version = getattr(settings, 'MOTOR2_STATIC_VERSION', '1.0.0')

        # Get last updated timestamp from most recent category/subcategory change
        categories = MotorCategory.objects.filter(is_active=True).order_by('-updated_at')
        subcategories = MotorSubcategory.objects.filter(is_active=True).order_by('-updated_at')

        last_updated = None
        if categories.exists():
            last_updated = categories.first().updated_at
        if subcategories.exists() and subcategories.first().updated_at > (last_updated or datetime.min):
            last_updated = subcategories.first().updated_at

        return Response({
            'version': version,
            'last_updated': last_updated.isoformat() if last_updated else None,
            'total_categories': categories.count(),
            'total_subcategories': subcategories.count(),
            'category_versions': {
                cat.code: version for cat in categories
            }
        }, status=status.HTTP_200_OK)
```

**File**: `insurance-app/app/urls.py` (add route)

```python
from django.urls import path
from app.views.motor2_metadata_views import Motor2MetadataView

urlpatterns = [
    # ... existing routes
    path('api/v1/motor2/metadata/version/', Motor2MetadataView.as_view(), name='motor2-metadata-version'),
]
```

**File**: `insurance-app/insurance-app/settings.py` (add config)

```python
# Motor2 Static Data Version
# Increment this when categories/subcategories change
MOTOR2_STATIC_VERSION = '1.0.0'
```

---

### **STEP 5: Update CategorySelectionStep** ⏱️ 15 minutes

Modify the category selection screen to use static service.

**File**: `frontend/screens/quotations/Motor 2/MotorInsuranceFlow/CategorySelection/CategorySelectionStep.js`

**BEFORE:**

```javascript
import { motorPricingService } from "../../../../services/motorPricingService";

useEffect(() => {
  loadCategories();
}, []);

const loadCategories = async () => {
  setLoading(true);
  try {
    const data = await motorPricingService.getCategories();
    setCategories(data);
  } catch (error) {
    console.error("Failed to load categories:", error);
    Alert.alert("Error", "Failed to load motor insurance categories");
  } finally {
    setLoading(false);
  }
};
```

**AFTER:**

```javascript
import { getMotor2StaticService } from "../../../../services/Motor2StaticDataService";

useEffect(() => {
  loadCategories();
}, []);

const loadCategories = async () => {
  // NO loading state needed - instant load from static files
  try {
    const staticService = getMotor2StaticService();
    const data = await staticService.getCategories();
    setCategories(data);
    // Background sync happens automatically
  } catch (error) {
    console.error("Failed to load categories:", error);
    Alert.alert("Error", "Failed to load motor insurance categories");
  }
};
```

**Changes:**

1. Import `getMotor2StaticService` instead of `motorPricingService`
2. Remove `setLoading(true)` and `setLoading(false)` - no spinner needed
3. Call `staticService.getCategories()` - returns instantly
4. Background sync happens automatically (non-blocking)

---

### **STEP 6: Update SubcategorySelectionModal** ⏱️ 10 minutes

**File**: Wherever subcategories are loaded (e.g., `SubcategorySelectionModal.js`)

**BEFORE:**

```javascript
const loadSubcategories = async (categoryCode) => {
  setLoading(true);
  try {
    const data = await motorPricingService.getSubcategoriesByCategory(
      categoryCode
    );
    setSubcategories(data);
  } catch (error) {
    console.error("Failed to load subcategories:", error);
  } finally {
    setLoading(false);
  }
};
```

**AFTER:**

```javascript
const loadSubcategories = async (categoryCode) => {
  try {
    const staticService = getMotor2StaticService();
    const data = await staticService.getSubcategoriesByCategory(categoryCode);
    setSubcategories(data);
    // Background sync happens automatically
  } catch (error) {
    console.error("Failed to load subcategories:", error);
  }
};
```

---

### **STEP 7: Testing & Validation** ⏱️ 30 minutes

#### 7.1 Test Instant Load

```javascript
// Test in CategorySelectionStep
console.time("Load Categories");
const data = await staticService.getCategories();
console.timeEnd("Load Categories"); // Should show: Load Categories: 0ms

console.log("Categories:", data.length); // Should show: 6
```

**Expected Output:**

```
[Motor2Static] Categories from static files (fallback)
Load Categories: 0ms
Categories: 6
```

#### 7.2 Test Background Sync

```javascript
// After first load, check console for background sync
// Expected (if version is same):
[Motor2Static] Version check - Current: 1.0.0, Backend: 1.0.0
[Motor2Static] Static data is up to date

// Expected (if backend has newer version):
[Motor2Static] Version check - Current: 1.0.0, Backend: 1.1.0
[Motor2Static] New version available (1.1.0), updating...
[Motor2Static] Categories updated from backend
```

#### 7.3 Test Offline Mode

```powershell
# Disable network in emulator/device
# App should still load categories instantly from static files
```

**Expected:**

- Categories load in 0ms
- No loading spinner
- Background sync fails silently (warning in console)
- User sees no errors

#### 7.4 Test Force Update

```javascript
// Add button in Settings/Debug screen
const handleForceUpdate = async () => {
  const staticService = getMotor2StaticService();
  await staticService.forceUpdate();
  Alert.alert("Success", "Motor2 data updated from backend");
};
```

#### 7.5 Test Version Increment

**Backend:**

```python
# insurance-app/insurance-app/settings.py
MOTOR2_STATIC_VERSION = '1.1.0'  # Increment version

# Add new subcategory in Django admin
# Background sync should detect and update
```

**Frontend:**

```
[Motor2Static] Version check - Current: 1.0.0, Backend: 1.1.0
[Motor2Static] New version available (1.1.0), updating...
[Motor2Static] Categories updated from backend
```

---

### **STEP 8: Monitoring & Metrics** ⏱️ 20 minutes

#### 8.1 Add Analytics Events

**File**: `frontend/services/Motor2StaticDataService.js` (add to methods)

```javascript
// In getCategories()
await Analytics.logEvent("motor2_static_load", {
  source: "memory" | "async_storage" | "static_files",
  load_time_ms: performance.now() - startTime,
});

// In _backgroundSync()
await Analytics.logEvent("motor2_background_sync", {
  data_type: dataType,
  version_current: currentVersion,
  version_backend: backendVersion,
  update_performed: this._isNewerVersion(backendVersion, currentVersion),
});
```

#### 8.2 Monitor API Call Reduction

**Backend Django Admin:**

```python
# Track API calls to /api/v1/motor2/categories/
# Before: ~2000 calls/day (1 per quote x 2000 quotes)
# After: ~100 calls/day (background syncs only)
# Reduction: 95%
```

#### 8.3 Monitor Load Performance

**React Native Performance Monitor:**

```javascript
// Measure render time in CategorySelectionStep
import { PerformanceObserver } from "react-native-performance";

const observer = new PerformanceObserver((list) => {
  const entries = list.getEntries();
  console.log("Category render time:", entries[0].duration, "ms");
});
observer.observe({ entryTypes: ["measure"] });

performance.mark("category-start");
// ... load categories
performance.mark("category-end");
performance.measure("category-load", "category-start", "category-end");

// Expected: <5ms (was 2000-3000ms before)
```

---

## 🎯 Success Validation Checklist

After implementation, verify these outcomes:

- [ ] **Categories load in <5ms** (was 2-3 seconds)
- [ ] **No loading spinner** on category selection
- [ ] **Offline mode works** - categories available without internet
- [ ] **Background sync runs** - version check logged every 24h
- [ ] **Updates applied** - new products appear after backend version increment
- [ ] **API calls reduced by 95%** - from 2000/day to ~100/day
- [ ] **No breaking changes** - existing Motor2 flow works unchanged
- [ ] **AsyncStorage caching** - updated data persists across app restarts
- [ ] **Memory cache active** - subsequent loads in same session are instant
- [ ] **Console logs clean** - no errors, only info logs

---

## 🔄 Future Maintenance Workflow

### When Backend Data Changes (New Product/Category)

```bash
# 1. Add product in Django admin
# 2. Increment version
MOTOR2_STATIC_VERSION = '1.1.0'  # in settings.py

# 3. Export updated data
python manage.py export_motor2_static

# 4. Copy JSON to frontend static files
# frontend/data/motor2/categories.static.js
# frontend/data/motor2/subcategories/*.static.js

# 5. Update metadata version
# frontend/data/motor2/metadata.js
version: '1.1.0'

# 6. Test in app
# Categories should auto-update via background sync within 24h
# Or force update via debug button

# 7. Deploy frontend
# New app version has updated static files
```

### Rollback Strategy

```javascript
// If bad data deployed, rollback:
const staticService = getMotor2StaticService();
await staticService.clearCache(); // Clears AsyncStorage
await staticService.forceUpdate(); // Fetches from backend

// Backend version takes precedence
// Static files are fallback only
```

---

## 📊 Expected Performance Impact

| Metric                  | Before (API Calls) | After (Static Hybrid) | Improvement    |
| ----------------------- | ------------------ | --------------------- | -------------- |
| **Initial Load Time**   | 2-3 seconds        | 0ms                   | 100% faster    |
| **API Calls per Quote** | 2 calls            | 0 calls\*             | 100% reduction |
| **Daily API Calls**     | 2000 calls         | ~100 calls            | 95% reduction  |
| **Offline Support**     | ❌ No              | ✅ Yes                | New capability |
| **Background Sync**     | N/A                | Every 24h             | Auto-updates   |
| **Bundle Size**         | +0 KB              | +8 KB                 | Negligible     |
| **User Wait Time**      | 2-3s spinner       | 0s instant            | Perfect UX     |

\*Background sync calls happen once per day, not per quote

---

## 🚨 Troubleshooting

### Issue: Categories not loading

**Diagnosis:**

```javascript
const staticService = getMotor2StaticService();
const data = await staticService.getCategories({ forceRefresh: true });
console.log("Categories loaded:", data.length);
```

**Solution:** Check static files exist in `frontend/data/motor2/`

### Issue: Background sync not working

**Diagnosis:**

```javascript
// Check last sync time
const lastSync = await AsyncStorage.getItem("MOTOR2_LAST_SYNC");
console.log("Last sync:", new Date(parseInt(lastSync)));

// Check backend endpoint
const response = await DjangoAPIService.getInstance().makeRequest(
  "/api/v1/motor2/metadata/version/"
);
console.log("Backend version:", response.version);
```

**Solution:** Verify backend endpoint exists and returns version

### Issue: Updates not applying

**Diagnosis:**

```javascript
// Check version comparison
const current = "1.0.0";
const backend = "1.1.0";
const isNewer = staticService._isNewerVersion(backend, current);
console.log("Is newer version?", isNewer); // Should be true
```

**Solution:** Verify version increment format (semantic versioning)

---

## 📝 Commit Message Template

```
feat(motor2): Implement hybrid static data service for categories/subcategories

WHAT CHANGED:
- Added Motor2StaticDataService with instant load + background sync
- Created static data files for 6 categories + 60 subcategories
- Added backend /api/v1/motor2/metadata/version/ endpoint
- Updated CategorySelectionStep to use static service (removed loading spinner)
- Updated SubcategorySelectionModal to use static service

WHY:
- Reduce API calls from 2000/day to 100/day (95% reduction)
- Instant category load (0ms vs 2-3 seconds)
- Enable offline support for rural agents
- Auto-update via background sync every 24h

TESTING:
✅ Categories load instantly from static files
✅ Background sync detects version changes
✅ Offline mode works (no network required)
✅ Force update mechanism functional
✅ API call reduction verified (95%)

FILES CHANGED:
- frontend/services/Motor2StaticDataService.js (NEW)
- frontend/data/motor2/*.static.js (NEW - 7 files)
- insurance-app/app/views/motor2_metadata_views.py (NEW)
- frontend/screens/.../CategorySelectionStep.js (MODIFIED)

IMPACT:
- Bundle size: +8KB (negligible)
- Performance: 100% faster initial load
- UX: No loading spinner, instant response
- Network: 95% fewer API calls
```

---

## 🎓 Learning Resources

**React Native Performance:**

- [Performance Optimization Guide](https://reactnative.dev/docs/performance)
- [AsyncStorage Best Practices](https://react-native-async-storage.github.io/async-storage/)

**Caching Strategies:**

- [Cache-First Pattern](https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook)
- [Stale-While-Revalidate](https://web.dev/stale-while-revalidate/)

**Versioning:**

- [Semantic Versioning](https://semver.org/)
- [API Versioning Best Practices](https://restfulapi.net/versioning/)

---

## ✅ Implementation Complete!

Once all steps are completed:

1. **Test thoroughly** (all 8 test scenarios)
2. **Monitor metrics** (load time, API calls, sync frequency)
3. **Update documentation** (README, CHANGELOG)
4. **Train team** on maintenance workflow
5. **Deploy to production** with gradual rollout
6. **Celebrate** 🎉 - You've just achieved 95% API reduction!

**Questions?** Review this guide or check troubleshooting section.

**Next Steps:** Apply this pattern to other static data (underwriters, add-ons, etc.)
