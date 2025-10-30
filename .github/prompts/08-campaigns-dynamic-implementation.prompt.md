# Dynamic Campaigns Implementation Prompt

**Date**: October 15, 2025  
**Status**: Planning  
**Priority**: Medium  
**Dependencies**: Campaign models exist, Admin setup complete

---

## 🎯 Objective

Replace static campaign banners in HomeScreen with dynamic campaigns fetched from the Django backend. Implement full CRUD operations, analytics tracking, and role-based targeting to enable admin-controlled promotional content across the PataBima mobile app.

---

## 📊 Current State Analysis

### ✅ What We Have

#### Backend (Complete)

- **Models** (insurance-app/app/models.py):
  - `Campaign` - Main campaign model with status, targeting, scheduling, performance tracking
  - `CampaignInteraction` - Track impressions, clicks, conversions, dismissals
  - `CampaignSchedule` - Recurring campaign scheduling with timezone support
- **Admin Interface** (insurance-app/app/campaign_admin.py):

  - `CampaignAdmin` - Full admin with status management, performance metrics
  - `CampaignInteractionAdmin` - Interaction tracking
  - `CampaignScheduleAdmin` - Schedule management
  - Custom admin actions: activate, pause, clone campaigns
  - Admin views: preview, analytics dashboard, performance dashboard

- **Database**:
  - Migration 0009 created Campaign tables
  - Fields include: name, description, campaign_type, status, targeting (roles, regions, age), content (title, message, image_url, call_to_action, action_url), scheduling (start/end dates), budget, performance metrics (impressions, clicks, conversions, spent)

#### Frontend (Needs Implementation)

- **Current Static Implementation** (frontend/screens/main/HomeScreen.js):
  ```javascript
  const campaigns = [
    {
      id: 1,
      title: "Contractor's Risk Insurance",
      description:
        "Comprehensive coverage for construction and contractor risks",
      category: "Construction",
      image: "https://patabima.com/assets/images/CAR.jpeg",
      url: "https://patabima.com/commercial-insurance",
    },
    // ... 4 more hardcoded campaigns
  ];
  ```

### ❌ What's Missing

1. **Backend API Endpoints** - No REST API for campaigns
2. **Serializers** - No DRF serializers for Campaign models
3. **ViewSets** - No ViewSet/views for campaign CRUD
4. **URL Routing** - No public API routes registered
5. **Permissions Class** - Need `IsStaffOrAdmin` permission for admin endpoints
6. **Frontend Service** - No campaigns API service layer
7. **Frontend State** - No campaign state management
8. **Interaction Tracking** - No frontend → backend analytics flow
9. **Image Upload** - No campaign image upload/management
10. **Agent/Customer Admin** - No dedicated admin interfaces for creating agents/customers securely

---

## 🏗️ Implementation Architecture

### Backend Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Django Backend                      │
├─────────────────────────────────────────────────────┤
│                                                       │
│  Models (✅ Complete)                                │
│  ├── Campaign                                        │
│  ├── CampaignInteraction                             │
│  └── CampaignSchedule                                │
│                                                       │
│  Serializers (❌ To Create)                          │
│  ├── CampaignSerializer (list/detail)                │
│  ├── CampaignInteractionSerializer                   │
│  └── CampaignAnalyticsSerializer (read-only)         │
│                                                       │
│  ViewSets (❌ To Create)                             │
│  ├── PublicCampaignViewSet                           │
│  │   ├── list (active campaigns for user role)       │
│  │   ├── retrieve (single campaign)                  │
│  │   └── track_interaction (POST impression/click)   │
│  │                                                    │
│  └── AdminCampaignViewSet (staff only)               │
│      ├── Full CRUD                                   │
│      ├── Analytics endpoint                          │
│      └── Publish/pause actions                       │
│                                                       │
│  URL Routes (❌ To Create)                           │
│  ├── /api/v1/public_app/campaigns/                   │
│  ├── /api/v1/public_app/campaigns/<id>/              │
│  ├── /api/v1/public_app/campaigns/<id>/track/        │
│  └── /api/v1/admin/campaigns/ (admin endpoints)      │
│                                                       │
└─────────────────────────────────────────────────────┘
```

### Frontend Architecture

```
┌─────────────────────────────────────────────────────┐
│              React Native Frontend                   │
├─────────────────────────────────────────────────────┤
│                                                       │
│  Services (❌ To Create)                             │
│  └── frontend/services/campaigns.js                  │
│      ├── getActiveCampaigns(userRole)                │
│      ├── trackImpression(campaignId)                 │
│      ├── trackClick(campaignId)                      │
│      └── trackConversion(campaignId)                 │
│                                                       │
│  State Management (❌ To Implement)                  │
│  └── AppDataContext or HomeScreen local state        │
│                                                       │
│  UI Components (⚠️ To Refactor)                      │
│  ├── HomeScreen.js (replace static with API)         │
│  ├── CampaignCard (extract reusable component)       │
│  └── CampaignAnalytics (track visibility)            │
│                                                       │
│  Features (❌ To Implement)                          │
│  ├── Auto-refresh every 5 minutes                    │
│  ├── Impression tracking (on view)                   │
│  ├── Click tracking (on press)                       │
│  ├── Deep linking to campaign URLs                   │
│  └── Cached campaigns with TTL                       │
│                                                       │
└─────────────────────────────────────────────────────┘
```

---

## 📋 Implementation Steps

### Phase 0: Security & Permissions Setup (30 mins)

#### Step 0.1: Create Permissions Classes (10 mins)

**File**: `insurance-app/app/permissions.py` (create new file)

```python
from rest_framework import permissions

class IsStaffOrAdmin(permissions.BasePermission):
    """
    Custom permission to only allow staff or admin users.
    Used for admin-only campaign management endpoints.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.is_staff or request.user.is_admin)
        )

class IsAgent(permissions.BasePermission):
    """
    Custom permission to only allow agent users.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            hasattr(request.user, 'staff_user_profile') and
            request.user.staff_user_profile is not None
        )

class IsAgentOrAdmin(permissions.BasePermission):
    """
    Allow agents and admin users.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.is_admin or
             request.user.is_staff or
             (hasattr(request.user, 'staff_user_profile') and request.user.staff_user_profile))
        )
```

**Security Best Practices Applied**:

- ✅ JWT Authentication (already configured in `REST_FRAMEWORK` settings)
- ✅ Permission-based access control (custom permissions)
- ✅ Role-based authorization (is_staff, is_admin, agent_profile checks)
- ✅ Request user authentication checks before permission grants

#### Step 0.2: Enhance User Admin for Agent/Customer Creation (20 mins)

**File**: `insurance-app/app/admin.py` (update existing `EnhancedUserAdmin`)

**Current State**: `EnhancedUserAdmin` exists at line 825 but uses basic ModelAdmin without secure password handling.

**Add to EnhancedUserAdmin class**:

```python
from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from django.contrib.auth.hashers import make_password

class EnhancedUserAdmin(admin.ModelAdmin):
    # ... existing fields ...

    # Add form customization for secure password handling
    add_form = UserCreationForm
    form = UserChangeForm

    # Update fieldsets to include password widget
    fieldsets = (
        ('Basic Information', {
            'fields': ('email', 'phonenumber')
        }),
        ('Security', {
            'fields': ('password',),
            'description': 'Use the "Change password" link below to update password securely.'
        }),
        ('Role & Permissions', {
            'fields': ('role', 'is_active', 'is_staff', 'is_admin')
        }),
        ('Agent Details', {
            'fields': ('agent_code_display', 'performance_summary'),
            'classes': ('collapse',),
        }),
        ('Activity Summary', {
            'fields': ('profile_link', 'quote_summary', 'commission_summary', 'date_created', 'date_updated', 'last_login'),
        }),
    )

    add_fieldsets = (
        ('Create New User', {
            'classes': ('wide',),
            'fields': ('phonenumber', 'email', 'role', 'password1', 'password2', 'is_active', 'is_staff'),
            'description': 'Create a new agent or customer. Password will be securely hashed.'
        }),
    )

    # Override save_model to hash passwords properly
    def save_model(self, request, obj, form, change):
        if not change:  # New user
            # Set created_by to current admin
            obj.created_by = request.user.email or request.user.phonenumber
            # Password is already hashed by UserCreationForm
        elif 'password' in form.changed_data:
            # If password changed manually, hash it
            obj.password = make_password(obj.password)
        super().save_model(request, obj, form, change)

    # Add quick action to create agent profile
    actions = [
        'activate_users',
        'deactivate_users',
        'export_user_report',
        'create_agent_profiles',  # NEW ACTION
    ]

    def create_agent_profiles(self, request, queryset):
        """Create StaffUserProfile for selected users to make them agents."""
        from app.models import StaffUserProfile
        created = 0
        for user in queryset:
            if not hasattr(user, 'staff_user_profile') or not user.staff_user_profile:
                # Generate agent code
                last_agent = StaffUserProfile.objects.order_by('-agent_code').first()
                next_code = (int(last_agent.agent_code) + 1) if last_agent else 1001

                StaffUserProfile.objects.create(
                    user=user,
                    agent_code=str(next_code).zfill(4),
                    agent_prefix='AGT',
                    full_names=user.email or f"Agent {next_code}",
                )
                user.is_staff = True
                user.role = 'AGENT'
                user.save()
                created += 1

        self.message_user(request, f"Created agent profiles for {created} users.", level=messages.SUCCESS)
    create_agent_profiles.short_description = "Convert to Agents (create agent profiles)"
```

**Security Features Added**:

- ✅ `UserCreationForm` - Django's built-in secure password form with password1/password2 confirmation
- ✅ `make_password()` - Proper password hashing using Django's PBKDF2 algorithm
- ✅ `add_fieldsets` - Separate form for creating new users with password validation
- ✅ No plaintext password storage - all passwords automatically hashed
- ✅ Admin audit trail - `created_by` tracks who created the user

**Recommended Django Password Validators** (already in settings.py):

```python
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 8}},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]
```

---

### Phase 1: Backend API (60 mins)

#### Step 1.1: Create Serializers (15 mins)

**File**: `insurance-app/app/serializers.py`

```python
from rest_framework import serializers
from .models import Campaign, CampaignInteraction
from django.utils import timezone

class CampaignSerializer(serializers.ModelSerializer):
    """Public campaign serializer with minimal fields"""
    is_active_now = serializers.SerializerMethodField()

    class Meta:
        model = Campaign
        fields = [
            'id', 'name', 'campaign_type', 'title', 'message',
            'image_url', 'call_to_action', 'action_url',
            'start_date', 'end_date', 'is_active_now'
        ]
        read_only_fields = fields

    def get_is_active_now(self, obj):
        now = timezone.now()
        return (
            obj.status == 'ACTIVE' and
            obj.start_date <= now <= obj.end_date
        )

class CampaignInteractionSerializer(serializers.ModelSerializer):
    """Track campaign interactions"""
    class Meta:
        model = CampaignInteraction
        fields = ['campaign', 'interaction_type', 'ip_address', 'user_agent']
        read_only_fields = ['user']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class CampaignAdminSerializer(serializers.ModelSerializer):
    """Full campaign details for admin"""
    performance = serializers.SerializerMethodField()

    class Meta:
        model = Campaign
        fields = '__all__'
        read_only_fields = ['total_impressions', 'total_clicks', 'total_conversions', 'total_spent']

    def get_performance(self, obj):
        ctr = (obj.total_clicks / obj.total_impressions * 100) if obj.total_impressions else 0
        cvr = (obj.total_conversions / obj.total_clicks * 100) if obj.total_clicks else 0
        return {
            'impressions': obj.total_impressions,
            'clicks': obj.total_clicks,
            'conversions': obj.total_conversions,
            'ctr': round(ctr, 2),
            'cvr': round(cvr, 2),
            'spent': float(obj.total_spent)
        }
```

#### Step 1.2: Create ViewSets (20 mins)

**File**: `insurance-app/app/campaign_views.py` (new file)

```python
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import F
from .models import Campaign, CampaignInteraction
from .serializers import (
    CampaignSerializer,
    CampaignInteractionSerializer,
    CampaignAdminSerializer
)
from .permissions import IsStaffOrAdmin  # Import our custom permission

class PublicCampaignViewSet(viewsets.ReadOnlyModelViewSet):
    """Public endpoint for active campaigns"""
    serializer_class = CampaignSerializer
    permission_classes = [IsAuthenticated]  # Any authenticated user

    def get_queryset(self):
        now = timezone.now()
        user = self.request.user

        # Base query: active campaigns within date range
        queryset = Campaign.objects.filter(
            status='ACTIVE',
            start_date__lte=now,
            end_date__gte=now
        )

        # Role-based filtering
        user_role = getattr(user, 'role', 'CUSTOMER')

        # Check if user is agent (has staff_user_profile)
        is_agent = hasattr(user, 'staff_user_profile') and user.staff_user_profile is not None

        if is_agent or user_role == 'AGENT':
            queryset = queryset.filter(target_roles__in=['ALL', 'AGENT', 'ACTIVE_AGENTS'])
        elif user_role == 'CUSTOMER':
            queryset = queryset.filter(target_roles__in=['ALL', 'CUSTOMER'])
        else:
            queryset = queryset.filter(target_roles='ALL')

        return queryset.order_by('-start_date')[:10]  # Limit to 10 most recent

    @action(detail=True, methods=['post'])
    def track(self, request, pk=None):
        """Track campaign interaction (impression/click/conversion)"""
        campaign = self.get_object()
        interaction_type = request.data.get('interaction_type', 'IMPRESSION')

        if interaction_type not in ['IMPRESSION', 'CLICK', 'CONVERSION', 'DISMISS']:
            return Response(
                {'error': 'Invalid interaction_type'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create interaction record
        CampaignInteraction.objects.create(
            campaign=campaign,
            user=request.user,
            interaction_type=interaction_type,
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )

        # Update campaign totals atomically (prevents race conditions)
        if interaction_type == 'IMPRESSION':
            Campaign.objects.filter(pk=pk).update(total_impressions=F('total_impressions') + 1)
        elif interaction_type == 'CLICK':
            Campaign.objects.filter(pk=pk).update(total_clicks=F('total_clicks') + 1)
        elif interaction_type == 'CONVERSION':
            Campaign.objects.filter(pk=pk).update(total_conversions=F('total_conversions') + 1)

        return Response({'status': 'tracked'}, status=status.HTTP_201_CREATED)

class AdminCampaignViewSet(viewsets.ModelViewSet):
    """Admin CRUD for campaigns - Staff/Admin only"""
    serializer_class = CampaignAdminSerializer
    permission_classes = [IsStaffOrAdmin]  # Secure: only staff/admin
    queryset = Campaign.objects.all().order_by('-start_date')

    def perform_create(self, serializer):
        # Auto-assign created_by to current admin
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        campaign = self.get_object()
        campaign.status = 'ACTIVE'
        campaign.save()
        return Response({'status': 'published'})

    @action(detail=True, methods=['post'])
    def pause(self, request, pk=None):
        campaign = self.get_object()
        campaign.status = 'PAUSED'
        campaign.save()
        return Response({'status': 'paused'})

    @action(detail=True, methods=['get'])
    def analytics(self, request, pk=None):
        from django.db.models import Count
        campaign = self.get_object()
        interactions = campaign.interactions.values('interaction_type').annotate(
            count=Count('id')
        )
        return Response({
            'campaign': CampaignAdminSerializer(campaign).data,
            'interactions': list(interactions)
        })
```

#### Step 1.3: Register URL Routes (10 mins)

**File**: `insurance-app/app/urls.py`

```python
# Add to existing router registrations
from .campaign_views import PublicCampaignViewSet, AdminCampaignViewSet

# Public campaign endpoints
router.register(r'campaigns', PublicCampaignViewSet, basename='campaign')

# Admin campaign endpoints
router.register(r'admin/campaigns', AdminCampaignViewSet, basename='admin-campaign')
```

#### Step 1.4: Test Backend API (15 mins)

**Create test script**: `test_campaigns_api.py`

```python
import requests
import json

BASE_URL = "http://127.0.0.1:8000/api/v1/public_app"
# Use your test agent token
HEADERS = {"Authorization": "Bearer <YOUR_TOKEN>"}

# 1. List active campaigns
response = requests.get(f"{BASE_URL}/campaigns/", headers=HEADERS)
print("Active Campaigns:", json.dumps(response.json(), indent=2))

# 2. Track impression
campaign_id = response.json()[0]['id']
track_response = requests.post(
    f"{BASE_URL}/campaigns/{campaign_id}/track/",
    headers=HEADERS,
    json={"interaction_type": "IMPRESSION"}
)
print("Track Response:", track_response.json())
```

---

### Phase 2: Frontend Integration (90 mins)

#### Step 2.1: Create Campaigns Service (20 mins)

**File**: `frontend/services/campaigns.js` (new file)

```javascript
import apiClient from "./apiConfig";
import djangoAPI from "./DjangoAPIService";

export const campaignsAPI = {
  /**
   * Get active campaigns for current user
   * @returns {Promise<Array>} Active campaigns
   */
  getActiveCampaigns: async () => {
    try {
      console.log("[CampaignsAPI] Fetching active campaigns...");

      // Try DjangoAPIService first for automatic token handling
      const response = await djangoAPI.makeRequest("/campaigns/", {
        method: "GET",
        _suppressErrorLog: true,
      });

      console.log("[CampaignsAPI] Campaigns fetched:", response?.length || 0);
      return Array.isArray(response) ? response : response?.results || [];
    } catch (error) {
      console.error("[CampaignsAPI] Failed to fetch campaigns:", error);
      // Return empty array on error to prevent UI crashes
      return [];
    }
  },

  /**
   * Track campaign impression (shown to user)
   * @param {number} campaignId - Campaign ID
   */
  trackImpression: async (campaignId) => {
    try {
      await djangoAPI.makeRequest(`/campaigns/${campaignId}/track/`, {
        method: "POST",
        body: JSON.stringify({ interaction_type: "IMPRESSION" }),
        _suppressErrorLog: true,
      });
      console.log(
        `[CampaignsAPI] Tracked impression for campaign ${campaignId}`
      );
    } catch (error) {
      // Silent fail - don't block UI
      console.warn(
        "[CampaignsAPI] Impression tracking failed:",
        error?.message
      );
    }
  },

  /**
   * Track campaign click (user tapped banner)
   * @param {number} campaignId - Campaign ID
   */
  trackClick: async (campaignId) => {
    try {
      await djangoAPI.makeRequest(`/campaigns/${campaignId}/track/`, {
        method: "POST",
        body: JSON.stringify({ interaction_type: "CLICK" }),
        _suppressErrorLog: true,
      });
      console.log(`[CampaignsAPI] Tracked click for campaign ${campaignId}`);
    } catch (error) {
      console.warn("[CampaignsAPI] Click tracking failed:", error?.message);
    }
  },

  /**
   * Track campaign conversion (user completed action)
   * @param {number} campaignId - Campaign ID
   */
  trackConversion: async (campaignId) => {
    try {
      await djangoAPI.makeRequest(`/campaigns/${campaignId}/track/`, {
        method: "POST",
        body: JSON.stringify({ interaction_type: "CONVERSION" }),
        _suppressErrorLog: true,
      });
      console.log(
        `[CampaignsAPI] Tracked conversion for campaign ${campaignId}`
      );
    } catch (error) {
      console.warn(
        "[CampaignsAPI] Conversion tracking failed:",
        error?.message
      );
    }
  },

  /**
   * Track campaign dismissal (user closed banner)
   * @param {number} campaignId - Campaign ID
   */
  trackDismiss: async (campaignId) => {
    try {
      await djangoAPI.makeRequest(`/campaigns/${campaignId}/track/`, {
        method: "POST",
        body: JSON.stringify({ interaction_type: "DISMISS" }),
        _suppressErrorLog: true,
      });
      console.log(`[CampaignsAPI] Tracked dismiss for campaign ${campaignId}`);
    } catch (error) {
      console.warn("[CampaignsAPI] Dismiss tracking failed:", error?.message);
    }
  },
};

export default campaignsAPI;
```

#### Step 2.2: Update HomeScreen with Dynamic Campaigns (40 mins)

**File**: `frontend/screens/main/HomeScreen.js`

Changes:

1. Replace static `campaigns` array with state
2. Add `useEffect` to fetch campaigns on mount
3. Track impressions when campaigns render (intersection observer or FlatList onViewableItemsChanged)
4. Track clicks on campaign press
5. Add refresh capability
6. Handle loading/error states

```javascript
// Add to imports
import { campaignsAPI } from "../../services/campaigns";

// Inside HomeScreen component:
const [campaigns, setCampaigns] = useState([]);
const [campaignsLoading, setCampaignsLoading] = useState(true);
const [campaignsError, setCampaignsError] = useState(null);
const trackedImpressions = useRef(new Set()); // Prevent duplicate impressions

// Fetch campaigns
useEffect(() => {
  let cancelled = false;
  const fetchCampaigns = async () => {
    try {
      setCampaignsLoading(true);
      const activeCampaigns = await campaignsAPI.getActiveCampaigns();
      if (!cancelled) {
        setCampaigns(activeCampaigns);
        setCampaignsError(null);
      }
    } catch (error) {
      if (!cancelled) {
        setCampaignsError("Failed to load campaigns");
        console.error("[HomeScreen] Campaigns fetch error:", error);
      }
    } finally {
      if (!cancelled) setCampaignsLoading(false);
    }
  };

  fetchCampaigns();

  // Auto-refresh every 5 minutes
  const interval = setInterval(fetchCampaigns, 5 * 60 * 1000);

  return () => {
    cancelled = true;
    clearInterval(interval);
  };
}, []);

// Track impressions on viewable items change
const handleCampaignViewableChange = useCallback(({ viewableItems }) => {
  viewableItems.forEach(({ item, isViewable }) => {
    if (isViewable && item?.id && !trackedImpressions.current.has(item.id)) {
      trackedImpressions.current.add(item.id);
      campaignsAPI.trackImpression(item.id);
    }
  });
}, []);

// Handle campaign press
const handleCampaignPress = useCallback(async (campaign) => {
  try {
    // Track click
    await campaignsAPI.trackClick(campaign.id);

    // Open action URL
    const url = campaign.action_url || campaign.image_url;
    if (url) {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", "Unable to open this link");
      }
    }
  } catch (error) {
    Alert.alert("Error", "Something went wrong while opening the link");
  }
}, []);

// Update renderCampaignCard
const renderCampaignCard = useCallback(
  ({ item }) => (
    <TouchableOpacity
      style={styles.campaignCard}
      onPress={() => handleCampaignPress(item)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: item.image_url }}
        style={styles.campaignImage}
        resizeMode="cover"
      />
      <View style={styles.campaignOverlay}>
        <Text style={styles.campaignTitle}>{item.title}</Text>
        <Text style={styles.campaignDescription}>{item.message}</Text>
        <Text style={styles.campaignCta}>
          {item.call_to_action || "Learn More"} →
        </Text>
      </View>
    </TouchableOpacity>
  ),
  [handleCampaignPress]
);

// Update FlatList to track impressions
<FlatList
  data={campaigns}
  renderItem={renderCampaignCard}
  keyExtractor={(item) => item.id.toString()}
  horizontal
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={styles.campaignsSlider}
  snapToInterval={280}
  decelerationRate="fast"
  onViewableItemsChanged={handleCampaignViewableChange}
  viewabilityConfig={{
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 500,
  }}
  ListEmptyComponent={
    campaignsLoading ? (
      <ActivityIndicator size="small" color="#D5222B" />
    ) : (
      <Text style={styles.noCampaignsText}>No active campaigns</Text>
    )
  }
/>;
```

#### Step 2.3: Add to AppDataContext (Optional, 15 mins)

If you want centralized campaign caching:

**File**: `frontend/contexts/AppDataContext.js`

```javascript
// Add state
const [campaigns, setCampaigns] = useState([]);

// Add fetcher
const fetchCampaigns = useCallback(
  async (force = false) => {
    if (!force && isFresh("campaigns") && campaigns.length) return campaigns;
    try {
      const items = await campaignsAPI.getActiveCampaigns();
      setCampaigns(items || []);
      markFresh("campaigns");
      return items || [];
    } catch (e) {
      setErrors((prev) => ({ ...prev, campaigns: e }));
      return [];
    }
  },
  [isFresh, markFresh, campaigns.length]
);

// Add to TTL
const TTL = {
  // ... existing
  campaigns: 5 * 60 * 1000, // 5 min
};

// Add to context value
const value = useMemo(
  () => ({
    // ... existing
    campaigns,
    fetchCampaigns,
  }),
  [, /* ... */ campaigns, fetchCampaigns]
);
```

#### Step 2.4: Frontend Testing (15 mins)

**Manual Test Checklist**:

- [ ] Campaigns load on HomeScreen mount
- [ ] Impression tracked when campaign becomes visible
- [ ] Click tracked when campaign is tapped
- [ ] Campaign opens correct URL (Linking.openURL)
- [ ] Empty state shows when no campaigns active
- [ ] Loading spinner shows during fetch
- [ ] Auto-refresh works (check logs after 5 min)
- [ ] Duplicate impressions prevented

---

### Phase 3: Admin Campaign Management (30 mins)

#### Step 3.1: Enhance Campaign Admin (15 mins)

**File**: `insurance-app/app/campaign_admin.py`

Add inline editing, bulk actions, and better list display:

```python
from django.utils.html import format_html

class CampaignAdmin(admin.ModelAdmin):
    # ... existing fields

    # Add inline image preview
    def image_preview(self, obj):
        if obj.image_url:
            return format_html('<img src="{}" width="100" />', obj.image_url)
        return '-'
    image_preview.short_description = 'Preview'

    # Add to list_display
    list_display = (
        'name', 'image_preview', 'campaign_type', 'status',
        'target_roles', 'start_date', 'end_date',
        'performance_summary', 'is_active'
    )

    # Add inline for quick stats
    readonly_fields = (
        # ... existing
        'image_preview', 'performance_chart'
    )

    def performance_chart(self, obj):
        """Simple HTML progress bars for performance"""
        imp_pct = min(100, (obj.total_impressions / obj.target_impressions * 100) if obj.target_impressions else 0)
        clk_pct = min(100, (obj.total_clicks / obj.target_clicks * 100) if obj.target_clicks else 0)

        return format_html('''
            <div style="width:200px;">
                <div>Impressions: {}/{} ({:.0f}%)</div>
                <div style="background:#e0e0e0;height:10px;border-radius:5px;">
                    <div style="background:#4caf50;height:10px;width:{}%;border-radius:5px;"></div>
                </div>
                <div style="margin-top:10px;">Clicks: {}/{} ({:.0f}%)</div>
                <div style="background:#e0e0e0;height:10px;border-radius:5px;">
                    <div style="background:#2196f3;height:10px;width:{}%;border-radius:5px;"></div>
                </div>
            </div>
        ''', obj.total_impressions, obj.target_impressions or 0, imp_pct, imp_pct,
             obj.total_clicks, obj.target_clicks or 0, clk_pct, clk_pct)
    performance_chart.short_description = 'Progress'
```

#### Step 3.2: Add Sample Campaigns (15 mins)

**Django shell script**: `create_sample_campaigns.py`

```python
# Run: python manage.py shell < create_sample_campaigns.py

from app.models import Campaign, User
from django.utils import timezone
from datetime import timedelta

# Get admin user
admin = User.objects.filter(user_role='ADMIN').first()
if not admin:
    print("No admin user found!")
    exit()

# Create sample campaigns
campaigns_data = [
    {
        'name': 'Motor Insurance Promo - Q4 2025',
        'title': "Get 20% Off Motor Insurance!",
        'message': 'Protect your vehicle with comprehensive coverage. Limited time offer.',
        'campaign_type': 'PROMOTIONAL',
        'image_url': 'https://patabima.com/assets/images/motor-promo.jpg',
        'action_url': 'https://patabima.com/motor-insurance',
        'call_to_action': 'Get Quote Now',
        'target_roles': 'ALL',
    },
    {
        'name': 'Medical Insurance - New Year',
        'title': 'Secure Your Health in 2026',
        'message': 'Comprehensive medical coverage for you and your family.',
        'campaign_type': 'SEASONAL',
        'image_url': 'https://patabima.com/assets/images/medical.jpg',
        'action_url': 'https://patabima.com/medical-insurance',
        'call_to_action': 'Learn More',
        'target_roles': 'CUSTOMER',
    },
    {
        'name': 'Agent Recruitment Drive',
        'title': 'Join Our Agent Network',
        'message': 'Earn competitive commissions selling insurance.',
        'campaign_type': 'ACQUISITION',
        'image_url': 'https://patabima.com/assets/images/agent-recruitment.jpg',
        'action_url': 'https://patabima.com/become-agent',
        'call_to_action': 'Apply Now',
        'target_roles': 'NEW_USERS',
    }
]

for data in campaigns_data:
    campaign, created = Campaign.objects.get_or_create(
        name=data['name'],
        defaults={
            **data,
            'description': f"Campaign: {data['title']}",
            'status': 'ACTIVE',
            'start_date': timezone.now(),
            'end_date': timezone.now() + timedelta(days=30),
            'target_impressions': 10000,
            'target_clicks': 500,
            'target_conversions': 50,
            'budget': 50000.00,
            'created_by': admin
        }
    )
    print(f"{'Created' if created else 'Already exists'}: {campaign.name}")

print("\n✅ Sample campaigns ready!")
```

---

## 🧪 Testing Strategy

### Backend Tests

```python
# insurance-app/app/tests/test_campaigns.py

from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient
from app.models import Campaign, CampaignInteraction, User

class CampaignAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            phonenumber='712345678',
            password='test123',
            user_role='AGENT'
        )
        self.client.force_authenticate(user=self.user)

        self.campaign = Campaign.objects.create(
            name='Test Campaign',
            title='Test Title',
            message='Test Message',
            campaign_type='PROMOTIONAL',
            status='ACTIVE',
            target_roles='ALL',
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=7),
            created_by=self.user
        )

    def test_list_active_campaigns(self):
        response = self.client.get('/api/v1/public_app/campaigns/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)

    def test_track_impression(self):
        response = self.client.post(
            f'/api/v1/public_app/campaigns/{self.campaign.id}/track/',
            {'interaction_type': 'IMPRESSION'}
        )
        self.assertEqual(response.status_code, 201)
        self.campaign.refresh_from_db()
        self.assertEqual(self.campaign.total_impressions, 1)

    def test_track_click(self):
        response = self.client.post(
            f'/api/v1/public_app/campaigns/{self.campaign.id}/track/',
            {'interaction_type': 'CLICK'}
        )
        self.assertEqual(response.status_code, 201)
        self.campaign.refresh_from_db()
        self.assertEqual(self.campaign.total_clicks, 1)
```

### Frontend Tests

```javascript
// frontend/__tests__/campaigns.test.js

import { campaignsAPI } from "../services/campaigns";
import djangoAPI from "../services/DjangoAPIService";

jest.mock("../services/DjangoAPIService");

describe("Campaigns API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("getActiveCampaigns returns campaigns array", async () => {
    const mockCampaigns = [{ id: 1, title: "Test Campaign", message: "Test" }];
    djangoAPI.makeRequest.mockResolvedValue(mockCampaigns);

    const campaigns = await campaignsAPI.getActiveCampaigns();
    expect(campaigns).toEqual(mockCampaigns);
    expect(djangoAPI.makeRequest).toHaveBeenCalledWith(
      "/campaigns/",
      expect.any(Object)
    );
  });

  test("trackImpression calls API correctly", async () => {
    djangoAPI.makeRequest.mockResolvedValue({ status: "tracked" });

    await campaignsAPI.trackImpression(1);
    expect(djangoAPI.makeRequest).toHaveBeenCalledWith(
      "/campaigns/1/track/",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ interaction_type: "IMPRESSION" }),
      })
    );
  });
});
```

---

## 📊 Success Metrics

### Technical Metrics

- [ ] API response time < 200ms for campaign list
- [ ] Zero N+1 queries (use select_related/prefetch_related)
- [ ] Frontend loads campaigns in < 1 second
- [ ] Impression tracking has < 5% failure rate
- [ ] Auto-refresh doesn't impact performance

### Business Metrics

- [ ] Admin can create campaign in < 2 minutes
- [ ] Campaigns are visible to users within 1 minute of publishing
- [ ] Click-through rate (CTR) > 2%
- [ ] Impression tracking accuracy > 95%

---

## 🚀 Deployment Checklist

### Backend

- [ ] Run migrations: `python manage.py migrate`
- [ ] Create sample campaigns: `python manage.py shell < create_sample_campaigns.py`
- [ ] Test API endpoints: `python test_campaigns_api.py`
- [ ] Verify admin interface works
- [ ] Check permissions (agents can't access admin endpoints)

### Frontend

- [ ] Clear app cache/storage
- [ ] Test on iOS simulator
- [ ] Test on Android emulator
- [ ] Verify deep linking works
- [ ] Test offline mode (graceful fallback)

### Monitoring

- [ ] Set up analytics dashboard for campaign performance
- [ ] Monitor API error rates
- [ ] Track campaign impression/click rates
- [ ] Set alerts for failed campaigns (0 impressions after 24h)

---

## 🔄 Future Enhancements

### Phase 4: Advanced Features (Post-MVP)

1. **A/B Testing**: Create variant campaigns and track performance
2. **Geolocation Targeting**: Show campaigns based on user location
3. **Push Notifications**: Send campaign alerts via push
4. **Rich Media**: Support video campaigns, carousels, animations
5. **User Segments**: Create custom audience segments for targeting
6. **Scheduled Publishing**: Auto-activate campaigns at specific times
7. **Campaign Templates**: Reusable campaign templates for quick creation
8. **Performance Predictions**: ML-based CTR prediction before launch

---

## 📝 Notes & Considerations

### Image Management

- Use AWS S3 for campaign image storage
- Implement image upload in admin interface
- Add image optimization (resize, compress)
- Support for multiple image sizes (thumbnail, full)

### Caching Strategy

- Cache active campaigns for 5 minutes in frontend
- Invalidate cache when admin publishes new campaign
- Use Redis for backend caching (if needed)

### Security

- Validate image URLs to prevent XSS
- Rate-limit impression tracking to prevent abuse
- Sanitize campaign content (title, message)
- Implement CORS properly for action URLs

### Performance

- Eager load related data (created_by user)
- Index database fields (status, start_date, end_date, target_roles)
- Paginate admin campaign list
- Lazy load campaign images in frontend

---

## ✅ Acceptance Criteria

**Backend**:

- ✅ GET `/api/v1/public_app/campaigns/` returns active campaigns for user role
- ✅ POST `/api/v1/public_app/campaigns/<id>/track/` increments impression/click counters
- ✅ Admin can create, edit, publish, pause campaigns via Django admin
- ✅ Campaign analytics show real-time impression/click data

**Frontend**:

- ✅ HomeScreen displays dynamic campaigns from API (not hardcoded)
- ✅ Campaigns auto-refresh every 5 minutes
- ✅ Tapping campaign opens action URL
- ✅ Impressions tracked when campaign is 50% visible for 500ms
- ✅ Clicks tracked when campaign is tapped
- ✅ Empty state shown when no active campaigns
- ✅ Loading state shown during initial fetch

**End-to-End**:

- ✅ Admin creates campaign → appears in app within 1 minute
- ✅ User views campaign → impression incremented in admin
- ✅ User taps campaign → click incremented + URL opens
- ✅ Campaign expires → disappears from app automatically

---

## 🎓 Implementation Best Practices

1. **Start Small**: Implement MVP first (list + track), then enhance
2. **Test Early**: Write tests as you build, not after
3. **Mobile-First**: Optimize image sizes for mobile data usage
4. **Error Handling**: Never block UI due to campaign failures
5. **Analytics**: Track everything from day 1 (you can't improve what you don't measure)
6. **User Experience**: Campaigns should enhance, not interrupt the user journey
7. **Admin UX**: Make campaign creation simple and fast
8. **Documentation**: Document campaign creation process for marketing team
9. **Security First**:
   - ✅ Always use Django's password hashing (`make_password`, `UserCreationForm`)
   - ✅ Apply permission classes to all admin endpoints (`IsStaffOrAdmin`)
   - ✅ Validate user roles before granting access (check `is_staff`, `is_admin`, agent profile)
   - ✅ Use atomic database updates (`F()` expressions) to prevent race conditions
   - ✅ Sanitize campaign content to prevent XSS attacks
   - ✅ Rate-limit tracking endpoints to prevent abuse
10. **Agent/Customer Management**:
    - ✅ Use Django admin with `UserCreationForm` for secure user creation
    - ✅ Never expose password reset/creation endpoints to public API
    - ✅ Require admin authentication for user management
    - ✅ Use `add_fieldsets` for clean admin UX when creating users
    - ✅ Auto-generate agent codes sequentially with proper padding

---

## 🔒 Security Audit Checklist

### Backend Security

- [ ] JWT authentication configured in `REST_FRAMEWORK` settings
- [ ] Custom permissions created (`IsStaffOrAdmin`, `IsAgent`, `IsAgentOrAdmin`)
- [ ] Admin endpoints protected with `IsStaffOrAdmin` permission
- [ ] Public endpoints require `IsAuthenticated` at minimum
- [ ] Passwords hashed using Django's `make_password()` or `UserCreationForm`
- [ ] No plaintext passwords stored in database
- [ ] Password validators configured (min 8 chars, complexity rules)
- [ ] Atomic database updates for campaign metrics (`F()` expressions)
- [ ] User creation tracked with `created_by` audit field
- [ ] Campaign content sanitized to prevent XSS

### Frontend Security

- [ ] API tokens stored in SecureStore/Keychain (not AsyncStorage)
- [ ] No sensitive data logged in production
- [ ] Campaign URLs validated before opening (`Linking.canOpenURL()`)
- [ ] Rate limiting on tracking calls (debounce/throttle)
- [ ] Error messages don't expose backend structure

### Admin Security

- [ ] Django admin requires staff/superuser login
- [ ] CSRF protection enabled for all forms
- [ ] Strong admin passwords enforced
- [ ] Admin actions logged for audit trail
- [ ] User creation uses Django's built-in forms (not custom password handling)

---

## 📊 Campaign Models Analysis (Avoid Duplication)

**Existing Backend (insurance-app/app/models.py lines 802-920)**:

- ✅ `Campaign` model - Complete with status, targeting, content, scheduling, performance tracking
- ✅ `CampaignInteraction` model - Tracks impressions, clicks, conversions, dismissals
- ✅ `CampaignSchedule` model - Recurring campaign scheduling with timezone

**Existing Admin (insurance-app/app/campaign_admin.py)**:

- ✅ `CampaignAdmin` - List display, filters, bulk actions (activate, pause, clone)
- ✅ `CampaignInteractionAdmin` - Interaction tracking admin
- ✅ `CampaignScheduleAdmin` - Schedule management admin
- ✅ Custom admin views - preview, analytics, performance dashboard
- ✅ Performance metrics - CTR calculations, impression/click tracking

**What NOT to Duplicate**:

- ❌ Don't create new Campaign models - use existing
- ❌ Don't create redundant admin classes - enhance existing `CampaignAdmin`
- ❌ Don't duplicate performance tracking - use existing `total_impressions`, `total_clicks`, `total_conversions` fields
- ❌ Don't create separate interaction tracking - use existing `CampaignInteraction` model

**What to ADD (No Duplication)**:

- ✅ NEW: `app/permissions.py` - Custom permission classes (doesn't exist yet)
- ✅ NEW: `app/campaign_views.py` - ViewSets for API (create new file)
- ✅ NEW: `app/serializers.py` - Add campaign serializers (file exists, add to it)
- ✅ UPDATE: `app/urls.py` - Register campaign routes (update existing router)
- ✅ UPDATE: `app/admin.py` - Enhance `EnhancedUserAdmin` for secure user creation (update existing)
- ✅ NEW: `frontend/services/campaigns.js` - Frontend API service (doesn't exist)
- ✅ UPDATE: `frontend/screens/main/HomeScreen.js` - Replace static campaigns (update existing)

---

**Ready to implement? Let's build! 🚀**
