import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Kite MD - Local-First Knowledge & Notes',
  description: 'High-performance local-first knowledge base with Tiptap markdown editor, recursive directory import, WikiLinks, interactive graph view, and Notion-style databases.',
  openGraph: {
    title: 'Kite MD - Local-First Knowledge & Notes',
    description: 'High-performance local-first knowledge base with Tiptap markdown editor, recursive directory import, WikiLinks, interactive graph view, and Notion-style databases.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kite MD - Local-First Knowledge & Notes',
    description: 'High-performance local-first knowledge base with Tiptap markdown editor, recursive directory import, WikiLinks, interactive graph view, and Notion-style databases.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
