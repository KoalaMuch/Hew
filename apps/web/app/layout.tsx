import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { SessionProvider } from '@/lib/session-context';
import { Navbar } from '@/components/navbar';
import './globals.css';

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'หิ้ว | Hew - หิ้วของจากต่างประเทศ ง่ายนิดเดียว',
  description:
    'Hew (หิ้ว) - Marketplace connecting travelers and buyers in Thailand. Get items from abroad, super easy. | แพลตฟอร์มหิ้วของจากต่างประเทศ เชื่อมโยงนักเดินทางกับผู้ซื้อ',
  keywords: ['หิ้ว', 'hew', 'marketplace', 'thailand', 'travel', 'shopping'],
  openGraph: {
    title: 'หิ้ว | Hew - หิ้วของจากต่างประเทศ ง่ายนิดเดียว',
    description:
      'Marketplace connecting travelers and buyers in Thailand. Get items from abroad, super easy.',
    locale: 'th_TH',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={inter.variable}>
      <body className="min-h-screen font-sans">
        <SessionProvider>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
