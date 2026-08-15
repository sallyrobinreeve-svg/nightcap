# Codemagic Build Troubleshooting

## If the build fails, we need the exact error

1. Open the failed build in Codemagic
2. Click **Build logs**
3. Find the **first step that failed** (red/failed status)
4. Scroll to the **bottom of that step's log**
5. Copy the **last 30–50 lines** (the error message)
6. Share it so we can fix the specific issue

---

## Common errors and fixes

### "Failed to publish App.ipa to App Store Connect"

The build succeeded but publishing to App Store Connect failed. Check these in order:

1. **App record must exist first**
   - Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → **My Apps** → **+** → **New App**
   - Create the app with Bundle ID: **com.mynightcap.app** (must match exactly)
   - Codemagic cannot publish to an app that doesn't exist yet

2. **Bundle ID mismatch**
   - Your app uses **com.mynightcap.app** (not com.nightcap.app)
   - In App Store Connect, the app's Bundle ID must be **com.mynightcap.app**
   - In Apple Developer Portal, the App ID and provisioning profile must use **com.mynightcap.app**
   - If you created the app with a different bundle ID, create a new app with the correct one

3. **App Store Connect API key**
   - Codemagic → **Team settings** (gear) → **Integrations** → **Developer Portal** → **Manage keys**
   - Add your App Store Connect API key (.p8 file, Issuer ID, Key ID)
   - The key must have **App Manager** permission
   - In codemagic.yaml, `integrations: app_store_connect: Codemagic` – the integration name in Codemagic must match (e.g. "Codemagic")

4. **Link the app in Codemagic**
   - Codemagic → Your app → **Settings** → **App Store Connect**
   - Ensure the app is linked to your App Store Connect app (Codemagic may prompt you to select it)

5. **Duplicate version/build number**
   - Each upload needs a unique version + build number
   - Bump `CFBundleShortVersionString` and `CFBundleVersion` in `ios/App/App.xcodeproj` (or via `npm version patch` if wired up)

6. **Check the full error**
   - In the failed build log, expand the **Publish** step
   - Apple often emails more detail – check the inbox for the Apple ID used in App Store Connect

### "No matching profiles found"
- Upload the provisioning profile to Codemagic (Team settings → Code signing identities → iOS provisioning profiles)
- Ensure the profile is for `com.mynightcap.app` and App Store distribution

### "Scheme not found" or "workspace not found"
- The config now uses `ios/App/App.xcworkspace` from project root
- Check the "Verify iOS project structure" step in the logs – does `App.xcworkspace` exist?

### "pod install" fails
- Capacitor 8 uses SPM by default; we force CocoaPods with `--packagemanager CocoaPods`
- If it still fails, check the CocoaPods step output

### Build hangs or times out
- Increased `max_build_duration` to 120 minutes
- Check Codemagic status: https://status.codemagic.io

---

## Current config summary

- **Capacitor**: Uses `--packagemanager CocoaPods` (required for Codemagic compatibility)
- **Workspace**: `ios/App/App.xcworkspace` (full path from project root)
- **Scheme**: `App`
- **Bundle ID**: `com.mynightcap.app`
