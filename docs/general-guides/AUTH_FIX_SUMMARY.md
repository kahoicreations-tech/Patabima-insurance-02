# Authentication Fix - Race Condition Resolved

## Problem Identified

**401 Unauthorized errors on app startup** due to race condition between `AuthContext` and `AppDataContext`:

```
Console Error:
[usersAPI] Get current user error: Authentication locked. Please login again.
Unauthorized: /api/v1/public_app/user/get_current_user
Unauthorized: /api/v1/policies/motor/upcoming-renewals/
Unauthorized: /api/v1/policies/motor/upcoming-extensions/
Unauthorized: /api/insurance/claims
Unauthorized: /api/v1/public_app/campaigns
```

## Root Cause

**Race Condition Timeline:**

1. ✅ `App.js` renders → `AuthProvider` mounts → starts `checkAuthStatus()`
2. ✅ `AppDataProvider` mounts → calls `djangoAPI.initialize()` → loads token from storage
3. ❌ `djangoAPI.isAuthenticated()` returns `true` (token exists in memory)
4. ❌ `AppDataProvider` starts fetching user data **BEFORE** `AuthContext.checkAuthStatus()` completes
5. ❌ Result: **401 Unauthorized** because backend verification hasn't completed yet

### Why This Happened

`AppDataContext` was using `djangoAPI.isAuthenticated()` which only checks if a token exists in memory, not whether it's been validated by the backend. The token could be expired, invalid, or not yet verified when the check runs.

## Solution Implemented

### Changes to `frontend/contexts/AppDataContext.js`

**1. Import `useAuth` hook:**

```javascript
import { useAuth } from "./AuthContext";
```

**2. Get auth state from `AuthContext`:**

```javascript
export const AppDataProvider = ({ children }) => {
  // Get auth state from AuthContext
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  // ... rest of code
```

**3. Wait for auth completion before fetching:**

```javascript
useEffect(() => {
  // ... initialize Django API ...

  // Wait for auth check to complete
  if (authLoading) {
    console.log("[AppDataContext] ⏳ Waiting for auth check to complete...");
    return;
  }

  // Only fetch data if user is authenticated
  if (!isAuthenticated) {
    console.log(
      "[AppDataContext] ⚠️ Skipping data fetch - user not authenticated"
    );
    return;
  }

  console.log("[AppDataContext] ✅ User authenticated - fetching data...");
  // ... fetch user and other data ...
}, [isAuthenticated, authLoading]); // Re-run when auth state changes
```

## What Changed

### Before (❌ Race Condition)

```javascript
// AppDataContext would check:
if (!djangoAPI.isAuthenticated()) {
  // Skip fetching - but this returns true as soon as token is loaded!
}
// Starts fetching immediately, before backend verification
```

### After (✅ Synchronized)

```javascript
// AppDataContext now waits for:
// 1. authLoading === false (AuthContext finished checking)
// 2. isAuthenticated === true (Backend verified the token)
if (authLoading) {
  return; // Wait for auth check
}
if (!isAuthenticated) {
  return; // User not logged in
}
// Only fetch data after backend verification complete
```

## Expected Behavior After Fix

### Successful Login Flow

1. ✅ User enters phone number → OTP sent
2. ✅ User enters OTP → Backend returns JWT tokens
3. ✅ `AuthContext.checkAuthStatus()` verifies token with backend
4. ✅ `isAuthenticated` becomes `true`, `authLoading` becomes `false`
5. ✅ `AppDataContext` effect triggers (dependency changed)
6. ✅ User data, policies, renewals, extensions fetched successfully
7. ✅ **No 401 errors** 🎉

### App Restart with Valid Token

1. ✅ App loads → `AuthContext` checks stored token
2. ✅ Token validated with backend (`/api/v1/public_app/user/get_current_user`)
3. ✅ `isAuthenticated` = `true`, `authLoading` = `false`
4. ✅ `AppDataContext` fetches data
5. ✅ User sees dashboard with data

### App Restart with Expired Token

1. ✅ App loads → `AuthContext` checks stored token
2. ✅ Token expired → Silent refresh attempted
3. ❌ Refresh fails → Clear tokens, set `isAuthenticated` = `false`
4. ✅ `AppDataContext` skips fetching (user not authenticated)
5. ✅ User redirected to login screen
6. ✅ **No 401 errors in console** 🎉

## Testing Instructions

### 1. Restart the React Native App

```bash
# Stop the current Expo server (Ctrl+C in terminal)
# Clear React Native cache
cd frontend
npm start -- --clear
```

### 2. Test Fresh Login

1. Open the app (should show login screen)
2. Enter phone number: `0708163485`
3. Enter any OTP (test mode accepts any code)
4. Watch console logs:
   ```
   [AuthContext] Tokens found, checking expiry...
   [AuthContext] User authenticated via backend check
   [AppDataContext] ✅ User authenticated - fetching data...
   ```
5. **Expected:** No 401 errors, dashboard loads successfully

### 3. Test App Restart (Token Persistence)

1. Close the app completely
2. Reopen the app
3. Watch console logs:
   ```
   [AuthContext] Checking for tokens...
   [AuthContext] Tokens found, verifying with backend...
   [AppDataContext] ⏳ Waiting for auth check to complete...
   [AuthContext] User authenticated via backend check
   [AppDataContext] ✅ User authenticated - fetching data...
   ```
4. **Expected:** Automatically logged in, no 401 errors

### 4. Test Logout

1. Navigate to My Account
2. Tap "Logout"
3. Watch console logs:
   ```
   [AuthContext] Clearing tokens...
   [AppDataContext] ⚠️ Skipping data fetch - user not authenticated
   ```
4. **Expected:** Redirected to login screen, no crashes

## Console Log Reference

### ✅ Correct Flow (After Fix)

```
[App] Starting initialization...
[App] Preparation complete
[AuthContext] useEffect: Initializing auth...
[AppDataContext] useEffect: Starting initialization...
[AuthContext] Starting checkAuthStatus...
[AppDataContext] Initializing Django API...
[AppDataContext] Django API initialized
[AppDataContext] ⏳ Waiting for auth check to complete...
[AuthContext] Checking for tokens...
[AuthContext] Tokens found, checking expiry...
[AuthContext] Verifying token with backend...
[AuthContext] User authenticated via backend check
[AuthContext] Setting isLoading = false
[AppDataContext] ✅ User authenticated - fetching data...
[AppDataContext] Fetching user...
[AppDataContext] User fetch complete
[AppDataContext] Scheduling deferred data fetch...
✅ ALL API CALLS SUCCEED - NO 401 ERRORS
```

### ❌ Incorrect Flow (Before Fix)

```
[AuthContext] Starting checkAuthStatus...
[AppDataContext] Initializing Django API...
[AppDataContext] Fetching user...
❌ Unauthorized: /api/v1/public_app/user/get_current_user
❌ Unauthorized: /api/v1/policies/motor/upcoming-renewals/
❌ Unauthorized: /api/v1/policies/motor/upcoming-extensions/
[AuthContext] User authenticated via backend check (completes AFTER errors)
```

## Files Modified

- **`frontend/contexts/AppDataContext.js`**
  - Added `import { useAuth } from './AuthContext'`
  - Added `const { isAuthenticated, isLoading: authLoading } = useAuth()`
  - Updated useEffect to check `authLoading` and `isAuthenticated`
  - Changed dependencies from `[]` to `[isAuthenticated, authLoading]`

## Related Issues Fixed

This fix resolves:

- ✅ 401 errors on app startup
- ✅ "Authentication locked. Please login again" errors
- ✅ Premature API calls before token validation
- ✅ Race condition between AuthContext and AppDataContext
- ✅ Console spam with unauthorized requests

## Important Notes

1. **Backend is correct** - The 401 responses are working as designed
2. **Frontend was calling APIs too early** - Fixed by synchronizing with auth state
3. **No changes needed to login flow** - OTP and token storage work correctly
4. **Existing auth logic intact** - Only changed when data fetching starts

## Verification Checklist

After restarting the app:

- [ ] No 401 errors in console during app startup
- [ ] Login flow works without errors
- [ ] Dashboard loads after login
- [ ] Upcoming Renewals tab shows data
- [ ] Upcoming Extensions tab shows data (with correct amounts: 4200/2800/7000)
- [ ] Claims tab loads
- [ ] My Account screen shows user info
- [ ] Logout works correctly
- [ ] App restart with valid token auto-logs in

---

**Status:** ✅ Fix implemented and ready for testing
**Next Step:** Restart React Native app and verify no 401 errors
