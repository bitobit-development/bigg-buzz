import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { ConditionalLayout } from '@/components/layout';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Bigg Buzz - Cannabis Marketplace',
  description: 'South Africa\'s premier cannabis marketplace connecting consumers with verified vendors.',
  keywords: ['cannabis', 'marketplace', 'south africa', 'dispensary', 'CBD', 'THC'],
  authors: [{ name: 'Bigg Buzz' }],
  creator: 'Bigg Buzz',
  publisher: 'Bigg Buzz',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    locale: 'en_ZA',
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: 'Bigg Buzz',
    title: 'Bigg Buzz - Cannabis Marketplace',
    description: 'South Africa\'s premier cannabis marketplace connecting consumers with verified vendors.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bigg Buzz - Cannabis Marketplace',
    description: 'South Africa\'s premier cannabis marketplace connecting consumers with verified vendors.',
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        <ConditionalLayout>{children}</ConditionalLayout>
        <Toaster />
      </body>
    </html>
  );
}
