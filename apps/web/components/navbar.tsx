'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useSession } from '@/lib/session-context';

const navLinks = [
  { href: '/', label: 'หน้าแรก' },
  { href: '/trips', label: 'ทริป' },
  { href: '/requests', label: 'ขอของ' },
  { href: '/orders', label: 'คำสั่งซื้อ' },
];

export function Navbar() {
  const pathname = usePathname();
  const { session, isLoading } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const displayName = session?.displayName || 'ผู้ใช้';
  const avatarSeed = session?.avatarSeed || session?.id || 'anon';

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <Link
            href="/"
            className="text-xl font-bold text-primary-600 hover:text-primary-700"
          >
            หิ้ว
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex md:items-center md:gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'text-primary-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {!isLoading && (
              <div className="flex items-center gap-2">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-600"
                  title={displayName}
                >
                  {avatarSeed.charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[100px] truncate text-sm text-gray-600">
                  {displayName}
                </span>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="เปิดเมนู"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="border-t border-gray-200 py-4 md:hidden">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg px-4 py-2 text-sm font-medium ${
                    pathname === link.href
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              {!isLoading && (
                <div className="flex items-center gap-2 border-t border-gray-200 px-4 pt-4">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-600"
                    title={displayName}
                  >
                    {avatarSeed.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-600">{displayName}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
