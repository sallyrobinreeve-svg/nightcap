# NightCap – App Store Submission Guide

This guide walks you through getting NightCap on the Apple App Store using Capacitor.

## Prerequisites

1. **macOS** – iOS builds require Xcode (no way around this; Windows can’t build for iOS).
2. **Apple Developer Program** – $99/year at [developer.apple.com](https://developer.apple.com).
3. **Deployed app** – Your Next.js app must be live (e.g. on Vercel).

---

## Step 1: Deploy your app

Deploy NightCap so it has a public HTTPS URL:

```bash
# If using Vercel
npx vercel

# Or connect your repo at vercel.com for automatic deploys
```

After deployment, note your app URL (e.g. `https://nightcap.vercel.app`).

---

## Step 2: Set your app URL in Capacitor

Edit `capacitor.config.ts` or set the environment variable:

```bash
# Option A: Edit capacitor.config.ts
# Change the APP_URL default from 'https://nightcap.vercel.app' to your actual URL

# Option B: Use env var when building
export CAPACITOR_APP_URL=https://your-app.vercel.app
```

If your Supabase project URL changes, update `allowNavigation` in `capacitor.config.ts` to include it.

---

## Step 3: Sync and open in Xcode (on macOS)

```bash
npm run ios
# or: npx cap sync ios && npx cap open ios
```

This opens the Xcode project in `ios/App/`.

---

## Step 4: Configure Xcode for App Store

1. **Signing & Capabilities**
   - Select the **App** target.
   - In **Signing & Capabilities**, choose your Team (Apple Developer account).
   - Enable **Automatically manage signing** (or set manual signing if needed).

2. **App icons**
   - Add icons in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`.
   - Provide at least: 1024×1024 (App Store), 60×60, 76×76, 83.5×83.5, etc.
   - Use a tool like [appicon.co](https://appicon.co) to generate all sizes from one 1024×1024 image.

3. **Bundle ID**
   - Current: `com.mynightcap.app`.
   - To change it: update `appId` in `capacitor.config.ts`, then run `npx cap sync ios` again.

4. **Display name**
   - In Xcode: **App** target → **General** → **Display Name** → set to "NightCap".

5. **Version & build**
   - **Version**: e.g. `1.0.0`.
   - **Build**: e.g. `1` (increment for each upload).

---

## Step 5: Build for App Store

1. In Xcode: **Product** → **Destination** → **Any iOS Device (arm64)**.
2. **Product** → **Archive**.
3. After the archive completes, the Organizer opens.
4. Select your archive → **Distribute App** → **App Store Connect** → **Upload**.

---

## Step 6: App Store Connect setup

1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com).
2. **My Apps** → **+** → **New App**.
3. Fill in:
   - **Platform**: iOS
   - **Name**: NightCap
   - **Primary Language**
   - **Bundle ID**: `com.mynightcap.app` (must match Xcode)
   - **SKU**: e.g. `nightcap001`

4. **App Information**
   - Privacy Policy URL (required if you collect data – you do, via Supabase/auth).
   - Category (e.g. Social Networking or Lifestyle).

5. **Screenshots**
   - iPhone 6.7"
   - iPhone 6.5"
   - iPad Pro 12.9" (if supporting iPad)
   - Use the Simulator or a device to capture them.

6. **Build**
   - After uploading from Xcode, the build appears here. Select it.

7. **Submit for review**
   - Add **What’s New**, answer export compliance and content questions, then submit.

---

## Troubleshooting

### "Missing www directory" during sync

When using `server.url`, Capacitor may warn about `www`. The app loads from the remote URL, so this is usually fine. An empty `www` folder exists to satisfy the check.

### App shows blank screen

- Ensure your deployed URL is correct and loads over HTTPS.
- Confirm `allowNavigation` in `capacitor.config.ts` includes your app URL and Supabase URL.
- Check the device has internet access.

### Supabase auth redirects not working

Supabase may redirect to auth URLs. Add any auth domains to `allowNavigation` in `capacitor.config.ts`.

### Build fails in Xcode

- Run **Pod install** in `ios/App`: `cd ios/App && pod install`.
- Ensure you’re on a recent Xcode version.
- Clean: **Product** → **Clean Build Folder**.

---

## Summary checklist

- [ ] Deploy app to Vercel (or similar)
- [ ] Set `CAPACITOR_APP_URL` or update `capacitor.config.ts`
- [ ] Join Apple Developer Program ($99/year)
- [ ] Add app icons (1024×1024 and required sizes)
- [ ] Add privacy policy URL
- [ ] Run `npm run ios` on macOS
- [ ] Configure signing in Xcode
- [ ] Archive and upload to App Store Connect
- [ ] Complete App Store Connect listing (screenshots, description, etc.)
- [ ] Submit for review
