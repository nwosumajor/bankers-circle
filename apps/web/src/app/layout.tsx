import type { Metadata, Viewport } from 'next';
import { Gloock, Hanken_Grotesk } from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';

const display = Gloock({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-gloock',
  display: 'swap',
});
const body = Hanken_Grotesk({ subsets: ['latin'], variable: '--font-hanken', display: 'swap' });

export const metadata: Metadata = {
  title: "Banker'sCircle",
  description:
    'A private, verified community for people in Lagos finance. Meet friends, mentors and peers, and stay invisible to your colleagues.',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#E9EFEA' },
    { media: '(prefers-color-scheme: dark)', color: '#0C1D19' },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-NG" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-dvh bg-paper font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
