# Test: No Unauthorized API Calls

## Purpose

Verify that the PataBima app frontend does NOT make API calls when the user is not authenticated.

## Changes Made

### 1. QuotationsScreenNew.js

Added authentication check in `fetchRemoteQuotes()`:

```javascript
const fetchRemoteQuotes = async ({ silentOnError = false } = {}) => {
  // Don't fetch if user is not authenticated
  if (!djangoAPI.isAuthenticated()) {
    console.log("⚠️ Skipping remote fetch - user not authenticated");
    setIsRefreshingRemote(false);
    return;
  }
  // ... rest of function
};
```

### 2. AppDataContext.js

Added authentication check in `useEffect()`:

```javascript
useEffect(() => {
  // ... initialization code

  // Only fetch data if user is authenticated
  if (!djangoAPI.isAuthenticated()) {
    console.log('[AppDataContext] ⚠️ Skipping data fetch - user not authenticated');
    return;
  }

  // ... rest of data fetching
}, [...]);
```

## Testing Steps

### Manual Test (Frontend)

1. **Start the Django backend server** (if not already running)
2. **Start the Expo dev server**: Run `npm start` in the frontend directory
3. **Open the app** on an emulator/device (without logging in)
4. **Monitor server logs** for unauthorized 401 errors
5. **Expected Result**:
   - App should load without making API calls
   - No 401 errors in server logs
   - Console should show: `⚠️ Skipping remote fetch - user not authenticated`

### Backend Verification

1. Check Django server terminal for any unauthorized requests
2. Before fix: Multiple 401 errors for:
   - `/api/v1/public_app/manual_quotes`
   - `/api/v1/policies/motor/upcoming-renewals/`
   - `/api/v1/policies/motor/upcoming-extensions/`
   - `/api/v1/public_app/commissions`
   - `/api/insurance/claims`
3. After fix: NO unauthorized requests should appear

### Test Medical Quote Flow (Authenticated)

Once logged in, verify manual quotes work:

1. **Login** as an agent
2. **Navigate** to Medical Insurance
3. **Fill out** medical quote form
4. **Submit** as manual quote
5. **Verify**:
   - Quote appears in Quotations screen
   - Status shows as "Pending Admin Review"
   - Can view quote details
   - API calls succeed with 200 status

## Success Criteria

✅ No 401 errors when app loads without authentication
✅ Console shows skip messages when not authenticated
✅ App remains functional (doesn't crash)
✅ API calls work normally when authenticated
✅ Manual medical quotes can be submitted successfully
