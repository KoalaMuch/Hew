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
  title: 'รับหิ้ว | Rubhew - รับหิ้วของจากต่างประเทศ ง่ายนิดเดียว',
  description:
    'รับหิ้ว (Rubhew) - แพลตฟอร์มรับหิ้วของจากต่างประเทศ เชื่อมโยงนักเดินทางกับผู้ซื้อ | Marketplace connecting travelers and buyers in Thailand.',
  keywords: ['รับหิ้ว', 'rubhew', 'หิ้ว', 'marketplace', 'thailand', 'travel', 'shopping'],
  openGraph: {
    title: 'รับหิ้ว | Rubhew - รับหิ้วของจากต่างประเทศ ง่ายนิดเดียว',
    description:
      'แพลตฟอร์มรับหิ้วของจากต่างประเทศ เชื่อมโยงนักเดินทางกับผู้ซื้อ | Marketplace connecting travelers and buyers.',
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
            <main className="flex-1 pb-16 md:pb-0">{children}</main>
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
