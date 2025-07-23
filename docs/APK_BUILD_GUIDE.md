# PataBima App APK Build Guide

## APK Build Instructions

To build the APK for your PataBima app, follow these steps:

### Method 1: Build with EAS Build (Recommended)

1. **Build the APK using EAS Build:**

   ```bash
   npx eas build --platform android --profile preview
   ```

2. **Once the build is complete, you'll see a URL to download the APK.**
3. **Download and share the APK:**
   - Open the URL provided at the end of the build process
   - Download the APK file
   - Install it on Android devices for testing

### Method 2: Use Expo Classic Build (Alternative)

If you encounter issues with EAS Build, you can try the classic Expo build system:

1. **Install the global Expo CLI:**

   ```bash
   npm install -g expo-cli
   ```

2. **Start the APK build:**

   ```bash
   expo build:android -t apk
   ```

3. **Follow the prompts to create a keystore or use an existing one.**

4. **Once complete, download the APK from the provided URL.**

## Additional Information

### Current Build Status

- The app is configured to build with Hermes JavaScript engine for better performance
- The app includes all necessary permissions for camera and file storage
- The app is configured with the package name: com.patabima.app

### Troubleshooting Common Issues

- **Build failures:** Check Expo logs for detailed error information
- **App crashes:** Verify all native dependencies are properly installed
- **Performance issues:** Make sure you're using production builds for testing

### Distribution

After downloading your APK, you can distribute it via:

- Email attachment
- Google Drive sharing
- Direct USB transfer
- Enterprise MDM systems
- Google Play Store (requires a developer account)
