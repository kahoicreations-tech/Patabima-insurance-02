# Android APK Build Guide (Expo/EAS)

This guide shows how to generate an Android APK for PataBima using Expo and EAS on Windows (PowerShell). It also covers keystore handling, environment variables, versioning, and common troubleshooting.

> Note: For publishing on Google Play, Google recommends Android App Bundles (AAB). APK is still fine for testing and direct distribution. We’ll generate an APK via EAS buildType=apk.

## Prerequisites

- Node.js LTS and npm installed
- Expo CLI and EAS CLI installed globally
- An Expo account (for EAS cloud builds)
- Android SDK/Emulator optional (for local install/testing)

```pwsh
# Install (or update) Expo and EAS CLI
npm i -g expo-cli eas-cli

# Verify installed
expo --version
eas --version
```

## Project setup

From the workspace root:

```pwsh
cd "frontend"
```

Make sure you’re logged in to Expo:

```pwsh
eas login
```

## Configure EAS for APK

Add (or update) `eas.json` in `frontend/` to include an APK build profile:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      },
      "env": {
        "EXPO_PUBLIC_API_BASE_URL": "http://ec2-34-203-241-81.compute-1.amazonaws.com"
      }
    },
    "production": {
      "android": {
        "gradleCommand": ":app:bundleRelease"
      },
      "env": {
        "EXPO_PUBLIC_API_BASE_URL": "https://your-prod-hostname"
      }
    }
  },
  "submit": {}
}
```

Notes:

- `buildType: "apk"` instructs EAS to produce an APK instead of an AAB.
- The `env` block exposes runtime values like `EXPO_PUBLIC_API_BASE_URL` to your app (already used by DjangoAPIService).

## Versioning

Update your app version before builds. If you use `app.json`/`app.config.js`, bump:

- `expo.version` (JS-visible app version)
- `expo.android.versionCode` (must increase for every Play Store release; not required for manual APK distribution but recommended)

Example (app.json):

```json
{
  "expo": {
    "name": "PataBima",
    "slug": "patabima",
    "version": "1.0.2",
    "android": {
      "versionCode": 3
    }
  }
}
```

## Keystore handling

EAS can manage the Android keystore for you (recommended). On first build, you’ll be prompted to create or provide a keystore. If you need to manage it manually later:

```pwsh
# Download your keystore (back it up safely)
eas credentials
# Choose Android > Download Keystore
```

## Build the APK (cloud)

From `frontend/`:

```pwsh
# Start a preview build that outputs an APK
EAS_NO_VCS=1 eas build --platform android --profile preview
```

What happens:

- EAS uploads your project, builds an APK in the cloud, and returns a URL to track the build.
- When finished, EAS prints the APK artifact URL.

You can also open the build page in a browser:

```pwsh
eas build:list --limit 1 --platform android
```

## Download and install the APK

- Download the APK from the EAS build page.
- Sideload it on a device (enable install from unknown sources) or use `adb`:

```pwsh
# With Android platform tools installed and a device connected
a db install path\to\your.apk
```

## Build locally (optional)

If you prefer to build locally (requires Android SDK/Java set up):

```pwsh
EAS_NO_VCS=1 eas build --platform android --profile preview --local
```

> Local builds can be faster but require native Android tooling on your machine.

## Environment tips

- Your app already respects `EXPO_PUBLIC_API_BASE_URL` to target EC2.
- For different environments (staging/prod), add additional profiles in `eas.json` with distinct `env` blocks.

## Troubleshooting

- Metro cache issues:

```pwsh
expo start -c
```

- EAS auth errors:

```pwsh
eas login
```

- Android SDK/Java missing (local builds): Install Android Studio + Java 17 and set `JAVA_HOME`.
- Keystore issues: rotate/manage via `eas credentials`.

## CI/CD (optional)

EAS integrates well with GitHub Actions. You can trigger builds on tags or merges and upload artifacts to releases.

---

That’s it — you now have a repeatable way to generate an APK for testing and distribution.
