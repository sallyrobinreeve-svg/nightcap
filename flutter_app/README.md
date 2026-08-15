# NightCapt Flutter

Native Flutter client for NightCapt.

## Run locally

From this directory:

```bash
flutter pub get
flutter run \
  --dart-define=SUPABASE_URL=https://your-project.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=your_anon_key \
  --dart-define=SITE_URL=https://mynightcap.vercel.app
```

If the Supabase values are omitted, the app opens a configuration screen instead of auth/feed screens.

## iOS identity

- Bundle ID: `com.mynightcap.app`
- Display name: `NightCapt`
- URL scheme: `com.mynightcap.app://auth/callback`

## Current Flutter scope

This native client includes:

- Phone number auth with one-time SMS codes
- Support and Terms screens
- Feed, create entry, memories, and profile tabs
- Native photo-library picking for entry/profile photos
- Supabase storage uploads and database writes using existing tables

The existing Next app remains in the repository for web/admin/API support while the Flutter client becomes the App Store target.
