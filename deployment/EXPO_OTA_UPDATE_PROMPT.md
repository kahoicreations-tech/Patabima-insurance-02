# Expo OTA Update Prompt (Saved Reference)

Use this prompt when you need an over-the-air (OTA) update pushed via EAS Update without rebuilding native binaries. Backend remains unchanged.

## Canonical Prompt

"Please publish an Expo OTA update for the frontend with the latest code changes. Backend remains unchanged. Use current eas.json env settings (development = EC2 IP; production = existing domain). Increment the app version/release channel as needed and trigger EAS Update so users receive the new UI without a full rebuild."

## Short Variants

1. "Run EAS Update now to push latest frontend changes OTA (backend unchanged)."
2. "Need an Expo OTA update: deploy current main branch frontend; no backend modifications."
3. "Publish OTA update to production channel using current eas.json env vars."

## Usage Steps (No Git Prerequisite)

```bash
# 1. Login to Expo (skip if already authenticated)
expo login

# 2. (Optional) bump app version in app.json if you track semantic versions for audits
#    Not required for OTA delivery itself.

# 3. Navigate to frontend directory
cd C:\Users\USER\Desktop\PATABIMA01\frontend

# 4. Publish OTA with EAS Update (preferred for SDK 53+)
eas update --branch production --message "Frontend OTA: non-motor quote UI fixes"

# 5. For development testing branch
eas update --branch development --message "Dev OTA sync"

# 6. (Optional) Legacy classic publish (only if still needed for fallback)
# expo publish --release-channel production

# 7. Verify update was published
eas update:list --branch production --limit 3

# 8. Users receive update on next app restart
# Force close app → Reopen app → Update downloads automatically
```

````

## Branch/Channel Mapping (Current Convention)

| EAS Branch  | Expo Release Channel | Purpose                         |
| ----------- | -------------------- | ------------------------------- |
| development | development          | Internal testing against EC2 IP |
| preview     | preview              | QA / UAT                        |
| production  | production           | Public users (stable)           |

## Environment Variables Reference

- `EXPO_PUBLIC_API_BASE_URL` resolved from eas.json `env` or `.env.local` (manual switching script).
- Do NOT hardcode new domains until DNS + SSL is fully validated.

## When NOT To Use OTA

- Native module additions (requires full build)
- Expo SDK version bump
- Changes to app.json that affect native config (e.g., permissions)
- Runtime version changes

**Important**: If users have an older runtime version (e.g., 1.0.1) and you publish OTA for 1.0.2, they won't receive the update. They must install the latest APK first.

## Ensuring Users Get Updates

### Check Current Builds
```bash
cd C:\Users\USER\Desktop\PATABIMA01\frontend
eas build:list --limit 5
````

Note the runtime version of latest production build.

### If Runtime Versions Don't Match

Users must download and install the latest APK before OTA updates work:

1. Get latest production APK link from `eas build:list`
2. **For Emulator**: Download and install via ADB
   ```bash
   curl -L -o patabima-latest.apk <APK_URL>
   adb uninstall com.patabima.agent
   adb install patabima-latest.apk
   ```
3. **For Physical Devices**: Share APK link directly to users
4. After installing correct runtime version, all future OTA updates work automatically

## Rollback Strategy

If UI regression reported:

```bash
eas update --branch production --message "Rollback to previous commit" --commit <previous_update_commit_hash>
```

Or publish another update quickly with fixed patch.

## Audit Recommendation

Maintain a simple log in `deployment/OTA_UPDATE_LOG.md` (create if missing) with:

```
[2025-11-23] production: non-motor quotation display corrections (commit abc1234)
```

## How Automatic OTA Works (For Users)

**Once users install the correct runtime version (1.0.2), all future updates are automatic:**

1. User opens PataBima app
2. App checks Expo servers for updates (`checkAutomatically: "ON_LOAD"` in app.json)
3. New OTA update downloads in background (2-10 MB, not full 93 MB APK)
4. Update applies on next app restart
5. User sees updated features/fixes immediately

**No manual installation needed for each person!**

## Distribution Strategy

### For New Users

Share the latest production APK link:

```
https://expo.dev/artifacts/eas/8VsvkrRdMQ7mnYPxx76uwe.apk
```

Or get latest from: `eas build:list --limit 1`

Users install once, then all future OTA updates are automatic.

### For Existing Users (Old Runtime)

1. Send push notification: "New app version available"
2. In-app prompt with APK download link
3. Or publish to Google Play Store for automatic updates

### For Future OTA Updates (Developer)

```bash
# Step 1: Navigate to frontend
cd C:\Users\USER\Desktop\PATABIMA01\frontend

# Step 2: Publish OTA update (all users get it automatically on next launch)
eas update --branch production --message "Bug fixes and UI improvements"

# Step 3: Verify published
eas update:list --branch production --limit 3

# That's it! No reinstall needed for any user.
```

**When Users DO Need to Reinstall (Rare):**

- Expo SDK upgrade (53 → 54)
- Native module additions/changes
- Runtime version bump (1.0.2 → 1.0.3)
- Major permissions additions

## Next Improvements

- Automate OTA publish via GitHub Action on tag push.
- Add integrity check (bundle size diff) before auto-publish.
- Implement in-app update prompts for major versions.
- Add Google Play Store publishing for automatic APK distribution.

---

Saved for quick reuse. Modify as standards evolve.
