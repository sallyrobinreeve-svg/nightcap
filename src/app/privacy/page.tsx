import Link from "next/link";

export const metadata = {
  title: "Terms, Privacy & Support | NightCapt",
  description: "NightCapt terms of use, privacy policy and support. How we collect, use, and protect your data. Contact us for help.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen playful-bg py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="inline-block text-nightcap-muted hover:text-nightcap-accent mb-8 transition"
        >
          ← Back
        </Link>
        <div className="glass rounded-2xl p-8">
          <h1 className="font-display text-3xl gradient-text mb-2">
            Terms, Privacy & Support
          </h1>
          <p className="text-nightcap-muted text-sm mb-8">
            Last updated: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </p>

          <div className="prose prose-invert prose-sm max-w-none space-y-6 text-nightcap-muted">
            <section>
              <h2 className="text-white font-display text-xl mb-2">Terms of Use</h2>
              <p>
                By using NightCapt, you agree to these terms. We have <strong className="text-white">zero tolerance for objectionable content or abusive users.</strong> You can report content and block users in the app. We act on reports within 24 hours.
              </p>
            </section>

            <section>
              <h2 className="text-white font-display text-xl mb-2">
                Privacy Policy
              </h2>
              <p>
                NightCapt (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is a social journal app for recording and sharing your nights out. This Privacy Policy explains how we collect, use, store, and protect your information when you use our app and services.
              </p>
            </section>

            <section>
              <h2 className="text-white font-display text-xl mb-2">
                Information We Collect
              </h2>
              <p>When you use NightCapt, we may collect:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li><strong className="text-white">Account information:</strong> Mobile phone number when you create an account (used to send a one-time sign-in code)</li>
                <li><strong className="text-white">Profile information:</strong> Display name, bio, and profile picture if you choose to add them</li>
                <li><strong className="text-white">Journal entries:</strong> Dates, ratings, photos, videos, text prompts, and timeline details you post</li>
                <li><strong className="text-white">Social data:</strong> Friends, comments, and reactions you share</li>
                <li><strong className="text-white">Technical data:</strong> Device information and usage data necessary to run the app</li>
              </ul>
            </section>

            <section>
              <h2 className="text-white font-display text-xl mb-2">
                How We Use Your Information
              </h2>
              <p>
                We use your information to provide, maintain, and improve NightCapt, including:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Creating and managing your account</li>
                <li>Storing and displaying your journal entries and profile</li>
                <li>Enabling social features (friends, comments, reactions, leaderboards)</li>
                <li>Hosting and serving photos and media you upload</li>
                <li>Sending one-time SMS sign-in codes to verify your number</li>
                <li>Communicating with you about your account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-white font-display text-xl mb-2">
                Data Storage & Third Parties
              </h2>
              <p>
                Your data is stored and processed using Supabase, which provides our database and authentication services. Photos and media are stored in Supabase Storage. We use Vercel for hosting the app. Sign-in codes are sent by SMS through Supabase and its SMS provider. These services have their own privacy policies and security measures.
              </p>
            </section>

            <section>
              <h2 className="text-white font-display text-xl mb-2">
                Your Rights
              </h2>
              <p>
                You can access, update, or delete your account and data through the app. To request account deletion or data export, contact us using the details below.
              </p>
            </section>

            <section id="support">
              <h2 className="text-white font-display text-xl mb-2">
                Support & Contact
              </h2>
              <p>
                Need help? Email us at{" "}
                <a href="mailto:nightcapt1@outlook.com" className="text-nightcap-accent hover:underline">
                  nightcapt1@outlook.com
                </a>
                . We aim to respond within 24–48 hours.
              </p>
              <p className="mt-4 font-medium text-white">Common questions:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li><strong className="text-white">Sign in:</strong> Enter your mobile number and we will text you a one-time code. No password needed.</li>
                <li><strong className="text-white">Delete account:</strong> Profile, then Account, then Delete account.</li>
                <li><strong className="text-white">Report content:</strong> Tap the menu on any entry, comment, or profile, then Report.</li>
                <li><strong className="text-white">Block someone:</strong> Open their profile, then choose Block user.</li>
              </ul>
              <p className="mt-4">
                For privacy-related questions, contact us at the email above or through the app.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
