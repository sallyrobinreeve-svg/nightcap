# NightCapt – Capture the Chaos

A mobile-first social app for recording and sharing night-out recaps. Spill the tea, lock in the memory.

A social journal app for recording and sharing post-night-out memories: outfit photos, favourite photos, reflection prompts, and an interactive timeline.

## Features (MVP)

- **Auth** – Phone number sign up / sign in with a one-time SMS code (no password)
- **Entry creation** – Step-by-step wizard:
  - Date of night
  - Photos (outfit + favourite)
  - Rating (1–5 stars)
  - Prompts: who was drunkest, funniest thing, mission, success, who kissed who (with privacy toggle)
  - Interactive timeline (Pres → Club → Bar → Afters → Other)
  - Review & visibility (private / friends / public)
- **Profile** – Basic profile view with entry count
- **Entries list & detail** – View all entries and full entry detail with timeline

## Social Features

- **Follow friends** – Search and follow users by display name
- **Friend feed** – Chronological feed of your entries and friends' entries
- **Comments** – Add and delete comments on entries
- **Reactions** – React to entries (fire, heart, laugh, wild)
- **Tag friends** – Tag people you follow when creating entries
- **Missions highlights** – "Top missions this week" section
- **Memories archive** – Photo grid of past nights
- **Bottom navigation** – Feed, Create, Memories, Profile

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run the migrations in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_social_features.sql`
   - `supabase/migrations/003_prompts_and_emoji.sql`
   - `supabase/migrations/004_user_stats.sql`
   - `supabase/migrations/005_edit_video_mission.sql`
   - `supabase/migrations/006_kissed_prompt_update.sql`
   - `supabase/migrations/007_ugc_safeguards.sql`
   - `supabase/migrations/008_follow_requests.sql`
   - `supabase/migrations/009_photos_timeline_view.sql`
   - `supabase/migrations/010_notifications_seen.sql`
   - `supabase/migrations/011_terms_acceptance_profile_trigger.sql`
   - `supabase/migrations/012_phone_auth_profile_trigger.sql`

3. Create a storage bucket:
   - Go to Storage → New bucket
   - Name: `photos`
   - Public: Yes
   - Add policy: authenticated users can `INSERT`, everyone can `SELECT`

4. Enable phone authentication:
   - Authentication → Providers → Phone → Enable
   - Confirm phone sign-ups are allowed
   - Connect an SMS provider (Twilio is the usual choice) under Authentication → Phone
   - Optional: add test phone numbers under Authentication → Phone while developing, so you can sign in without sending real SMS
   - You can disable the Email provider once phone sign-in is working

5. Copy `.env.local.example` to `.env.local` and add your Supabase URL and keys:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   NEXT_PUBLIC_SITE_URL=https://mynightcap.vercel.app
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   RESEND_API_KEY=your_resend_key
   UGC_ALERT_EMAIL=nightcapt1@outlook.com
   ```

### 3. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Phone sign-in needs SMS to be configured in Supabase. Existing email/password accounts are not converted automatically — those users sign up again with their mobile number.

For a real production launch (live site + real SMS), follow **[docs/LAUNCH.md](docs/LAUNCH.md)**.

## Flutter mobile app

The native Flutter client lives in `flutter_app/`.

```bash
cd flutter_app
flutter pub get
flutter run \
  --dart-define=SUPABASE_URL=https://your-project.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=your_anon_key \
  --dart-define=SITE_URL=https://mynightcap.vercel.app
```

Use `com.mynightcap.app://auth/callback` as a native URL scheme if you still need deep links. Phone OTP sign-in happens in-app and does not rely on email redirects.

## Mobile release

- Set the same production environment variables in Vercel before building the native app.
- For the Flutter app, set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SITE_URL` as Codemagic environment variables.
- Run `npm run screenshots:ipad` before App Store resubmission and upload `screenshots-output/ipad-13inch.png`.
- Codemagic includes a Flutter iOS workflow for `flutter_app/`; the older Capacitor workflow remains as a fallback.
- For App Store review, set the Support URL to `https://mynightcap.vercel.app/support` and Privacy Policy URL to `https://mynightcap.vercel.app/privacy`.

## Tech stack

- **Flutter** native mobile client
- **Next.js 16** (App Router web/admin/API fallback)
- **Supabase** (auth, database, storage)
- **Tailwind CSS**
- **TypeScript**
