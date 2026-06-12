import type { Metadata } from 'next';
import localFont from 'next/font/local';

import './globals.css';

const generalSans = localFont({
  src: [
    { path: '../fonts/GeneralSans-400.woff2', weight: '400' },
    { path: '../fonts/GeneralSans-500.woff2', weight: '500' },
    { path: '../fonts/GeneralSans-600.woff2', weight: '600' },
  ],
  variable: '--font-general-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'Drafty', template: '%s | Drafty' },
  description:
    'A fast, simple writing workspace for professionals. Rich text documents, autosaved, everywhere.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${generalSans.variable} antialiased`}>{children}</body>
    </html>
  );
}
