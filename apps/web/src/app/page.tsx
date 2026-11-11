import { Button } from '@circle/ui-web';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-6 px-4">
      <h1 className="text-4xl font-semibold tracking-tight">Banker&apos;sCircle</h1>
      <p className="text-lg text-neutral-600">
        A private, verified community for financial-services professionals in Lagos.
      </p>
      <div>
        <Button disabled>Join the waitlist — coming soon</Button>
      </div>
    </main>
  );
}
