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
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': 'https://www.caffeinemd.wiki/#website',
        url: 'https://www.caffeinemd.wiki',
        name: 'CaffeineMD',
        description: 'High-performance, local-first Markdown knowledge base and personal wiki.',
        inLanguage: 'en-US',
        publisher: {
          '@id': 'https://www.caffeinemd.wiki/#organization',
        },
      },
      {
        '@type': 'WebPage',
        '@id': 'https://www.caffeinemd.wiki/#webpage',
        url: 'https://www.caffeinemd.wiki',
        name: 'CaffeineMD — Local-First Markdown Wiki',
        description: 'Zero latency. Zero lock-in. A keyboard-driven Markdown wiki powered by IndexedDB and the File System Access API. Install the native app directly to your desktop or phone in one click.',
        isPartOf: {
          '@id': 'https://www.caffeinemd.wiki/#website',
        },
        about: {
          '@id': 'https://www.caffeinemd.wiki/#software',
        },
        inLanguage: 'en-US',
      },
      {
        '@type': ['WebApplication', 'SoftwareApplication'],
        '@id': 'https://www.caffeinemd.wiki/#software',
        name: 'CaffeineMD',
        alternateName: 'Caffeine MD',
        url: 'https://www.caffeinemd.wiki',
        description: 'Zero latency. Zero lock-in. A keyboard-driven Markdown wiki powered by IndexedDB and the File System Access API. Install the native app directly to your desktop or phone in one click.',
        applicationCategory: 'ProductivityApplication',
        applicationSubCategory: 'Knowledge Management System',
        operatingSystem: 'All',
        browserRequirements: 'Requires modern browser with HTML5 and JavaScript support.',
        image: 'https://www.caffeinemd.wiki/og-caffeinemd.png',
        screenshot: 'https://www.caffeinemd.wiki/og-caffeinemd.png',
        softwareVersion: '1.0.0',
        featureList: [
          'Local-First Storage via IndexedDB and File System Access API',
          'Rich text editor powered by Tiptap v2 and ProseMirror',
          'Bi-directional WikiLinks and D3 physics knowledge graph',
          'Lossless Markdown and YAML frontmatter roundtrip',
          'Frontmatter database views (Table, Kanban, List)',
          'Installable Progressive Web App (PWA) with native offline execution',
          'Unsaved working copy diff comparison and configurable autosave',
        ],
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        creator: {
          '@id': 'https://www.caffeinemd.wiki/#organization',
        },
        publisher: {
          '@id': 'https://www.caffeinemd.wiki/#organization',
        },
      },
      {
        '@type': 'Organization',
        '@id': 'https://www.caffeinemd.wiki/#organization',
        name: 'ISICECAKEOISIS INC.',
        url: 'https://tehwiz.com',
        logo: 'https://www.caffeinemd.wiki/icon-512.png',
        brand: {
          '@type': 'Brand',
          name: 'TehWiz Production',
          url: 'https://tehwiz.com',
        },
      },
    ],
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
