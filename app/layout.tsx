import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  applicationName: 'CaffeineMD',
  title: {
    default: 'CaffeineMD',
    template: '%s | CaffeineMD',
  },
  description: 'CaffeineMD is a high-performance, local-first knowledge management workspace modeled after Obsidian and Notion, powered by Tiptap, IndexedDB, and the File System Access API.',
  openGraph: {
    title: 'CaffeineMD',
    siteName: 'CaffeineMD',
    description: 'CaffeineMD is a high-performance, local-first knowledge management workspace modeled after Obsidian and Notion, powered by Tiptap, IndexedDB, and the File System Access API.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CaffeineMD',
    description: 'CaffeineMD is a high-performance, local-first knowledge management workspace modeled after Obsidian and Notion, powered by Tiptap, IndexedDB, and the File System Access API.',
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
