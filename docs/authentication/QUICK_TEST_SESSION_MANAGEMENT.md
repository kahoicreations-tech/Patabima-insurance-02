# Quick Test Guide: Silent Session Management

## 🚀 Quick Start Testing

### Test 1: Normal Login (2 minutes)
```bash
1. Open app
2. Enter phone: 712345678
3. Enter password: test123
4. Enter OTP from console
5. ✅ Should navigate to Dashboard
6. ✅ No "Session Locked" modal should appear
```

**Expected Console Logs:**
```
[DjangoAPIService] Token loaded: eyJhbGciOiJIUzI1Ni...
Tokens stored successfully and session monitoring started
[DjangoAPIService] Starting session monitoring
User authenticated via backend check
```

---

### Test 2: Proactive Token Refresh (Simulated)

**Option A: Wait 25 Minutes**
```bash
1. Login successfully
2. Wait 25 minutes (token expires at 30min)
3. ✅ Should see silent refresh in console
4. ✅ App continues working normally
```

**Option B: Mock Token Expiry (Faster)**
```javascript
// In Chrome DevTools or React Native Debugger:
import SecureTokenStorage from './frontend/services/SecureTokenStorage';

// Manually set token to expire soon
await SecureTokenStorage.storeTokens(
  'your_access_token',
  'your_refresh_token',
  { userRole: 'AGENT' },
  new Date(Date.now() + 4 * 60 * 1000) // Expires in 4 minutes
);

// Wait 1 minute, monitoring will trigger refresh
```

**Expected Console Logs:**
```
[DjangoAPIService] Token expiring soon, refreshing proactively
[DjangoAPIService] Attempting to refresh access token
[DjangoAPIService] Token refreshed successfully
[AuthContext] Token refreshed silently
```

---

### Test 3: Session Expiry (Invalid Refresh Token)

**Steps:**
```bash
1. Login successfully
2. In Chrome DevTools, corrupt the refresh token:
   await SecureTokenStorage.storeTokens(
     'valid_access_token',
     'invalid_refresh_token_abc123',
     { userRole: 'AGENT' }
   );
3. Wait 30 seconds for monitoring check
4. ✅ Should navigate to Login screen (no modal)
5. ✅ No blocking popup
```

**Expected Console Logs:**
```
[DjangoAPIService] Token refresh failed: {"detail":"Token is invalid or expired"}
[AuthContext] Session expired - silent cleanup
Tokens cleared successfully and session monitoring stopped
```

---

### Test 4: App Restart with Valid Session

**Steps:**
```bash
1. Login successfully
2. Close app completely (swipe away)
3. Reopen app after 1 minute
4. ✅ Should automatically restore session
5. ✅ Should navigate to Dashboard (no login needed)
```

**Expected Console Logs:**
```
[DjangoAPIService] Token found: YES
[DjangoAPIService] Refresh token found: YES
[AuthContext] Session restored successfully
User authenticated via backend check
```

---

### Test 5: App Restart with Expired Session

**Steps:**
```bash
1. Login successfully
2. Close app
3. Wait 31 minutes (token fully expired)
4. Reopen app
5. ✅ Should attempt silent refresh
6. If refresh fails: Navigate to Login (no modal)
```

**Expected Console Logs:**
```
[AuthContext] Token expired, attempting silent refresh
[DjangoAPIService] Attempting to refresh access token
[DjangoAPIService] Token refreshed successfully
User authenticated via backend check
```

---

## 🔍 Debug Commands

### Check Current Token Status
```javascript
// React Native Debugger / Chrome DevTools
import SecureTokenStorage from './frontend/services/SecureTokenStorage';

// Check if token exists
const accessToken = await SecureTokenStorage.getAccessToken();
console.log('Access Token:', accessToken ? 'EXISTS' : 'NONE');

// Check if expiring soon
const expiringSoon = await SecureTokenStorage.isTokenExpiringSoon();
console.log('Expiring Soon:', expiringSoon);

// Check if expired
const expired = await SecureTokenStorage.isTokenExpired();
console.log('Expired:', expired);

// Get session age
const sessionAge = await SecureTokenStorage.getSessionAge();
console.log('Session Age:', sessionAge, 'ms');
```

### Enable Detailed Logging
```javascript
// Add to App.js or before testing
import DjangoAPIService from './frontend/services/DjangoAPIService';
DjangoAPIService.enableDebug();
```

### Manual Token Refresh
```javascript
// Force a refresh
const success = await DjangoAPIService.refreshTokenFlow();
console.log('Refresh Success:', success);
```

### Check Monitoring Status
```javascript
// Monitoring runs every 30 seconds
// Look for logs like:
[DjangoAPIService] Token expiring soon, refreshing proactively
// OR
[DjangoAPIService] Session monitoring check completed
```

---

## ❌ Common Issues & Fixes

### Issue 1: "Session Locked" modal still appears
**Cause:** Old AuthContext code cached  
**Fix:**
```bash
# Clear Metro bundler cache
npx expo start --clear
# OR
rm -rf node_modules/.cache
```

### Issue 2: Token not refreshing automatically
**Check:**
```javascript
// 1. Is monitoring started?
DjangoAPIService._monitoringInterval !== null

// 2. Are tokens stored?
const token = await SecureTokenStorage.getAccessToken();
const refresh = await SecureTokenStorage.getRefreshToken();

// 3. Is token expiring soon?
const expiringSoon = await SecureTokenStorage.isTokenExpiringSoon();
console.log('Expiring Soon:', expiringSoon);
```

**Fix:**
```javascript
// Manually start monitoring if needed
DjangoAPIService.startSessionMonitoring();
```

### Issue 3: Session lost on app restart
**Check:**
```javascript
// 1. Is DjangoAPIService.initialize() called in App.js?
// Should be in useEffect on app mount

// 2. Are tokens in SecureStorage?
import * as SecureStore from 'expo-secure-store';
const token = await SecureStore.getItemAsync('access_token');
console.log('Secure Token:', token ? 'EXISTS' : 'NONE');
```

**Fix:** Ensure App.js has:
```javascript
useEffect(() => {
  DjangoAPIService.initialize();
}, []);
```

### Issue 4: "Network request failed" on refresh
**Cause:** Backend not running or wrong URL  
**Check:**
```javascript
console.log('Base URL:', DjangoAPIService.baseUrl);
// Should be: http://10.0.2.2:8000 (Android emulator)
// Or: http://localhost:8000 (iOS simulator/web)
```

**Fix:** Ensure Django backend is running:
```bash
cd insurance-app
python manage.py runserver
```

---

## ✅ Success Indicators

### What to Look For:
- ✅ **No "Session Locked" modal ever appears**
- ✅ **Console shows proactive refresh logs** (every ~25 minutes)
- ✅ **App works continuously without interruption**
- ✅ **Session persists across app restarts** (if token valid)
- ✅ **Silent logout only on complete failure** (invalid refresh token)
- ✅ **User never manually clicks "Go to Login"**

### What NOT to See:
- ❌ Modal popup blocking the screen
- ❌ Sudden navigation to Login during form filling
- ❌ 401 errors in console (should auto-refresh before that)
- ❌ "Auth locked" state or messages
- ❌ User confusion about session status

---

## 📊 Performance Metrics

### Expected Behavior:
- **Monitoring Interval**: Every 30 seconds
- **Proactive Refresh**: 5 minutes before expiry (at 25-minute mark)
- **Request Queue Time**: < 2 seconds during refresh
- **Storage Operations**: < 50ms per call
- **Session Restore**: < 1 second on app restart

### Monitor These:
```javascript
// Session age when refresh triggered
const sessionAge = await SecureTokenStorage.getSessionAge();
// Should be ~25 minutes (1,500,000 ms)

// Refresh success rate
// Track in production with analytics:
DjangoAPIService.setOnTokenRefreshed(() => {
  analytics.track('token_refresh_success');
});

DjangoAPIService.setOnSessionExpired(() => {
  analytics.track('session_expired');
});
```

---

## 🎯 Critical Test Scenarios

### Scenario 1: Agent Filling Motor Quote (15 minutes)
```
1. Login as agent
2. Navigate to Motor Insurance
3. Start filling comprehensive quote form
4. Spend 10 minutes entering vehicle details
5. Wait at pricing comparison screen for 20 minutes
6. ✅ Token refreshes silently at 25-minute mark
7. ✅ Agent completes quote without interruption
8. ✅ Submit quote successfully
```

### Scenario 2: Multiple Tabs/Windows (Web)
```
1. Login in Browser Tab 1
2. Open app in Browser Tab 2
3. Both tabs use same SecureStorage (shared)
4. Token refreshes in Tab 1
5. ✅ Tab 2 should also get new token
6. ✅ Both continue working
```

### Scenario 3: Network Interruption During Refresh
```
1. Login successfully
2. Wait 25 minutes (near token expiry)
3. Enable airplane mode
4. Monitoring tries to refresh (fails silently)
5. Disable airplane mode
6. ✅ Next monitoring cycle succeeds
7. ✅ Token refreshed
8. ✅ User never knows there was an issue
```

---

## 📝 Test Checklist

Copy this checklist for thorough testing:

```
□ Login flow works (OTP verification)
□ Tokens stored in SecureStorage
□ Session monitoring starts automatically
□ No "Session Locked" modal on login
□ Proactive refresh at 25 minutes (wait or simulate)
□ Console shows refresh logs
□ App continues working during refresh
□ Session persists on app restart (valid token)
□ Silent logout on invalid refresh token
□ Navigate to Login naturally (no modal)
□ Multiple form fills without interruption
□ Network failure recovery works
□ Logout clears all tokens
□ Session monitoring stops on logout
□ Debug logging shows expected messages
```

---

**Estimated Total Test Time**: ~45 minutes (with simulations)  
**Critical Path Test**: ~5 minutes (basic login + simulated refresh)  
**Full Regression**: ~2 hours (all scenarios, real timing)
