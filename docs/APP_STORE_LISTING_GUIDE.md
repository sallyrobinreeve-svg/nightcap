# NightCap – Complete App Store Listing Guide

Everything you need to fill in App Store Connect and generate screenshots.

---

## Part 1: Screenshot Requirements (2024)

### Required sizes
- **6.9" Display (Primary):** 1320 x 2868 pixels (portrait) – upload this and Apple scales for smaller devices
- **Alternative 6.5":** 1284 x 2778 pixels (portrait)
- **13-inch iPad (required if app runs on iPad):** 2048 x 2732 pixels (portrait) – run `node scripts/resize-for-ipad.js` to generate from your iPhone screenshot

### Format
- JPEG, JPG, or PNG

---

## Part 2: How to Generate Screenshots (No Mac Needed)

### Option A: Screenshot your live app in a browser

1. Go to [mynightcap.vercel.app](https://mynightcap.vercel.app) on your phone or in Chrome
2. Sign in and navigate to key screens
3. Take screenshots (or use Chrome DevTools to simulate iPhone size)
4. Use an online tool to add device frames (see Option B)

### Option B: Use a free online screenshot generator

1. **Screenshot your app** – Open mynightcap.vercel.app, resize browser to ~390px wide (iPhone width), take screenshots of:
   - Feed
   - A journal entry
   - Profile
   - New entry screen

2. **Add device frames** – Go to one of these (no account needed):
   - [StoreSnaps](https://www.storesnaps.com/) – Free, no account
   - [Screenshot Generator](https://www.screenshotgen.dev/) – Processes locally in browser
   - [AppScreen Studio](https://appscreenstudio.com/) – Free templates

3. **Upload your screenshots** → Choose iPhone 6.9" or 6.5" → Export

### Option C: Chrome DevTools (exact pixel size)

1. Open [mynightcap.vercel.app](https://mynightcap.vercel.app) in Chrome
2. Press **F12** → Click the device icon (or **Ctrl+Shift+M**)
3. Select **iPhone 15 Pro Max** (430 x 932) or **Responsive**
4. Set dimensions to **430 x 932** (scales to ~1320 x 2868)
5. Navigate to each screen, take screenshots (**Ctrl+Shift+P** → "Capture screenshot")
6. Resize images to 1320 x 2868 using [Photopea](https://www.photopea.com/) (free online Photoshop) or any image editor

### Screens to capture (in order)
1. **Feed** – Main social feed
2. **Journal entry** – A sample entry view
3. **New entry** – Create new journal entry
4. **Profile** – User profile
5. **Memories or Leaderboard** – Another feature screen

---

## Part 3: App Store Connect – What to Fill In

### App Information

| Field | What to enter |
|-------|----------------|
| **Name** | NightCap |
| **Subtitle** | (Optional, 30 chars max) e.g. "Your Night Out Journal" |
| **Privacy Policy URL** | https://mynightcap.vercel.app/privacy |
| **Category** | Primary: **Social Networking** or **Lifestyle** |
| **Secondary Category** | (Optional) **Photo & Video** or **Entertainment** |
| **Content Rights** | Check if you have rights to all content |
| **Age Rating** | Complete the questionnaire (likely 12+ or 17+ if alcohol-related) |

---

### Description (4000 chars max)

```
NightCap is your social journal for nights out. Capture the chaos, spill the tea, and lock in the memory.

• Write journal entries about your nights out
• Share with friends and see their stories
• Build a feed of memories from you and your crew
• Add photos and details to remember every moment
• Leaderboard and memories to look back on the best nights

Whether it's a wild night out or a chill hang, NightCap helps you document it and share it with the people who matter.
```

---

### Keywords (100 chars max, comma-separated, no spaces after commas)

```
journal,social,night out,memories,friends,diary,stories,photos,nightlife
```

---

### Promotional Text (170 chars, can be updated anytime)

```
Capture the chaos. Spill the tea from last night. Your social journal for nights out is here.
```

---

### What's New (for updates, 4000 chars)

For first release, you can use:
```
Welcome to NightCap! Your social journal for nights out is ready. Start capturing memories today.
```

---

### Support URL (required)

```
https://mynightcap.vercel.app/privacy#support
```

The Support section is on the Privacy page (which already works). Use this URL – Apple rejects the homepage as a support URL.

---

### Marketing URL (Optional)

```
https://mynightcap.vercel.app
```

---

### Version Information

| Field | Value |
|-------|-------|
| **Version** | 1.0.0 |
| **Copyright** | 2025 [Your Name or Company] – **Required** |
| **Trade Representative Contact** | Your email |

### Content Rights (App Information → Content Rights)

- **Content Rights Information** – Required before submission
- If users upload content: Select **Yes**, confirm you have rights or that user-generated content is allowed
- Add any third-party content disclosures if needed

### Pricing

- **Price** – Choose a price tier (select **Free** for a free app)
- App Store Connect → Your app → **Pricing and Availability** → set price

### App Privacy (Admin required)

- **App Privacy** – An Admin must complete this before submission
- App Store Connect → Your app → **App Privacy** → **Get Started**
- Declare what data you collect (e.g. account info, user content). For NightCapt: phone number for sign-in, journal content, photos

---

## Part 4: Export Compliance

When you submit, Apple asks:

**Does your app use encryption?**
- If you only use HTTPS (standard web encryption): Select **No** – HTTPS is exempt
- If you have custom encryption: Select **Yes** and complete the form

For NightCap (Supabase auth, HTTPS): Usually **No** is correct.

---

## Part 5: Content Rights

**Does your app contain, display, or access third-party content?**
- **Yes** – if users can upload/share content (you do)
- Confirm you have rights or that user-generated content is allowed

---

## Part 6: Advertising Identifier (IDFA)

**Does your app use the Advertising Identifier?**
- **No** – unless you've added an ad network (e.g. Google Ads)

---

## Part 7: Step-by-Step Submission Checklist

1. [ ] Upload screenshots (at least 1 for 6.9" or 6.5" iPhone)
2. [ ] Add Description
3. [ ] Add Keywords
4. [ ] Add Privacy Policy URL
5. [ ] Select Category
6. [ ] Add Support URL
7. [ ] Select your build (from TestFlight)
8. [ ] Complete Age Rating questionnaire
9. [ ] Answer Export Compliance (usually No)
10. [ ] Click **Add for Review**
11. [ ] Answer any final questions
12. [ ] Click **Submit to App Review**

---

## Quick Copy-Paste Summary

**Description (short):** NightCap is your social journal for nights out. Capture the chaos, spill the tea, and lock in the memory with friends.

**Keywords:** journal,social,night out,memories,friends,diary,stories,photos,nightlife

**Privacy Policy:** https://mynightcap.vercel.app/privacy

**Support URL:** https://mynightcap.vercel.app/support
