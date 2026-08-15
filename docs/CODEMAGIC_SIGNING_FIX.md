# Fix "No matching profiles found" in Codemagic

## Option A: Use Codemagic's "Fetch from Developer Portal" (Easiest)

If you have the **App Store Connect API key** in Codemagic:

1. **Codemagic** → **Team settings** (gear) → **Code signing identities**
2. **iOS provisioning profiles** tab
3. Click **"Download selected"** or **"Fetch from Developer Portal"**
4. Select the **App Store** profile for **com.mynightcap.app**
5. Enter a reference name: `nightcap-appstore`
6. Click **Fetch profiles**

This pulls the profile directly from Apple. Codemagic will only show profiles that exist. If `com.mynightcap.app` doesn't appear, create the App ID and profile in Apple Developer Portal first.

---

## Option B: Manual Upload – Verification Checklist

### 1. In Codemagic Team settings → Code signing identities

**iOS certificates tab:**
- [ ] You have at least one **Apple Distribution** certificate
- [ ] It shows as valid (not expired)

**iOS provisioning profiles tab:**
- [ ] You have a profile with **Bundle ID: com.mynightcap.app**
- [ ] **Type: App Store** (not Development or Ad Hoc)
- [ ] **Certificate column shows a green checkmark** ✓ (means it matches your certificate)
- [ ] If there's a red X, the profile was created with a different certificate – create a new profile in Apple that uses YOUR certificate

### 2. Team vs App

- Code signing identities are stored at **Team** level
- Your app must be in the **same team** that has the identities
- Check: Codemagic → Your app → **Settings** → which Team is it under?

### 3. Create profile in Apple (if missing)

1. [developer.apple.com](https://developer.apple.com) → **Profiles** → **+**
2. **App Store** → Continue
3. Select **com.mynightcap.app** (create App ID first if needed)
4. Select **the exact certificate** you uploaded to Codemagic
5. Generate → Download
6. Upload to Codemagic

---

## Option C: Explicit references in codemagic.yaml

If automatic matching fails, reference files by name. Replace `nightcap-appstore` and `nightcap-distribution` with your actual reference names from Codemagic:

```yaml
environment:
  ios_signing:
    provisioning_profiles:
      - nightcap-appstore
    certificates:
      - nightcap-distribution
```

**Note:** When using this, remove `distribution_type` and `bundle_identifier` from ios_signing.
