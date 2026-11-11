import { GuillocheSeal } from '@/components/guilloche-seal';
import { WaitlistForm } from '@/components/waitlist-form';

const GUARANTEES = [
  {
    term: 'Every member is verified',
    detail:
      'We check your phone, your work email and your identity before you can see anyone. Membership is for people in financial services: banks, fintechs, insurers, asset managers, pension administrators and regulators.',
  },
  {
    term: 'Hidden from your colleagues',
    detail:
      'Choose to be invisible to everyone at your own institution. It’s free for every member, along with blocking, reporting and pausing your profile.',
  },
  {
    term: 'You decide what you’re here for',
    detail:
      'Friendship, mentorship, networking, communities or events. You only meet people looking for the same things, and nobody can message you until you’ve both said yes.',
  },
  {
    term: 'Met in person, not just online',
    detail:
      'Small, curated evenings in Victoria Island, Ikoyi and Lekki, where the people in the room have been verified too.',
  },
] as const;

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-8">
      <header className="flex items-center justify-between py-6">
        <span className="font-display text-2xl text-ink">Banker’sCircle</span>
        <a href="#join" className="link text-sm font-medium">
          Join the waitlist
        </a>
      </header>

      <main>
        <section className="grid items-center gap-10 pt-6 pb-16 md:grid-cols-[1.15fr_1fr] md:gap-16 md:pt-16 md:pb-24">
          <div className="order-2 md:order-1">
            <h1 className="font-display text-[2.6rem] leading-[1.05] text-ink sm:text-6xl md:text-[4.25rem]">
              A private circle for people in Lagos finance.
            </h1>
            <p className="mt-6 max-w-[34rem] text-lg leading-relaxed text-ink-soft">
              Meet friends, mentors and peers who understand your hours and your industry. Every
              member is verified, and you can stay invisible to the people you work with.
            </p>
            <a
              href="#join"
              className="mt-9 inline-flex h-12 items-center rounded-[3px] bg-ink px-6 font-medium text-paper hover:bg-engrave focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-engrave"
            >
              Join the waitlist
            </a>
          </div>
          <div className="order-1 md:order-2">
            <GuillocheSeal className="seal mx-auto w-56 text-engrave sm:w-72 md:w-full md:max-w-[30rem]" />
          </div>
        </section>

        <section aria-labelledby="how-heading" className="border-t border-hairline py-16 md:py-20">
          <h2 id="how-heading" className="font-display text-3xl text-ink sm:text-4xl">
            What every member can count on
          </h2>
          <dl className="mt-10 grid gap-x-16 gap-y-10 md:grid-cols-2">
            {GUARANTEES.map(({ term, detail }) => (
              <div key={term} className="border-l-2 border-engrave/40 pl-5">
                <dt className="text-lg font-semibold text-ink">{term}</dt>
                <dd className="mt-2 max-w-prose leading-relaxed text-ink-soft">{detail}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section
          id="join"
          aria-labelledby="join-heading"
          className="paper-panel mb-16 scroll-mt-6 rounded-[4px] px-5 py-10 sm:px-10 md:mb-24 md:py-14"
        >
          <div className="max-w-3xl">
            <h2 id="join-heading" className="font-display text-3xl text-ink sm:text-4xl">
              Join the waitlist
            </h2>
            <p className="mt-3 mb-9 max-w-prose leading-relaxed text-ink-soft">
              We’re opening in Lagos first, to a small invited group, then Abuja. Tell us a little
              about you so we know where to start.
            </p>
            <WaitlistForm />
          </div>
        </section>
      </main>

      <footer className="border-t border-hairline py-8 text-sm leading-relaxed text-ink-soft">
        <p className="max-w-prose">
          Banker’sCircle is independent. It is not affiliated with, sponsored or endorsed by any
          bank or financial institution.
        </p>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
          <p>© {new Date().getFullYear()} MajorGBN Innovations Limited</p>
          <a href="/privacy" className="link">
            Privacy notice
          </a>
        </div>
      </footer>
    </div>
  );
}
