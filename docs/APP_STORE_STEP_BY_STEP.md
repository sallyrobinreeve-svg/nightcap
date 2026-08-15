# NightCap – App Store Submission (Simple Step-by-Step)

**For Windows users – no Mac needed.** Follow these steps in order.

---

## Part 1: What You Need Before Starting

- [ ] Apple Developer account ($99/year) – [developer.apple.com](https://developer.apple.com)
- [ ] NightCap deployed at [mynightcap.vercel.app](https://mynightcap.vercel.app) ✓
- [ ] **Git for Windows** (for OpenSSL) – [git-scm.com](https://git-scm.com) – install if you don't have it
- [ ] Codemagic account – [codemagic.io](https://codemagic.io)
- [ ] Your code pushed to GitHub – [github.com/sallyrobinreeve-svg/mynightcap](https://github.com/sallyrobinreeve-svg/mynightcap)

---

## Part 2: Create the Certificate (On Windows)

### Step 2.1: Open Git Bash
- Press **Windows key**, type **Git Bash**, press Enter
- (If you don't have Git Bash, install Git from [git-scm.com](https://git-scm.com) first)

### Step 2.2: Create the certificate request
Copy and paste this (replace with your real email and name):
```bash
cd ~
openssl req -new -newkey rsa:2048 -nodes -keyout mykey.key -out CertificateSigningRequest.certSigningRequest -subj "/emailAddress=your@email.com/CN=Your Name/C=US"
```
Press Enter.

### Step 2.3: Upload to Apple
1. Go to [developer.apple.com](https://developer.apple.com)
2. Click **Certificates, Identifiers & Profiles**
3. Click **Certificates** → **+**
4. Choose **Apple Distribution** → **Continue**
5. Click **Choose File** → select `CertificateSigningRequest.certSigningRequest` from `C:\Users\YourUsername\`
6. Click **Continue** → **Download**
7. The certificate file will download (e.g. `distribution.cer` or `distribution (3).cer`)

### Step 2.4: Create the .p12 file
In Git Bash, run (use your actual certificate filename – check your Downloads folder):
```bash
openssl pkcs12 -export -out ~/nightcap.p12 -inkey ~/mykey.key -in ~/Downloads/"distribution (3).cer" -inform DER -passout pass:codemagic123
```
If your file has a different name, replace `"distribution (3).cer"` with your filename in quotes.

### Step 2.5: Find the .p12 file
- Open File Explorer
- Go to `C:\Users\YourUsername\` (replace YourUsername with your Windows username)
- You should see `nightcap.p12`
- Remember: **password is codemagic123**

---

## Part 3: Create the App ID (Apple Developer Portal)

1. Go to [developer.apple.com](https://developer.apple.com) → **Certificates, Identifiers & Profiles**
2. Click **Identifiers** → **+**
3. Choose **App IDs** → **App** → **Continue**
4. Description: **NightCap**
5. Bundle ID: **com.mynightcap.app** (type it exactly – must match the app)
6. Click **Register**

---

## Part 4: Create the Provisioning Profile (Apple Developer Portal)

1. Go to **Profiles** → **+**
2. Choose **App Store** (under Distribution) → **Continue**
3. Select **com.mynightcap.app** → **Continue**
4. Select your **Apple Distribution** certificate → **Continue**
5. Profile name: **NightCap App Store** → **Generate**
6. Click **Download**
7. Save the `.mobileprovision` file (it goes to your Downloads folder)

---

## Part 5: Upload to Codemagic

### Step 5.1: Upload the certificate
1. Go to [codemagic.io](https://codemagic.io) and sign in
2. Click the **gear icon** (top right) for Team settings
3. Click **Code signing identities**
4. Open the **iOS certificates** tab
5. Click **Add certificate**
6. Upload `nightcap.p12` from `C:\Users\YourUsername\`
7. Password: **codemagic123**
8. Reference name: **nightcap-distribution**
9. Click **Save**

### Step 5.2: Upload the provisioning profile
1. Open the **iOS provisioning profiles** tab
2. Click **Add profile**
3. Upload the `.mobileprovision` file from your Downloads folder
4. Reference name: **nightcap-appstore**
5. Click **Save**

### Step 5.3: Check the green checkmark
In the provisioning profiles list, your profile should show a **green ✓** in the Certificate column. If it shows a red X, the profile was created with a different certificate – go back to Part 4 and create a new profile, selecting the certificate you just uploaded.

---

## Part 6: Connect Codemagic to Your App

1. In Codemagic, click **Add application**
2. Connect your **GitHub** account if needed
3. Select the **mynightcap** repository
4. Choose **codemagic.yaml** as the configuration
5. Finish setup

---

## Part 7: Run the Build

1. In Codemagic, open your **mynightcap** app
2. Click **Start new build**
3. Select your branch (usually `main`)
4. Click **Start build**
5. Wait 15–30 minutes

---

## Part 8: If the Build Succeeds

### Option A: Let Codemagic Upload (No Mac needed – recommended)

1. **Create App Store Connect API key** (one-time setup):
   - Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → **Users and Access** → **Integrations** → **App Store Connect API**
   - Click **+** to create a key
   - Name it **Codemagic**, choose **App Manager** access
   - Click **Generate** → **Download** the `.p8` file (save it – you can only download once!)
   - Note the **Issuer ID** and **Key ID**

2. **Add the key to Codemagic**:
   - Codemagic → **Team settings** (gear) → **Integrations** → **Developer Portal** → **Manage keys**
   - **Add key** → Upload the `.p8` file, enter Issuer ID and Key ID
   - Name it **app-store-connect** → Save

3. **Enable publishing in your build** – The codemagic.yaml needs the publishing section. Ask for help to add this, or after the build succeeds, Codemagic may offer to publish – follow the prompts.

4. **Next build** – Codemagic will automatically upload the IPA to TestFlight. No Mac needed.

### Option B: Manual Upload (Requires a Mac or Mac-in-the-cloud)

1. Download the `.ipa` from the build Artifacts
2. On a Mac: Install **Transporter** from the Mac App Store, sign in, drag the IPA in, click **Deliver**
3. Or borrow a Mac briefly just for this step

### Step 8.3: Create the app in App Store Connect (if not done yet)
1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. **My Apps** → **+** → **New App**
3. Platform: **iOS**
4. Name: **NightCap**
5. Bundle ID: **com.mynightcap.app**
6. SKU: **nightcap001**
7. Click **Create**

### Step 8.4: Complete the App Store listing
1. Open your NightCap app in App Store Connect
2. Fill in: **Description**, **Keywords**, **Category**
3. Add **Privacy Policy URL**: https://mynightcap.vercel.app/privacy
4. Add **Screenshots** (at least one for iPhone 6.7" and 6.5")
5. Under **Build**, select the build you uploaded
6. Click **Add for Review**
7. Answer the export compliance questions
8. Click **Submit to App Review**

---

## Part 9: Wait for Apple

Apple usually reviews within 24–48 hours. You'll get an email when it's approved or if they need changes.

---

## Quick Reference

| Item | Value |
|------|-------|
| Bundle ID | com.mynightcap.app |
| App URL | https://mynightcap.vercel.app |
| Privacy Policy | https://mynightcap.vercel.app/privacy |
| Certificate password | codemagic123 |

---

## If Something Fails

- **Build fails with "No matching profiles"** → Re-check Part 5. Certificate and profile must both be uploaded, and the profile must show a green ✓.
- **"Failed to publish App.ipa to App Store Connect"** → See [CODEMAGIC_TROUBLESHOOTING.md](CODEMAGIC_TROUBLESHOOTING.md) – usually app not created yet, bundle ID mismatch, or API key not set up.
- **Build fails at another step** → Copy the error message from the build logs and share it for help.
- **Transporter won't upload** → Make sure you're signed in with the same Apple ID as your Developer account.
