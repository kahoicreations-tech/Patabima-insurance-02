# Migration to Hybrid Managed Workflow - PataBima Insurance App

## Overview

**Current State**: Expo Go (SDK 53) - Limited to Expo-compatible libraries only  
**Target State**: Hybrid Managed (Development Build) - Custom native code + Expo benefits  
**Timeline**: 2-3 days  
**Risk Level**: Medium (requires thorough testing)

---

## Why Migrate to Hybrid Managed?

### Current Limitations (Expo Go)
❌ Cannot use custom native modules (e.g., advanced payment SDKs)  
❌ Cannot modify `AndroidManifest.xml` or `Info.plist`  
❌ Limited to Expo's pre-included native dependencies  
❌ Cannot integrate M-PESA native SDKs or USSD push  
❌ Cannot use `react-native-memoize-one` (current bundling issue)  
❌ Limited offline capabilities  

### Benefits of Hybrid Managed
✅ Full native code access (Java/Kotlin for Android, Swift/Obj-C for iOS)  
✅ Custom native modules and libraries  
✅ Modify native configurations (permissions, capabilities)  
✅ Keep Expo's OTA updates and EAS Build  
✅ Integrate Kenya payment gateways (M-PESA, DPO Pay native SDKs)  
✅ Advanced offline support with native SQLite  
✅ Better performance for complex insurance calculations  

---

## Pre-Migration Checklist

### 1. Backup Current Working State
```bash
# Create a backup branch
git checkout -b backup/expo-go-sdk53
git push origin backup/expo-go-sdk53

# Create working branch for migration
git checkout main
git pull origin main
git checkout -b feature/hybrid-managed-migration
```

### 2. Document Current Configuration
- [ ] List all Expo Go dependencies in `package.json`
- [ ] Document current app.json/app.config.js settings
- [ ] Record all environment variables (.env files)
- [ ] Export sample test data from Django backend
- [ ] Screenshot all working screens for comparison

### 3. Environment Setup
- [ ] Install latest Node.js (v20 LTS recommended)
- [ ] Install EAS CLI: `npm install -g eas-cli`
- [ ] Login to Expo account: `eas login`
- [ ] Verify Android Studio installed (for Android builds)
- [ ] Verify Xcode installed (for iOS builds, macOS only)

---

## Migration Steps

### Phase 1: Generate Native Projects (30 minutes)

#### Step 1.1: Run Prebuild
```bash
cd frontend

# Generate android/ and ios/ directories
npx expo prebuild --clean

# This creates:
# - frontend/android/ (Android Studio project)
# - frontend/ios/ (Xcode project)
# - Modifies package.json with native dependencies
```

**Expected Output**:
```
✔ Created native projects | /android, /ios
✔ Updated package.json
✔ Config synced
```

#### Step 1.2: Review Generated Files
```bash
# Check android/ structure
ls -la android/

# Check iOS/ structure (macOS only)
ls -la ios/

# Verify gitignore excludes build artifacts
cat .gitignore | grep -E "android|ios"
```

**Important**: Add to `.gitignore` if missing:
```gitignore
# Native directories (will be regenerated)
android/
ios/

# Build outputs
*.apk
*.aab
*.ipa

# Native build artifacts
.gradle/
.expo/
```

#### Step 1.3: Update `package.json` Scripts
```json
{
  "scripts": {
    "start": "expo start --dev-client",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "prebuild": "expo prebuild --clean",
    "build:dev-client:android": "eas build --profile development --platform android",
    "build:dev-client:ios": "eas build --profile development --platform ios",
    "build:preview:android": "eas build --profile preview --platform android",
    "build:production:android": "eas build --profile production --platform android",
    "build:production:ios": "eas build --profile production --platform ios"
  }
}
```

---

### Phase 2: Configure EAS Build (45 minutes)

#### Step 2.1: Initialize EAS Build
```bash
cd frontend
eas build:configure
```

**Prompts**:
- Would you like to automatically create an EAS project? → **Yes**
- Generate a new Android Keystore? → **Yes** (production builds)
- App bundle or APK? → **APK** (for testing), **AAB** (for Play Store)

#### Step 2.2: Update `eas.json`
```json
{
  "cli": {
    "version": ">= 5.9.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "gradleCommand": ":app:assembleDebug",
        "buildType": "apk"
      },
      "ios": {
        "buildConfiguration": "Debug",
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      },
      "ios": {
        "simulator": false
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./secrets/play-store-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

#### Step 2.3: Configure App Signing (Android)
```bash
# Let EAS manage keystore (recommended)
# Keystore will be stored in Expo's secure infrastructure

# Or use existing keystore
# Place keystore in frontend/secrets/patabima-release.keystore
# Update eas.json with credentials path
```

---

### Phase 3: Install Development Build (1 hour)

#### Step 3.1: Build Development Client
```bash
cd frontend

# Android development build
eas build --profile development --platform android

# iOS development build (macOS with Xcode required)
eas build --profile development --platform ios
```

**Build Time**: 10-20 minutes  
**Output**: Download link for `.apk` (Android) or `.ipa` (iOS)

#### Step 3.2: Install on Device/Emulator

**Android**:
```bash
# Option 1: Scan QR code from EAS build page
# Option 2: Download APK and install manually
adb install -r patabima-dev-client.apk

# Option 3: Use EAS CLI
eas build:run --profile development --platform android
```

**iOS** (macOS + physical device):
```bash
# Download from EAS build page
# Open in Xcode and run on device
```

#### Step 3.3: Start Development Server
```bash
cd frontend

# Start Metro bundler for dev client
npx expo start --dev-client

# Press 'a' for Android
# Press 'i' for iOS
```

**Expected**: App opens in custom dev client (not Expo Go)

---

### Phase 4: Fix Native Dependencies (2 hours)

#### Step 4.1: Resolve `memoize-one` Issue
```bash
# Install peer dependencies
cd frontend
npm install memoize-one --save

# Regenerate native projects
npx expo prebuild --clean

# Rebuild dev client
eas build --profile development --platform android
```

#### Step 4.2: Add Custom Native Modules (Optional)

**Example: M-PESA Daraja API (Native)**
```bash
# Install React Native M-PESA library
npm install react-native-mpesa-sdk

# Link native module (auto with expo-modules)
npx expo prebuild --clean

# Configure in app.json
```

**app.json** additions:
```json
{
  "expo": {
    "plugins": [
      [
        "react-native-mpesa-sdk",
        {
          "consumerKey": "YOUR_CONSUMER_KEY",
          "consumerSecret": "YOUR_CONSUMER_SECRET"
        }
      ]
    ],
    "android": {
      "permissions": [
        "INTERNET",
        "ACCESS_NETWORK_STATE",
        "READ_PHONE_STATE"
      ]
    }
  }
}
```

#### Step 4.3: Test All Screens
- [ ] Login/OTP flow
- [ ] Motor 2 quotation flow (all 60+ products)
- [ ] Underwriter comparison
- [ ] Payment (M-PESA simulation)
- [ ] Policy generation
- [ ] Upcoming Renewals
- [ ] Upcoming Extensions
- [ ] Claims submission
- [ ] My Account

---

### Phase 5: Update CI/CD (1 hour)

#### Step 5.1: Create GitHub Actions Workflow

**`.github/workflows/eas-build.yml`**:
```yaml
name: EAS Build

on:
  push:
    branches:
      - main
      - develop
  pull_request:
    branches:
      - main

jobs:
  build-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      
      - name: Install dependencies
        working-directory: frontend
        run: npm ci
      
      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      
      - name: Build Android Preview
        working-directory: frontend
        run: eas build --profile preview --platform android --non-interactive

  build-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      
      - name: Install dependencies
        working-directory: frontend
        run: npm ci
      
      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      
      - name: Build iOS Preview
        working-directory: frontend
        run: eas build --profile preview --platform ios --non-interactive
```

#### Step 5.2: Add GitHub Secrets
1. Go to repository Settings → Secrets → Actions
2. Add `EXPO_TOKEN`:
   ```bash
   # Generate token locally
   eas login
   eas build:configure
   # Copy token from ~/.expo/state.json
   ```

---

### Phase 6: OTA Updates Configuration (30 minutes)

#### Step 6.1: Configure `expo-updates`

**app.json**:
```json
{
  "expo": {
    "updates": {
      "enabled": true,
      "checkAutomatically": "ON_LOAD",
      "fallbackToCacheTimeout": 0,
      "url": "https://u.expo.dev/YOUR_PROJECT_ID"
    },
    "runtimeVersion": {
      "policy": "sdkVersion"
    }
  }
}
```

#### Step 6.2: Publish OTA Update
```bash
cd frontend

# Publish update to production channel
eas update --branch production --message "Fix motor pricing calculation"

# Publish to preview channel
eas update --branch preview --message "Test new underwriter integration"
```

**Users get updates**:
- On app restart (if `checkAutomatically: "ON_LOAD"`)
- Immediately for critical fixes (force restart)

---

### Phase 7: Production Deployment (2 hours)

#### Step 7.1: Build Production APK/AAB
```bash
cd frontend

# Android App Bundle (Google Play Store)
eas build --profile production --platform android

# iOS (App Store)
eas build --profile production --platform ios
```

#### Step 7.2: Test Production Build
1. Download production APK from EAS
2. Install on physical device
3. Test all flows with real backend (EC2)
4. Verify M-PESA live credentials work
5. Generate real policy documents

#### Step 7.3: Submit to App Stores

**Google Play Console**:
```bash
# Submit AAB automatically
eas submit --platform android --latest

# Or manual upload to play.google.com/console
```

**Apple App Store**:
```bash
# Submit IPA automatically
eas submit --platform ios --latest

# Or use Xcode Organizer
```

---

## Post-Migration Tasks

### 1. Update Documentation
- [ ] Update `README.md` with new build commands
- [ ] Document development client installation steps
- [ ] Update deployment guide for EAS Build
- [ ] Create troubleshooting guide for native issues

### 2. Team Training
- [ ] Train developers on `npx expo run:android` workflow
- [ ] Explain difference between Expo Go and dev client
- [ ] Show how to add native modules
- [ ] Demonstrate EAS Build process

### 3. Monitoring Setup
- [ ] Enable Sentry for crash reporting
- [ ] Set up Firebase Analytics
- [ ] Monitor OTA update adoption rates
- [ ] Track native crash reports

---

## Rollback Plan

If migration fails:

```bash
# 1. Restore backup branch
git checkout backup/expo-go-sdk53

# 2. Reinstall dependencies
cd frontend
rm -rf node_modules package-lock.json
npm install

# 3. Start Expo Go
npm start

# 4. Test on Expo Go app
# Scan QR code with Expo Go app
```

---

## Common Issues & Solutions

### Issue 1: `memoize-one` still not resolving
**Solution**:
```bash
# Clear all caches
cd frontend
rm -rf node_modules .expo android ios
npm install
npx expo prebuild --clean
eas build --profile development --platform android --clear-cache
```

### Issue 2: "Unable to resolve module" errors
**Solution**:
```bash
# Install missing peer dependencies
npm install <missing-package> --save

# Regenerate native projects
npx expo prebuild --clean
```

### Issue 3: Build fails on EAS
**Solution**:
```bash
# Check build logs
eas build:list

# View detailed logs
eas build:view <build-id>

# Common fixes:
# - Update eas.json build profiles
# - Verify package.json has correct versions
# - Check for conflicting native modules
```

### Issue 4: OTA updates not working
**Solution**:
```bash
# Verify runtimeVersion matches
# In app.json:
"runtimeVersion": "1.0.0"

# Publish with correct branch
eas update --branch production --message "Fix"

# Force app restart to check for updates
```

---

## Success Criteria

Migration is complete when:

✅ Development client installs and runs on Android/iOS  
✅ All 60+ motor insurance products work correctly  
✅ M-PESA payment integration functions (with live credentials)  
✅ Policy PDF generation works  
✅ Renewals and extensions flow operates  
✅ Claims submission completes successfully  
✅ OTA updates deploy without reinstalling app  
✅ Production build passes all tests  
✅ App Store/Play Store submissions accepted  

---

## Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Prebuild | 30 min | Node.js, Expo CLI |
| Phase 2: EAS Config | 45 min | EAS CLI, Expo account |
| Phase 3: Dev Build | 1 hour | EAS Build server |
| Phase 4: Fix Dependencies | 2 hours | Testing all screens |
| Phase 5: CI/CD | 1 hour | GitHub secrets |
| Phase 6: OTA Updates | 30 min | expo-updates config |
| Phase 7: Production | 2 hours | App Store accounts |
| **Total** | **~8 hours** | Spread over 2-3 days |

---

## Next Steps

1. **Review this document** with the team
2. **Schedule migration window** (low-traffic period)
3. **Backup production database** before deployment
4. **Create feature branch**: `feature/hybrid-managed-migration`
5. **Start with Phase 1**: Run `npx expo prebuild --clean`
6. **Test incrementally**: Don't skip testing phases
7. **Document issues**: Keep migration log for future reference

---

## Resources

- [Expo Development Builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Expo Prebuild](https://docs.expo.dev/workflow/prebuild/)
- [EAS Update](https://docs.expo.dev/eas-update/introduction/)
- [Migration Guide (Expo Go → Development Build)](https://docs.expo.dev/guides/adopting-prebuild/)

---

**Created**: November 3, 2025  
**Author**: GitHub Copilot  
**Status**: Ready for implementation  
**Priority**: High (resolves memoize-one bundling issue)
