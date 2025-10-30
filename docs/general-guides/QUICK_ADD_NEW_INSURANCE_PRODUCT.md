# Non-Motor Insurance: Quick Start Implementation Prompt

**PataBima - Step-by-Step Developer Guide for New Insurance Product Integration**

---

## When to Use This Guide

Use this prompt when adding a **new non-motor insurance product** (e.g., Home Insurance, Education Cover, Cyber Insurance) to the PataBima platform.

---

## Prerequisites Checklist

Before starting, ensure you have:

- [ ] Django backend running locally (`python manage.py runserver`)
- [ ] React Native frontend running (`npm start`)
- [ ] Admin account created (`python manage.py createsuperuser`)
- [ ] Test agent account created
- [ ] DjangoAPIService configured with correct API_BASE_URL

---

## Step-by-Step: Add New Insurance Product (Example: Home Insurance)

### Phase 1: Backend Setup (Django)

#### 1.1 Define Product in Constants

**File:** `insurance-app/app/models.py`

```python
# Add to MANUAL_QUOTE_LINE_KEYS if not already present
MANUAL_QUOTE_LINE_KEYS = [
    ('MEDICAL', 'Medical Insurance'),
    ('WIBA', 'WIBA Insurance'),
    ('TRAVEL', 'Travel Insurance'),
    ('PERSONAL_ACCIDENT', 'Personal Accident'),
    ('PROFESSIONAL_INDEMNITY', 'Professional Indemnity'),
    ('LAST_EXPENSE', 'Last Expense'),
    ('DOMESTIC_PACKAGE', 'Domestic Package'),
    ('HOME', 'Home Insurance'),  # ← NEW PRODUCT
]
```

**No migration needed** - the `line_key` field is a simple CharField, not a choices field.

#### 1.2 Verify API Endpoints Work

The existing `ManualQuote` model and viewsets **already support your new product**. No code changes needed!

**Test it:**

```bash
curl -X POST http://localhost:8000/api/v1/public_app/manual_quotes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "line_key": "HOME",
    "payload": {
      "propertyValue": 5000000,
      "propertyType": "Apartment",
      "location": "Nairobi",
      "ownerName": "John Doe",
      "ownerPhone": "0712345678"
    },
    "preferred_underwriters": ["UAP", "JUBILEE"]
  }'
```

**Expected Response:**

```json
{
  "reference": "MNL-HOME-A3F2D891",
  "line_key": "HOME",
  "status": "PENDING_ADMIN_REVIEW",
  "payload": { ... },
  "created_at": "2025-10-25T10:30:00Z"
}
```

✅ **If you get a 201 response, backend is ready!**

---

### Phase 2: Frontend Setup (React Native)

#### 2.1 Create Quotation Screen

**File:** `frontend/screens/quotations/home/HomeQuotationScreen.js`

```javascript
import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Text,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import api from "../../../services/DjangoAPIService";

const HomeQuotationScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [formData, setFormData] = useState({
    propertyValue: "",
    propertyType: "",
    location: "",
    ownerName: "",
    ownerPhone: "",
    ownerEmail: "",
  });

  const [submitting, setSubmitting] = useState(false);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.ownerName || formData.ownerName.length < 3) {
      Alert.alert("Validation Error", "Owner name is required");
      return false;
    }

    if (!formData.ownerPhone || !/^0\d{9}$/.test(formData.ownerPhone)) {
      Alert.alert(
        "Validation Error",
        "Valid phone number required (0712345678)"
      );
      return false;
    }

    if (
      !formData.propertyValue ||
      parseFloat(formData.propertyValue) < 100000
    ) {
      Alert.alert(
        "Validation Error",
        "Property value must be at least KSh 100,000"
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (submitting) return;

    setSubmitting(true);
    try {
      const response = await api.submitManualQuote("HOME", formData);

      Alert.alert(
        "Quote Submitted Successfully!",
        `Reference: ${response.reference}\n\nYour quote is being reviewed by our team.`,
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("QuotationsScreenNew"),
          },
        ]
      );
    } catch (error) {
      Alert.alert("Submission Failed", error.message || "Please try again");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { marginTop: 4 }]}>
          Home Insurance
        </Text>
      </View>

      {/* Form */}
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        bounces={false}
      >
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Property Details</Text>

          <TextInput
            style={styles.input}
            placeholder="Property Value (KSh)"
            value={formData.propertyValue}
            onChangeText={(text) => updateField("propertyValue", text)}
            keyboardType="numeric"
          />

          <TextInput
            style={styles.input}
            placeholder="Property Type (e.g., Apartment, House)"
            value={formData.propertyType}
            onChangeText={(text) => updateField("propertyType", text)}
          />

          <TextInput
            style={styles.input}
            placeholder="Location (e.g., Nairobi, Mombasa)"
            value={formData.location}
            onChangeText={(text) => updateField("location", text)}
          />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Owner Details</Text>

          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={formData.ownerName}
            onChangeText={(text) => updateField("ownerName", text)}
          />

          <TextInput
            style={styles.input}
            placeholder="Phone Number (0712345678)"
            value={formData.ownerPhone}
            onChangeText={(text) => updateField("ownerPhone", text)}
            keyboardType="phone-pad"
          />

          <TextInput
            style={styles.input}
            placeholder="Email Address (optional)"
            value={formData.ownerEmail}
            onChangeText={(text) => updateField("ownerEmail", text)}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom }]}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            submitting && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitButtonText}>
            {submitting ? "Submitting..." : "Submit Quote"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 12,
  },
  formSection: {
    padding: 16,
    backgroundColor: "#fff",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  submitButton: {
    backgroundColor: "#D5222B",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#ccc",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default HomeQuotationScreen;
```

#### 2.2 Register Screen in Navigation

**File:** `frontend/navigation/AppNavigator.js`

```javascript
import HomeQuotationScreen from "../screens/quotations/home/HomeQuotationScreen";

// Inside Stack.Navigator
<Stack.Screen
  name="HomeQuotation"
  component={HomeQuotationScreen}
  options={{ headerShown: false }}
/>;
```

#### 2.3 Add Category to Home Screen

**File:** `frontend/screens/main/HomeScreen.js`

```javascript
const insuranceCategories = [
  // ... existing categories ...
  {
    key: "home",
    displayName: "Home Insurance",
    description: "Protect your property and belongings",
    icon: require("../../assets/images/home.png"),
    route: "HomeQuotation",
    active: true,
  },
];
```

#### 2.4 Export Screen

**File:** `frontend/screens/quotations/index.js`

```javascript
export { default as HomeQuotationScreen } from "./home/HomeQuotationScreen";
```

---

### Phase 3: Admin Configuration

#### 3.1 Django Admin Already Configured!

The `ManualQuoteAdmin` class already supports filtering by line_key. No changes needed.

**Access Admin:**

1. Navigate to `http://localhost:8000/admin`
2. Login with superuser credentials
3. Go to "Manual quotes"
4. Filter by "Line key" → Select "HOME"
5. See all home insurance quotes

#### 3.2 Admin Pricing Workflow

**When agent submits Home Insurance quote:**

1. **Admin opens quote in Django admin**

   - Reference: MNL-HOME-A3F2D891
   - Payload shows: Property value, type, location, owner details

2. **Admin calculates premium** (manual or using external tool)

   - Example: Property value KSh 5,000,000
   - UAP Home rate: 0.3% = KSh 15,000 base
   - Add levies: ITL 37.50 + PCF 37.50 + Stamp 40 = KSh 15,115

3. **Admin enters pricing:**

   - Computed Premium: `15115.00`
   - Levies Breakdown:
     ```json
     {
       "underwriter": "UAP",
       "base_premium": 15000.0,
       "levies": {
         "itl": 37.5,
         "pcf": 37.5,
         "stamp_duty": 40.0
       },
       "total": 15115.0
     }
     ```
   - Status: `COMPLETED`

4. **Save quote**

---

### Phase 4: Testing

#### 4.1 End-to-End Test

1. **Agent App:**

   - Open app on emulator/device
   - Navigate to Home Insurance
   - Fill form:
     - Property Value: 5000000
     - Property Type: Apartment
     - Location: Nairobi
     - Owner Name: Test User
     - Phone: 0712345678
   - Submit quote
   - Verify success message with reference number

2. **Backend Verification:**

   ```bash
   # Check database
   python manage.py shell
   >>> from app.models import ManualQuote
   >>> ManualQuote.objects.filter(line_key='HOME').count()
   1
   >>> quote = ManualQuote.objects.filter(line_key='HOME').first()
   >>> quote.reference
   'MNL-HOME-A3F2D891'
   >>> quote.payload
   {'propertyValue': '5000000', 'propertyType': 'Apartment', ...}
   ```

3. **Admin Pricing:**

   - Login to `/admin`
   - Find quote by reference
   - Add pricing (as shown above)
   - Save

4. **Agent Retrieval:**
   - Open Quotations screen in app
   - Verify quote appears
   - Status: COMPLETED
   - Premium: KSh 15,115
   - "Proceed to Payment" button visible

#### 4.2 API Test Script

```javascript
// test_home_insurance.js
const API_BASE = "http://localhost:8000";
const TOKEN = "YOUR_ACCESS_TOKEN_HERE";

async function testHomeInsurance() {
  // 1. Create quote
  const createResponse = await fetch(
    `${API_BASE}/api/v1/public_app/manual_quotes`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        line_key: "HOME",
        payload: {
          propertyValue: "5000000",
          propertyType: "Apartment",
          location: "Nairobi",
          ownerName: "Test User",
          ownerPhone: "0712345678",
        },
        preferred_underwriters: ["UAP", "JUBILEE"],
      }),
    }
  );

  const createData = await createResponse.json();
  console.log("Created quote:", createData);

  // 2. Retrieve quote
  const retrieveResponse = await fetch(
    `${API_BASE}/api/v1/public_app/manual_quotes/${createData.reference}`,
    {
      headers: { Authorization: `Bearer ${TOKEN}` },
    }
  );

  const retrieveData = await retrieveResponse.json();
  console.log("Retrieved quote:", retrieveData);

  // 3. List home quotes
  const listResponse = await fetch(
    `${API_BASE}/api/v1/public_app/manual_quotes?line_key=HOME`,
    {
      headers: { Authorization: `Bearer ${TOKEN}` },
    }
  );

  const listData = await listResponse.json();
  console.log("Home insurance quotes:", listData);
}

testHomeInsurance();
```

---

### Phase 5: Production Deployment

#### 5.1 Frontend Deployment

```bash
# Build production APK
cd frontend
eas build --platform android

# Or for iOS
eas build --platform ios
```

#### 5.2 Backend Deployment

```bash
# Deploy to EC2 (already configured)
cd insurance-app
git add .
git commit -m "Add Home Insurance product"
git push origin main

# SSH to EC2 and pull changes
ssh ubuntu@your-ec2-ip
cd /path/to/insurance-app
git pull
sudo systemctl restart gunicorn
sudo systemctl restart nginx
```

#### 5.3 Verify Production

```bash
# Test production endpoint
curl -X POST https://your-domain.com/api/v1/public_app/manual_quotes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "line_key": "HOME",
    "payload": {"propertyValue": "5000000", ...}
  }'
```

---

## Common Patterns & Best Practices

### Form Validation Pattern

```javascript
const validateForm = () => {
  const errors = [];

  // Required text field
  if (!formData.fieldName || formData.fieldName.trim().length === 0) {
    errors.push("Field name is required");
  }

  // Minimum length
  if (formData.name && formData.name.length < 3) {
    errors.push("Name must be at least 3 characters");
  }

  // Phone number (Kenya format)
  if (formData.phone && !/^0\d{9}$/.test(formData.phone)) {
    errors.push("Invalid phone number (use format 0712345678)");
  }

  // Email (optional but valid if provided)
  if (formData.email && formData.email.length > 0) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      errors.push("Invalid email address");
    }
  }

  // Numeric minimum
  if (formData.amount && parseFloat(formData.amount) < 10000) {
    errors.push("Amount must be at least KSh 10,000");
  }

  // Date in future
  if (formData.startDate) {
    const selectedDate = new Date(formData.startDate);
    const today = new Date();
    if (selectedDate < today) {
      errors.push("Start date must be in the future");
    }
  }

  if (errors.length > 0) {
    Alert.alert("Validation Error", errors.join("\n"));
    return false;
  }

  return true;
};
```

### API Error Handling Pattern

```javascript
const handleSubmit = async () => {
  try {
    const response = await api.submitManualQuote(lineKey, formData);
    // Success
  } catch (error) {
    // Network error
    if (!error.status) {
      Alert.alert("Network Error", "Please check your internet connection");
      return;
    }

    // Unauthorized
    if (error.status === 401) {
      Alert.alert("Session Expired", "Please login again");
      navigation.navigate("Login");
      return;
    }

    // Validation error
    if (error.status === 400) {
      const message = error.data?.detail || error.message || "Invalid input";
      Alert.alert("Validation Error", message);
      return;
    }

    // Server error
    if (error.status >= 500) {
      Alert.alert(
        "Server Error",
        "Our team has been notified. Please try again later."
      );
      return;
    }

    // Generic error
    Alert.alert("Error", error.message || "Something went wrong");
  }
};
```

### Loading State Pattern

```javascript
const [loading, setLoading] = useState(false);
const [submitting, setSubmitting] = useState(false);

// For fetching data (e.g., underwriters)
useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await api.getUnderwriters();
      setUnderwriters(data);
    } catch (error) {
      console.error("Failed to fetch:", error);
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, []);

// For form submission
const handleSubmit = async () => {
  if (submitting) return; // Prevent double-click

  setSubmitting(true);
  try {
    await api.submitManualQuote(lineKey, formData);
    // Success
  } catch (error) {
    // Error handling
  } finally {
    setSubmitting(false);
  }
};

// In UI
<TouchableOpacity
  style={[styles.button, submitting && styles.buttonDisabled]}
  onPress={handleSubmit}
  disabled={submitting}
>
  <Text>{submitting ? "Submitting..." : "Submit"}</Text>
</TouchableOpacity>;
```

---

## Troubleshooting

### Issue: Quote not appearing in admin

**Solution:**

```bash
# Check if quote was created
python manage.py shell
>>> from app.models import ManualQuote
>>> ManualQuote.objects.all().count()
>>> ManualQuote.objects.filter(line_key='HOME').first()
```

If no quotes found, check:

- Frontend API call (check Network tab in browser/debugger)
- Backend logs: `tail -f /var/log/gunicorn/error.log`
- Database connection

### Issue: "Authentication failed" error

**Solution:**

1. Verify token in AsyncStorage:

   ```javascript
   import AsyncStorage from "@react-native-async-storage/async-storage";
   const token = await AsyncStorage.getItem("authToken");
   console.log("Token:", token);
   ```

2. Test token validity:

   ```bash
   curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:8000/api/v1/public_app/user/profile
   ```

3. If invalid, re-login

### Issue: Form data not saving correctly

**Solution:**

```javascript
// Check state before submission
console.log("Form Data:", JSON.stringify(formData, null, 2));

// Verify API payload
const payload = {
  line_key: "HOME",
  payload: formData,
  preferred_underwriters: [],
};
console.log("API Payload:", JSON.stringify(payload, null, 2));
```

---

## Quick Reference Commands

### Backend (Django)

```bash
# Start dev server
python manage.py runserver 0.0.0.0:8000

# Create admin user
python manage.py createsuperuser

# Check migrations
python manage.py showmigrations

# Run migrations
python manage.py migrate

# Shell access
python manage.py shell

# Check quotes in DB
python manage.py shell
>>> from app.models import ManualQuote
>>> ManualQuote.objects.count()
>>> ManualQuote.objects.filter(line_key='HOME')
```

### Frontend (React Native)

```bash
# Start Expo
npm start

# Clear cache
npm start -- --clear

# Run on Android
npm run android

# Run on iOS
npm run ios

# Check logs
npx react-native log-android
npx react-native log-ios
```

### Testing

```bash
# Backend unit tests
python manage.py test app.tests.test_manual_quotes

# Frontend tests
npm test

# API endpoint test
curl -X POST http://localhost:8000/api/v1/public_app/manual_quotes \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"line_key": "HOME", "payload": {...}}'
```

---

## Summary Checklist

When adding a new insurance product:

**Backend:**

- [ ] No code changes needed (ManualQuote supports any line_key)
- [ ] Test API endpoint with curl
- [ ] Verify admin interface shows new line_key filter option

**Frontend:**

- [ ] Create new screen file (e.g., `HomeQuotationScreen.js`)
- [ ] Add form fields for product-specific data
- [ ] Implement validation
- [ ] Call `api.submitManualQuote(lineKey, formData)`
- [ ] Register screen in `AppNavigator.js`
- [ ] Add category to HomeScreen carousel
- [ ] Export screen from `quotations/index.js`

**Testing:**

- [ ] Submit quote from app
- [ ] Verify in Django admin
- [ ] Price quote in admin
- [ ] Check quote appears as completed in app
- [ ] Test payment flow (if implemented)

**Deployment:**

- [ ] Build production app
- [ ] Deploy backend changes
- [ ] Verify production endpoints
- [ ] Train admin staff on new product

---

**That's it!** The ManualQuote system is designed to be **zero-backend-changes** for new products. Just build the frontend screen and you're done.

---

**Document Status:** ✅ Ready for Use  
**Last Updated:** October 25, 2025  
**Quick Start Time:** ~2 hours for a new product  
**Questions?** Refer to the full [Non-Motor Insurance Integration Guide](./NON_MOTOR_INSURANCE_INTEGRATION_GUIDE.md)
