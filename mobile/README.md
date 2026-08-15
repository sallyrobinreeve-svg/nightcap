# NightCapt — Flutter app

A native rewrite of NightCapt (iOS/Android/web) on top of the existing Supabase
backend. This is the path to a stable, scalable, truly-native app and is intended
to eventually replace the Capacitor-wrapped Next.js web build.

## Architecture

- **State management:** Riverpod (`flutter_riverpod`).
- **Routing:** `go_router` with an auth-guarded redirect (`lib/router.dart`).
- **Backend:** `supabase_flutter` (auth + Postgres). Row-level security in the
  database enforces per-entry visibility, exactly like the web app.
- **Structure** (`lib/`):
  - `config.dart` — Supabase URL/key (overridable via `--dart-define`).
  - `supabase_providers.dart` — client + auth-state providers.
  - `features/auth/` — repository + sign in / sign up screens.
  - `features/feed/` — entry model, repository (keyset pagination by
    `created_at`), controller (infinite scroll), and screen.
  - `features/entries/` — create-recap screen.

## Prerequisites

Install the Flutter SDK (stable) and enable web:

```bash
git clone https://github.com/flutter/flutter.git -b stable --depth 1 "$HOME/flutter"
export PATH="$HOME/flutter/bin:$PATH"   # add to ~/.bashrc to persist
flutter config --enable-web
flutter --version   # first run downloads the Dart SDK
```

## Install dependencies

```bash
cd mobile
flutter pub get
```

## Run

The app defaults to the **local Supabase stack** (`http://127.0.0.1:54321` with
the standard local anon key), so start Supabase first (see repo root: `supabase
start`).

- **Web (works in a headless Linux dev box):**
  ```bash
  flutter run -d web-server --web-hostname 0.0.0.0 --web-port 8080
  ```
  Then open http://localhost:8080. First debug compile can take 20-30s.
- **iOS / Android:** `flutter run` with a simulator/emulator or device (requires
  macOS + Xcode for iOS).

Point at a hosted Supabase instead of local:

```bash
flutter run --dart-define=SUPABASE_URL=https://xxx.supabase.co \
            --dart-define=SUPABASE_ANON_KEY=your_anon_key
```

## Checks

```bash
flutter analyze
flutter test
```

## Scope

Implemented so far (validated end-to-end against Supabase):
- Email auth (sign up / sign in / sign out) + auth-guarded routing.
- Paginated friend feed with infinite scroll.
- Create a recap (date, rating, prompts, visibility).
- Recap detail screen with photos/timeline display, emoji reactions
  (one per user, toggle), and comments (add / delete own).
- Friends: search users, send/cancel follow requests, accept/reject incoming
  requests (mutual accept), and remove friends. The feed is user-scoped, so it
  resets correctly across account switches.

Still to be ported from the web app: photo upload, the full timeline editor,
profiles, leaderboards, notifications, and report/block moderation.
