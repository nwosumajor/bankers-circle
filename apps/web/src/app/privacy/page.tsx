import { WAITLIST_POLICY_VERSION } from '@circle/contracts';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: "Waitlist privacy notice · Banker'sCircle" };

/** Set at build time; the default is only for local development. */
const CONTACT = process.env['PRIVACY_CONTACT_EMAIL'] ?? 'privacy@example.com';

// DRAFT pending legal review (CLAUDE.md §12). Changing this text means bumping WAITLIST_POLICY_VERSION.
export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-[42rem] px-4 py-12 leading-relaxed text-ink-soft sm:py-16">
      <a href="/" className="link text-sm">
        Back to Banker’sCircle
      </a>
      <h1 className="mt-6 font-display text-4xl text-ink">Waitlist privacy notice</h1>
      <p className="mt-2 text-sm">Version {WAITLIST_POLICY_VERSION}</p>

      <div className="mt-8 space-y-8 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-ink">
        <section>
          <h2>Who we are</h2>
          <p>
            Banker’sCircle is operated by MajorGBN Innovations Limited (RC 9739429), a company
            registered in Nigeria. We are the data controller for the information you give us when
            you join the waitlist.
          </p>
        </section>
        <section>
          <h2>What we collect</h2>
          <p>
            Your email address; your first name, if you give it; the part of financial services you
            work in; the area you’re based in; what you’d come for; and the date, time and version
            of this notice when you agreed to it. We don’t ask for your employer, and we don’t use
            tracking cookies on this page.
          </p>
        </section>
        <section>
          <h2>Why we collect it</h2>
          <p>
            To invite you when Banker’sCircle opens in your area, and to decide where and for whom
            to open first, using totals rather than individual answers. We rely on your consent
            under the Nigeria Data Protection Act 2023.
          </p>
        </section>
        <section>
          <h2>What we will never do</h2>
          <p>Sell your information, share it with your employer, or use it for advertising.</p>
        </section>
        <section>
          <h2>Where it is stored</h2>
          <p>
            With our hosting providers on servers in the European Union, under data processing
            agreements that require them to protect it.
          </p>
        </section>
        <section>
          <h2>How long we keep it</h2>
          <p>
            Until 12 months after Banker’sCircle launches in your area, or until you ask us to
            delete it, whichever comes first.
          </p>
        </section>
        <section>
          <h2>Your rights</h2>
          <p>
            You can ask to see, correct or delete your information, or withdraw your consent, at any
            time by emailing{' '}
            <a className="link" href={`mailto:${CONTACT}`}>
              {CONTACT}
            </a>
            . You can also complain to the Nigeria Data Protection Commission.
          </p>
        </section>
      </div>
    </main>
  );
}
