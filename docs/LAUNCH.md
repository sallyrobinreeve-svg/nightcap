# NightCapt production launch: phone sign-in

Goal: real users sign in at [https://mynightcap.vercel.app](https://mynightcap.vercel.app) with a mobile number and a real SMS code.

The app code for this is already on the `nightcap` GitHub repo. The live site is still the older `mynightcap` repo, which still uses email. You have to connect the new code to that live URL, then turn on Twilio in Supabase.

Do these steps in order. Do not disable email until a real SMS to your own phone works.

---

## 1. Put this code on the live site

Vercel currently deploys **mynightcap**. Phone login lives in **nightcap**.

1. Open [https://vercel.com](https://vercel.com) and sign in
2. Open the project that serves `mynightcap.vercel.app`
3. **Settings → Git**
4. Disconnect `sallyrobinreeve-svg/mynightcap` if it is connected
5. Connect `sallyrobinreeve-svg/nightcap`
6. Production branch: `main`
7. Keep the existing domain `mynightcap.vercel.app`
8. Keep the existing environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and the Resend keys if you already have them)
9. Deploy production

When it finishes, open `https://mynightcap.vercel.app/auth/signin`. You should see **mobile number**, not email and password.

If the page still shows email, Vercel is still deploying the old repo. Check **Settings → Git** again.

---

## 2. Upgrade Twilio so it can text real phones

A Twilio trial can only text numbers you verify in Twilio. A real launch needs a paid Twilio account.

1. Open [https://www.twilio.com/console](https://www.twilio.com/console)
2. Create an account if you do not have one
3. Upgrade from trial / add billing
4. From the console home, copy **Account SID** and **Auth Token**
5. Create a **Messaging Service** (Twilio Console → Messaging → Services)
   - Friendly name: `NightCapt`
   - Copy the SID. It starts with `MG`
6. Add a phone number to that Messaging Service (buy a number if Twilio asks)
7. Open **Messaging → Geo Permissions** and enable the **United Kingdom** (and any other country you will sign users up from)

---

## 3. Turn on phone login in the existing Supabase project

Use the same Supabase project the live app already uses. Do not create a new project.

1. Open [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select the NightCapt project
3. **Authentication → Sign In / Providers → Phone**
4. Enable **Phone**
5. Enable phone sign-ups / confirmations if you see that toggle
6. SMS provider: **Twilio**
7. Paste Account SID, Auth Token, and Message Service SID
8. Save
9. Leave **Email** enabled until step 6 works

---

## 4. Run this SQL once

**SQL Editor → New query → Run:**

```sql
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, terms_accepted_at)
  values (
    new.id,
    nullif(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'terms_accepted_at', '')::timestamptz
  );
  return new;
end;
$$ language plpgsql security definer;
```

---

## 5. Send a real text to your phone

1. Open `https://mynightcap.vercel.app/auth/signin`
2. Keep United Kingdom
3. Enter your real mobile number
4. Click **Text me a code**
5. Enter the 6-digit code from the SMS
6. Add a display name if asked, accept the terms

You should land in the app.

If no SMS arrives:

- Twilio trial: verify your personal number in Twilio, or upgrade (step 2)
- Twilio logs: Console → Monitor → Logs → Messaging
- UK not enabled: Geo Permissions
- Wrong Supabase project: the Vercel env vars must match this project

---

## 6. Turn email login off

Only after your own phone sign-in works.

1. Supabase → **Authentication → Providers → Email**
2. Disable Email
3. Save

From then on, NightCapt accounts are phone numbers only.

---

## Existing email users

People who already signed up with email are not moved across. They sign up again with their mobile number. Old nights stay on the old email account unless you move them later.

---

## App Store / TestFlight

After the website works:

1. Ship a new iOS build from `flutter_app/` with the same Supabase URL and anon key
2. In App Store Connect, privacy nutrition labels should list phone number used for account creation, not email-and-password
3. Support URL: `https://mynightcap.vercel.app/support`
4. Privacy URL: `https://mynightcap.vercel.app/privacy`
