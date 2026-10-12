import type { Metadata } from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  applicationName: 'CaffeineMD',
  title: {
    default: 'CaffeineMD',
    template: '%s | CaffeineMD',
  },
  description: 'High-performance, local-first knowledge management workspace and Markdown wiki.',
  metadataBase: new URL('https://www.caffeinemd.wiki'),
  alternates: {
    canonical: 'https://www.caffeinemd.wiki',
  },
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">☕</text></svg>',
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'CaffeineMD — Local-First Markdown Wiki',
    description: 'High-performance, local-first knowledge base powered by Tiptap, IndexedDB, and File System Access.',
    url: 'https://www.caffeinemd.wiki',
    siteName: 'CaffeineMD',
    images: [
      {
        url: 'https://www.caffeinemd.wiki/og-caffeinemd.png',
        width: 1200,
        height: 630,
        alt: 'CaffeineMD - Lofi Girl Studying workspace illustration with coffee and code',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CaffeineMD',
    description: 'High-performance, local-first knowledge base and Markdown wiki.',
    images: ['https://www.caffeinemd.wiki/og-caffeinemd.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'CaffeineMD',
    url: 'https://www.caffeinemd.wiki',
    description: 'High-performance, local-first personal knowledge management workspace and Markdown wiki.',
    applicationCategory: 'ProductivityApplication',
    operatingSystem: 'All',
    image: 'https://www.caffeinemd.wiki/og-caffeinemd.png',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
