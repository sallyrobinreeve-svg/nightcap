import Link from "next/link";

export default function SupportPage() {
  return (
    <div className="min-h-screen playful-bg py-12 px-4">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="inline-block text-nightcap-muted hover:text-nightcap-accent mb-8 transition"
        >
          Back
        </Link>
        <div className="glass rounded-2xl p-8">
          <h1 className="font-display text-3xl gradient-text mb-2">NightCapt Support</h1>
          <p className="text-nightcap-muted mb-8">
            Need help with your account, safety, or a night-out entry? Contact us and we will help.
          </p>

          <div className="space-y-6 text-nightcap-muted">
            <section>
              <h2 className="text-white font-display text-xl mb-2">Contact</h2>
              <p>
                Email{" "}
                <a href="mailto:nightcapt1@outlook.com" className="text-nightcap-accent hover:underline">
                  nightcapt1@outlook.com
                </a>
                . We aim to respond within 24-48 hours.
              </p>
            </section>

            <section>
              <h2 className="text-white font-display text-xl mb-2">Common questions</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Sign in: enter your mobile number and we will text you a one-time code.</li>
                <li>Delete account: go to Profile, then Account, then Delete account.</li>
                <li>Report content: tap the menu on an entry, comment, or profile, then Report.</li>
                <li>Block someone: open their profile and choose Block user.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-white font-display text-xl mb-2">Safety</h2>
              <p>
                NightCapt has zero tolerance for objectionable content or abusive users. Reports are
                reviewed within 24 hours and may lead to content removal or account removal.
              </p>
            </section>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/privacy" className="text-nightcap-accent hover:underline">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-nightcap-accent hover:underline">
                Terms of Use
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
