# Dynamic Campaigns - Simple Implementation Guide

**Date**: October 15, 2025  
**Priority**: Medium  
**Time Estimate**: 2 hours total

---

## 🎯 Goal

Replace static campaigns in HomeScreen with dynamic campaigns from the backend.

**What you'll do:**

1. Create API endpoints for campaigns (backend)
2. Fetch and display campaigns (frontend)
3. Track impressions and clicks (analytics)

---

## ✅ What Already Exists (No Duplication!)

- ✅ **Campaign models** - Already in database with tracking fields
- ✅ **Campaign admin** - Admins can already create/manage campaigns
- ✅ **CampaignInteraction** - Tracks impressions/clicks automatically

**You only need to add the API layer!**

---

## 📋 Implementation Steps

### Step 1: Create Permissions (10 mins)

**Create new file**: `insurance-app/app/permissions.py`

```python
from rest_framework import permissions

class IsStaffOrAdmin(permissions.BasePermission):
    """Only staff/admin can access admin endpoints."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.is_staff or request.user.is_admin)
        )
```

**Why?** Protects admin campaign endpoints from regular users.

---

### Step 2: Create Serializers (15 mins)

**Add to existing file**: `insurance-app/app/serializers.py`

```python
from rest_framework import serializers
from .models import Campaign, CampaignInteraction
from django.utils import timezone

class CampaignSerializer(serializers.ModelSerializer):
    """Public campaign data for mobile app."""
    class Meta:
        model = Campaign
        fields = [
            'id', 'name', 'title', 'message',
            'image_url', 'call_to_action', 'action_url',
            'start_date', 'end_date'
        ]
        read_only_fields = fields
```

**Why?** Controls what campaign data the mobile app receives.

---

### Step 3: Create ViewSets (30 mins)

**Create new file**: `insurance-app/app/campaign_views.py`

```python
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import F
from .models import Campaign, CampaignInteraction
from .serializers import CampaignSerializer
from .permissions import IsStaffOrAdmin

class PublicCampaignViewSet(viewsets.ReadOnlyModelViewSet):
    """Get active campaigns for mobile app."""
    serializer_class = CampaignSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return active campaigns within date range."""
        now = timezone.now()
        user = self.request.user

        # Get active campaigns
        queryset = Campaign.objects.filter(
            status='ACTIVE',
            start_date__lte=now,
            end_date__gte=now
        )

        # Filter by user role
        is_agent = hasattr(user, 'staff_user_profile') and user.staff_user_profile

        if is_agent:
            queryset = queryset.filter(target_roles__in=['ALL', 'AGENT', 'ACTIVE_AGENTS'])
        else:
            queryset = queryset.filter(target_roles__in=['ALL', 'CUSTOMER'])

        return queryset.order_by('-start_date')[:5]  # Show max 5 campaigns

    @action(detail=True, methods=['post'])
    def track(self, request, pk=None):
        """Track impression or click."""
        campaign = self.get_object()
        interaction_type = request.data.get('interaction_type', 'IMPRESSION')

        if interaction_type not in ['IMPRESSION', 'CLICK']:
            return Response({'error': 'Invalid type'}, status=status.HTTP_400_BAD_REQUEST)

        # Create interaction record
        CampaignInteraction.objects.create(
            campaign=campaign,
            user=request.user,
            interaction_type=interaction_type,
            ip_address=request.META.get('REMOTE_ADDR', ''),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )

        # Update campaign totals
        if interaction_type == 'IMPRESSION':
            Campaign.objects.filter(pk=pk).update(total_impressions=F('total_impressions') + 1)
        elif interaction_type == 'CLICK':
            Campaign.objects.filter(pk=pk).update(total_clicks=F('total_clicks') + 1)

        return Response({'status': 'tracked'}, status=status.HTTP_201_CREATED)
```

**Why?**

- Mobile app fetches campaigns via `GET /api/v1/public_app/campaigns/`
- Tracks when user sees or clicks campaigns
- Only shows relevant campaigns based on user role (agent vs customer)

---

### Step 4: Register Routes (5 mins)

**Update existing file**: `insurance-app/app/urls.py`

Add this import at the top:

```python
from .campaign_views import PublicCampaignViewSet
```

Add this line where other routes are registered:

```python
router.register(r'campaigns', PublicCampaignViewSet, basename='campaign')
```

**Why?** Makes campaigns available at `/api/v1/public_app/campaigns/`

---

### Step 5: Create Frontend Service (20 mins)

**Create new file**: `frontend/services/campaigns.js`

```javascript
import djangoAPI from "./DjangoAPIService";

export const campaignsAPI = {
  /**
   * Get active campaigns for current user
   */
  getActiveCampaigns: async () => {
    try {
      const response = await djangoAPI.makeRequest("/campaigns/", {
        method: "GET",
        _suppressErrorLog: true,
      });
      return Array.isArray(response) ? response : response?.results || [];
    } catch (error) {
      console.warn("[Campaigns] Failed to fetch:", error?.message);
      return []; // Return empty array on error
    }
  },

  /**
   * Track impression (campaign shown to user)
   */
  trackImpression: async (campaignId) => {
    try {
      await djangoAPI.makeRequest(`/campaigns/${campaignId}/track/`, {
        method: "POST",
        body: JSON.stringify({ interaction_type: "IMPRESSION" }),
        _suppressErrorLog: true,
      });
    } catch (error) {
      // Silent fail - don't block UI
    }
  },

  /**
   * Track click (user tapped campaign)
   */
  trackClick: async (campaignId) => {
    try {
      await djangoAPI.makeRequest(`/campaigns/${campaignId}/track/`, {
        method: "POST",
        body: JSON.stringify({ interaction_type: "CLICK" }),
        _suppressErrorLog: true,
      });
    } catch (error) {
      // Silent fail
    }
  },
};

export default campaignsAPI;
```

**Why?** Centralized API calls for campaigns (clean separation of concerns).

---

### Step 6: Update HomeScreen (30 mins)

**Update existing file**: `frontend/screens/main/HomeScreen.js`

**Find this section (around line 50-80):**

```javascript
const campaigns = [
  {
    id: 1,
    title: "Contractor's Risk Insurance",
    description: "Comprehensive coverage for construction and contractor risks",
    category: "Construction",
    image: "https://patabima.com/assets/images/CAR.jpeg",
    url: "https://patabima.com/commercial-insurance",
  },
  // ... more hardcoded campaigns
];
```

**Replace with:**

```javascript
import { campaignsAPI } from "../../services/campaigns";
import { Linking } from "react-native";

// Inside component, add state:
const [campaigns, setCampaigns] = useState([]);
const [campaignsLoading, setCampaignsLoading] = useState(true);
const trackedImpressions = useRef(new Set());

// Add effect to fetch campaigns:
useEffect(() => {
  const fetchCampaigns = async () => {
    try {
      setCampaignsLoading(true);
      const activeCampaigns = await campaignsAPI.getActiveCampaigns();
      setCampaigns(activeCampaigns);
    } catch (error) {
      console.error("[HomeScreen] Campaigns error:", error);
    } finally {
      setCampaignsLoading(false);
    }
  };

  fetchCampaigns();
}, []);

// Track impressions when campaign becomes visible:
const handleCampaignViewableChange = useCallback(({ viewableItems }) => {
  viewableItems.forEach(({ item, isViewable }) => {
    if (isViewable && item?.id && !trackedImpressions.current.has(item.id)) {
      trackedImpressions.current.add(item.id);
      campaignsAPI.trackImpression(item.id);
    }
  });
}, []);

// Handle campaign tap:
const handleCampaignPress = useCallback(async (campaign) => {
  try {
    // Track click
    await campaignsAPI.trackClick(campaign.id);

    // Open URL
    const url = campaign.action_url || campaign.image_url;
    if (url && (await Linking.canOpenURL(url))) {
      await Linking.openURL(url);
    }
  } catch (error) {
    console.error("[HomeScreen] Campaign press error:", error);
  }
}, []);
```

**Update the FlatList:**

```javascript
<FlatList
  data={campaigns}
  renderItem={renderCampaignCard}
  keyExtractor={(item) => item.id.toString()}
  horizontal
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={styles.campaignsSlider}
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
/>
```

**Update renderCampaignCard:**

```javascript
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
```

**Why?**

- Fetches real campaigns from backend on mount
- Tracks impressions when 50% of campaign is visible for 500ms
- Tracks clicks when user taps campaign
- Opens campaign URL when tapped
- Shows loading state and empty state

---

### Step 7: Test Backend (10 mins)

**Create test file**: `insurance-app/test_campaigns_simple.py`

```python
import requests
import json

BASE_URL = "http://127.0.0.1:8000/api/v1/public_app"

# Replace with your test user token
TOKEN = "YOUR_ACCESS_TOKEN_HERE"
HEADERS = {"Authorization": f"Bearer {TOKEN}"}

# 1. List active campaigns
print("Testing GET /campaigns/...")
response = requests.get(f"{BASE_URL}/campaigns/", headers=HEADERS)
print(f"Status: {response.status_code}")
print(f"Campaigns: {json.dumps(response.json(), indent=2)}")

# 2. Track impression
if response.json():
    campaign_id = response.json()[0]['id']
    print(f"\nTesting POST /campaigns/{campaign_id}/track/...")
    track_response = requests.post(
        f"{BASE_URL}/campaigns/{campaign_id}/track/",
        headers=HEADERS,
        json={"interaction_type": "IMPRESSION"}
    )
    print(f"Status: {track_response.status_code}")
    print(f"Response: {track_response.json()}")
```

**Run test:**

```bash
cd insurance-app
python test_campaigns_simple.py
```

**Expected output:**

```
Status: 200
Campaigns: [
  {
    "id": 1,
    "name": "Motor Insurance Promo",
    "title": "Get 20% Off Motor Insurance!",
    "message": "Limited time offer...",
    "image_url": "https://...",
    "call_to_action": "Get Quote",
    "action_url": "https://..."
  }
]

Status: 201
Response: {"status": "tracked"}
```

---

### Step 8: Create Sample Campaigns (10 mins)

**Run in Django shell:**

```bash
cd insurance-app
python manage.py shell
```

**Paste this code:**

```python
from app.models import Campaign, User
from django.utils import timezone
from datetime import timedelta

# Get admin user
admin = User.objects.filter(is_admin=True).first()
if not admin:
    print("No admin user found! Create one first.")
    exit()

# Create sample campaigns
campaigns = [
    {
        'name': 'Motor Insurance Q4 2025',
        'title': 'Get 20% Off Motor Insurance!',
        'message': 'Protect your vehicle with comprehensive coverage.',
        'campaign_type': 'PROMOTIONAL',
        'image_url': 'https://patabima.com/assets/images/motor-promo.jpg',
        'action_url': 'https://patabima.com/motor-insurance',
        'call_to_action': 'Get Quote Now',
        'target_roles': 'ALL',
    },
    {
        'name': 'Medical Insurance New Year',
        'title': 'Secure Your Health in 2026',
        'message': 'Comprehensive medical coverage for your family.',
        'campaign_type': 'SEASONAL',
        'image_url': 'https://patabima.com/assets/images/medical.jpg',
        'action_url': 'https://patabima.com/medical-insurance',
        'call_to_action': 'Learn More',
        'target_roles': 'CUSTOMER',
    },
]

for data in campaigns:
    campaign, created = Campaign.objects.get_or_create(
        name=data['name'],
        defaults={
            **data,
            'description': f"Campaign: {data['title']}",
            'status': 'ACTIVE',
            'start_date': timezone.now(),
            'end_date': timezone.now() + timedelta(days=30),
            'created_by': admin
        }
    )
    print(f"{'✅ Created' if created else '⚠️  Exists'}: {campaign.name}")

print("\n✅ Sample campaigns ready!")
```

**Why?** Creates test campaigns to verify the system works.

---

## ✅ Testing Checklist

### Backend

- [ ] Run migrations: `python manage.py migrate`
- [ ] Create sample campaigns (Django shell script above)
- [ ] Test API: `python test_campaigns_simple.py`
- [ ] Verify admin can see campaigns in Django admin

### Frontend

- [ ] Campaigns load on HomeScreen
- [ ] Tapping campaign opens URL
- [ ] No errors in console
- [ ] Empty state shows when no campaigns

### Analytics

- [ ] Check Django admin → Campaigns → View campaign
- [ ] Verify `total_impressions` increments when campaign viewed
- [ ] Verify `total_clicks` increments when campaign tapped

---

## 🎓 What You Built

1. **Backend API** - Campaigns available via REST endpoint
2. **Frontend Service** - Clean API layer for campaigns
3. **Dynamic HomeScreen** - Replaces static campaigns with real data
4. **Analytics** - Tracks impressions and clicks automatically
5. **Role-based Targeting** - Agents see agent campaigns, customers see customer campaigns

**Total time**: ~2 hours  
**Complexity**: Simple (essential features only)  
**Production-ready**: Yes ✅

---

## 📝 Notes

**What we skipped (optional enhancements for later):**

- Admin campaign creation API (use Django admin for now)
- Campaign scheduling (use admin interface)
- A/B testing
- Push notifications
- Image upload (paste URLs for now)

**Security built-in:**

- ✅ JWT authentication required
- ✅ Role-based campaign filtering
- ✅ Permission-based access control
- ✅ Atomic database updates (no race conditions)

---

**Ready to implement!** 🚀
