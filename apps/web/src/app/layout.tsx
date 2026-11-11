import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: "Banker'sCircle",
  description: 'A private, verified community for financial-services professionals in Lagos.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-NG">
      <body className="min-h-dvh bg-white text-neutral-900 antialiased">{children}</body>
    </html>
  );
}
