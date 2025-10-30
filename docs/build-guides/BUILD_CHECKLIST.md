# PataBima APK Build Checklist

## Pre-Build Verification ✅

### 1. **App Configuration**
- [x] App name: "PataBima Agency"
- [x] Version: 1.0.0
- [x] Bundle ID: com.patabima.agent
- [x] Target SDK: 34 (Android 14)

### 2. **Icons & Assets**
- [x] Main icon: ./assets/icon.png
- [x] Adaptive icon: ./assets/adaptive-icon.png
- [x] Splash screen: ./assets/splash-icon.png
- [x] Brand colors: #D5222B (PataBima Red)

### 3. **Build Profiles**
- [x] Development: APK for testing
- [x] Preview: APK for internal distribution
- [x] Production: AAB for Play Store
- [x] Production-APK: APK for production testing

### 4. **Permissions**
- [x] Camera access
- [x] Storage access
- [x] Internet access
- [x] Network state

## Build Commands

### **For Testing (Preview APK)**
```bash
npm run build:android
# or
eas build --platform android --profile preview
```

### **For Production APK**
```bash
npm run build:android:production
# or
eas build --platform android --profile production-apk
```

### **For Play Store (AAB)**
```bash
npm run build:android:aab
# or
eas build --platform android --profile production
```

## Build Process

1. **Login to EAS**: `eas login`
2. **Select Profile**: Choose appropriate build profile
3. **Monitor Build**: Track progress on Expo dashboard
4. **Download APK**: Get from Expo dashboard or CLI

## Post-Build Testing

- [ ] Install APK on test device
- [ ] Test core functionality
- [ ] Verify app icon and splash screen
- [ ] Test camera permissions
- [ ] Test offline functionality
- [ ] Performance testing

## Production Deployment

- [ ] Test APK thoroughly
- [ ] Generate signed AAB for Play Store
- [ ] Upload to Google Play Console
- [ ] Configure store listing
- [ ] Submit for review

## Troubleshooting

### Common Issues:
1. **Build fails**: Check dependencies and Expo SDK compatibility
2. **Icon issues**: Ensure proper icon sizes and formats
3. **Permission errors**: Verify android permissions in app.json
4. **Signing issues**: Check EAS credentials

### Support:
- Expo Documentation: https://docs.expo.dev/
- EAS Build: https://docs.expo.dev/build/introduction/
- Android Guidelines: https://developer.android.com/distribute
