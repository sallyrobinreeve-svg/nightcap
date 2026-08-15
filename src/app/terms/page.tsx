import Link from "next/link";

export default function TermsPage() {
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
          <h1 className="font-display text-3xl gradient-text mb-2">Terms of Use</h1>
          <p className="text-nightcap-muted text-sm mb-8">
            Last updated: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </p>

          <div className="space-y-6 text-nightcap-muted">
            <section>
              <h2 className="text-white font-display text-xl mb-2">Using NightCapt</h2>
              <p>
                NightCapt is a social journal for saving and sharing night-out memories. You are
                responsible for the content you post and for using the app respectfully.
              </p>
            </section>

            <section>
              <h2 className="text-white font-display text-xl mb-2">User content and safety</h2>
              <p>
                We have zero tolerance for objectionable content or abusive users. Do not post
                harassment, hate, threats, explicit content involving minors, illegal content, or
                content that violates someone else&apos;s privacy or rights.
              </p>
              <p className="mt-3">
                Users can report entries, comments, and profiles, and can block other users. We
                review reports within 24 hours and may remove content or accounts.
              </p>
            </section>

            <section>
              <h2 className="text-white font-display text-xl mb-2">Accounts</h2>
              <p>
                You can update your profile or delete your account from within the app. Sign in with
                a one-time SMS code sent to your mobile number. Deleting your account removes your
                account and associated app data.
              </p>
            </section>

            <section>
              <h2 className="text-white font-display text-xl mb-2">Contact</h2>
              <p>
                Questions about these terms? Email{" "}
                <a href="mailto:nightcapt1@outlook.com" className="text-nightcap-accent hover:underline">
                  nightcapt1@outlook.com
                </a>
                .
              </p>
            </section>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/privacy" className="text-nightcap-accent hover:underline">
                Privacy Policy
              </Link>
              <Link href="/support" className="text-nightcap-accent hover:underline">
                Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
