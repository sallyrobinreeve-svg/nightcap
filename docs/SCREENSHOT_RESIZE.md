# Resize Your Screenshots for App Store

You have 3 screenshots. App Store needs **1242 × 2688px** or **1284 × 2778px** (portrait).

---

## Option 1: StoreSnaps (Easiest – No Account)

1. Go to **[storesnaps.com](https://www.storesnaps.com/)**
2. Click **Upload screenshots** or drag your 3 images
3. Select **iPhone 6.5"** (1284 × 2778) or **iPhone 6.7"** (1284 × 2778)
4. Click **Generate** or **Export**
5. Download the ZIP – your resized screenshots are inside
6. Upload those to App Store Connect

---

## Option 2: Photopea (Free Online Photoshop)

1. Go to **[photopea.com](https://www.photopea.com/)**
2. **File** → **Open** → select your screenshot
3. **Image** → **Image size**
4. Set **Width: 1242** and **Height: 2688** (uncheck "Constrain proportions" if needed, or use "Scale" to fit)
5. **File** → **Export as** → **PNG**
6. Repeat for each screenshot

---

## Option 3: Script (If You Have Node)

1. Create folder: `night-out-journal/screenshots-input`
2. Copy your 3 screenshots into that folder
3. Run:
   ```
   npm run screenshots:resize
   ```
4. Get resized images from `screenshots-output` folder

---

## Your 3 Screenshots (Good Choices!)

1. **Landing page** – Sign in / Create account
2. **New entry – Date** – Date picker screen
3. **New entry – Prompts** – Prompt cards

These show the app well. Use any of the options above to resize, then upload to App Store Connect.
