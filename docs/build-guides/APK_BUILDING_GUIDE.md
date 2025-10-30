# PataBima App - APK Building Guide

This guide provides instructions for building and distributing the PataBima app APK.

## Prerequisites

- Node.js and npm installed
- Expo CLI (or EAS CLI) installed
- Expo account (for cloud builds)
- Git repository with the PataBima project

## Build Methods

### Option 1: EAS Build (Recommended)

EAS Build is the recommended approach for building APKs with Expo. It handles all the complexities of building native Android applications.

1. **Install EAS CLI**:
   ```bash
   npm install -g eas-cli
   ```

2. **Login to your Expo account**:
   ```bash
   eas login
   ```

3. **Configure the build profiles in eas.json**:
   ```json
   {
     "cli": {
       "version": ">= 5.3.0"
     },
     "build": {
       "development": {
         "developmentClient": true,
         "distribution": "internal"
       },
       "preview": {
         "distribution": "internal",
         "android": {
           "buildType": "apk",
           "gradleCommand": ":app:assembleRelease",
           "withoutCredentials": true
         }
       },
       "production": {
         "android": {
           "buildType": "app-bundle"
         }
       }
     }
   }
   ```

4. **Verify app.json configuration**:
   - Ensure icons are square images
   - Verify the package name is correct
   - Set the proper version number

5. **Build the APK**:
   ```bash
   npx eas build -p android --profile preview
   ```

6. **Download and Distribute**:
   - Wait for the build to complete
   - Download the APK from the provided URL
   - Share the APK with testers or upload to a distribution platform

### Option 2: Classic Expo Build System

For older Expo projects, you can use the classic build system:

1. **Install Expo CLI**:
   ```bash
   npm install -g expo-cli
   ```

2. **Build the APK**:
   ```bash
   expo build:android -t apk
   ```

3. **Download the APK** when the build completes.

## Troubleshooting Common Issues

### Icon/Splash Screen Issues

If build fails due to icon issues:
- Make sure all icons are square images
- Update app.json to point to correct icon files:
  ```json
  "icon": "./assets/PataLogo.png",
  "adaptiveIcon": {
    "foregroundImage": "./assets/PataLogo.png",
    "backgroundColor": "#ffffff"
  }
  ```

### Dependency Issues

If you encounter dependency problems:
- Remove deprecated packages:
  ```bash
  npm uninstall expo-permissions
  ```
- Update dependencies:
  ```bash
  npm update
  ```
- Fix issues with expo-doctor:
  ```bash
  npx expo-doctor
  ```

### Gradle Build Failures

If you encounter Gradle build errors:
1. Check the detailed logs in the Expo dashboard
2. Ensure your Android configuration is correct:
   ```json
   "android": {
     "package": "com.patabima.app",
     "versionCode": 1,
     "adaptiveIcon": {
       "foregroundImage": "./assets/PataLogo.png",
       "backgroundColor": "#ffffff"
     },
     "jsEngine": "hermes"
   }
   ```

## Testing the APK

1. **Install on an emulator**:
   - When prompted during the EAS build process, choose to install on an emulator
   - Or download the APK and install it manually

2. **Install on physical devices**:
   - Transfer the APK to the device
   - Enable "Install from Unknown Sources" in device settings
   - Open the APK file on the device to install

## Distribution Channels

- **Internal testing**: Share the direct download link from EAS
- **Google Play Store**: Upload the AAB file to Google Play Console
- **Enterprise distribution**: Host the APK on a private server or use MDM solutions

## Next Steps

1. Test the APK thoroughly on multiple devices
2. Gather feedback from users
3. Make necessary improvements
4. Prepare for production release with a signed AAB (Android App Bundle)

## APK Build URL

The latest APK build can be downloaded from:
https://expo.dev/accounts/kahoikreations/projects/PataBimaApp/builds/6489e602-ef07-4171-baa8-3f4fb10f4bc3
