# Motor3 Integration Guide

## Step 1: Update Navigation

Add Motor3 to bottom tabs in `App.js`:

```javascript
import Motor3Container from "./screens/quotations/Motor3/Motor3Container";

// In Tab.Navigator:
<Tab.Screen
  name="Motor3"
  component={Motor3Container}
  options={{
    tabBarLabel: "Motor Insurance",
    tabBarIcon: ({ color, size }) => (
      <Icon name="car" size={size} color={color} />
    ),
  }}
/>;
```

## Step 2: Backend API Endpoints Required

Ensure these endpoints are available:

- `POST /api/v1/public_app/motor3/quotations/third-party/` - Create third-party quote
- `POST /api/v1/public_app/motor3/quotations/comprehensive/` - Create comprehensive quote
- `POST /api/v1/public_app/motor3/quotations/tor/` - Create TOR quote
- `POST /api/v1/public_app/integrations/vehicle_check` - Vehicle verification (DMVIC)
- `POST /api/v1/public_app/payments/initiate` - Initiate M-PESA / DPO payment
- `GET  /api/v1/public_app/payments/status?reference=...` - Payment status
- `POST /api/v1/public_app/docs/presign` - Document upload presign
- `POST /api/v1/public_app/docs/submit` - Submit extraction job
- `GET  /api/v1/public_app/docs/status/<job_id>` - Job status
- `GET  /api/v1/public_app/docs/result/<job_id>` - Extraction result

## Step 3: Environment Variables

Ensure `.env.local` contains:

```
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8000
```

For production:

```
EXPO_PUBLIC_API_BASE_URL=https://api.hugo-shopping.com
```

## Step 4: Test Locally

### Start Django Backend

```powershell
cd insurance-app
python manage.py runserver 0.0.0.0:8000
```

### Start Expo

```powershell
cd frontend
npx expo start --clear
```

### Run on Android Emulator

Press `a` in Metro terminal

## Step 5: Performance Monitoring

Use React DevTools Profiler to verify:

- <2 renders per keystroke (target achieved)
- No unnecessary re-renders during typing
- Fast underwriter comparison (<2s)

### How to Profile:

1. Install React DevTools: `npm install -g react-devtools`
2. Run `react-devtools` in terminal
3. Open app, navigate to Motor3
4. Start profiling, type in forms
5. Stop profiling, analyze render counts

## Step 6: Gradual Rollout

### Week 1: Internal Testing

- QA team tests all 60+ products
- Performance validation
- Bug fixes

### Week 2: Beta Testing

- 10 selected agents test in production
- Collect feedback
- Monitor crash reports

### Week 3: Partial Rollout

- 50% traffic to Motor3
- 50% traffic to Motor2 (fallback)
- Monitor performance metrics

### Week 4: Full Rollout

- 100% traffic to Motor3
- Motor2 available as fallback

## Step 7: Motor2 Deprecation Plan

### After 2 Weeks of Stable Motor3:

1. Monitor Motor3 adoption metrics
2. If <5 critical bugs, proceed with deprecation
3. Archive Motor2 to `_archive/frontend/Motor2-deprecated-[date]`
4. Update all documentation to reference Motor3
5. Remove Motor2 from bottom tabs

### Deprecation Criteria:

- Zero critical bugs
- <10 minor bugs
- Performance targets met (<2 renders/keystroke)
- Positive agent feedback
- All 60+ products tested

## Step 8: Rollback Plan

If critical issues found:

### Immediate Rollback:

```javascript
// In App.js, switch back to Motor2
import Motor2Container from "./screens/quotations/Motor2/Motor2Container";

<Tab.Screen name="Motor" component={Motor2Container} />;
```

### Investigation Steps:

1. Collect crash reports and error logs
2. Identify root cause
3. Create hotfix branch
4. Fix and test thoroughly
5. Redeploy with proper testing

### Rollback Triggers:

- > 10 crashes per hour
- Payment failures
- Data loss incidents
- Complete app freeze
- Backend integration failures

## Monitoring & Metrics

### Key Metrics to Track:

- Render count per keystroke (target: <2)
- Underwriter comparison time (target: <2s)
- Quote submission success rate (target: >95%)
- Payment completion rate (target: >90%)
- Agent satisfaction score (target: >4/5)

### Tools:

- React DevTools Profiler (render counts)
- Firebase Crashlytics (crash reports)
- Google Analytics (user flows)
- Backend logs (API response times)

## Support & Documentation

### For Agents:

- User guide in app (Help section)
- Video tutorials for complex flows
- In-app chat support

### For Developers:

- Code documentation in `docs/MOTOR3_ARCHITECTURE.md`
- API documentation in `docs/API_INTEGRATION.md`
- Component library in `docs/COMPONENT_LIBRARY.md`

## Success Criteria

Motor3 is considered successful when:

- ✅ <2 renders per keystroke achieved
- ✅ Zero keyboard dismissal issues
- ✅ All 60+ products working correctly
- ✅ Payment success rate >90%
- ✅ Agent satisfaction >4/5
- ✅ <5 critical bugs in production
