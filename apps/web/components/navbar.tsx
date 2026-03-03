'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import {
  Home,
  FileText,
  MessageCircle,
  Package,
  Plus,
  Menu,
  X,
  ChevronDown,
  Plane,
  ShoppingBag,
  User,
} from 'lucide-react';
import { useSession } from '@/lib/session-context';
import { Avatar } from '@/components/avatar';

export function Navbar() {
  const pathname = usePathname();
  const { session, isLoading } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const ordersRef = useRef<HTMLDivElement>(null);

  const displayName = session?.displayName || 'ผู้ใช้';
  const avatarSeed = session?.avatarSeed || session?.id || 'anon';

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ordersRef.current && !ordersRef.current.contains(e.target as Node)) {
        setOrdersOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive = (href: string) => pathname === href;
  const isOrdersActive = pathname.startsWith('/orders');

  return (
    <>
      {/* Desktop navbar */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto max-w-3xl px-4">
          <div className="flex h-14 items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 text-xl font-bold tracking-tight text-primary-600 hover:text-primary-700"
            >
              <Image src="/logo.png" alt="รับหิ้ว" width={32} height={32} className="rounded-lg" priority />
              <span className="hidden sm:inline">รับหิ้ว</span>
            </Link>

            {/* Desktop links */}
            <div className="hidden items-center gap-1 md:flex">
              <NavLink href="/" icon={<Home size={18} />} label="หน้าแรก" active={isActive('/')} />
              <NavLink href="/my-posts" icon={<FileText size={18} />} label="โพสต์ของฉัน" active={isActive('/my-posts')} />
              <NavLink href="/chat" icon={<MessageCircle size={18} />} label="แชท" active={isActive('/chat')} />

              {/* Orders dropdown */}
              <div ref={ordersRef} className="relative">
                <button
                  type="button"
                  onClick={() => setOrdersOpen(!ordersOpen)}
                  className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isOrdersActive
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Package size={18} />
                  คำสั่งซื้อ
                  <ChevronDown size={14} className={`transition-transform ${ordersOpen ? 'rotate-180' : ''}`} />
                </button>
                {ordersOpen && (
                  <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-xl border border-gray-100 bg-white py-1 shadow-lg">
                    <Link
                      href="/orders?role=traveler"
                      onClick={() => setOrdersOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Plane size={16} className="text-blue-500" />
                      ที่ต้องหิ้ว
                    </Link>
                    <Link
                      href="/orders?role=buyer"
                      onClick={() => setOrdersOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <ShoppingBag size={16} className="text-amber-500" />
                      ที่ต้องได้รับ
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Right side: create + avatar */}
            <div className="hidden items-center gap-3 md:flex">
              <Link
                href="/create-post"
                className="flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
              >
                <Plus size={16} />
                โพสต์
              </Link>
              {!isLoading && (
                <Link href="/profile" className="flex items-center gap-2">
                  <Avatar
                    src={session?.avatarUrl}
                    displayName={displayName}
                    avatarSeed={avatarSeed}
                    size="sm"
                    className="ring-2 ring-white"
                  />
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="เปิดเมนู"
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile menu */}
          {mobileOpen && (
            <div className="border-t border-gray-100 py-3 md:hidden">
              <div className="flex flex-col gap-1">
                <MobileNavLink href="/" icon={<Home size={18} />} label="หน้าแรก" active={isActive('/')} onClick={() => setMobileOpen(false)} />
                <MobileNavLink href="/my-posts" icon={<FileText size={18} />} label="โพสต์ของฉัน" active={isActive('/my-posts')} onClick={() => setMobileOpen(false)} />
                <MobileNavLink href="/chat" icon={<MessageCircle size={18} />} label="แชท" active={isActive('/chat')} onClick={() => setMobileOpen(false)} />
                <MobileNavLink href="/orders?role=traveler" icon={<Plane size={18} />} label="ที่ต้องหิ้ว" active={false} onClick={() => setMobileOpen(false)} />
                <MobileNavLink href="/orders?role=buyer" icon={<ShoppingBag size={18} />} label="ที่ต้องได้รับ" active={false} onClick={() => setMobileOpen(false)} />
                <MobileNavLink href="/profile" icon={<User size={18} />} label="โปรไฟล์" active={isActive('/profile')} onClick={() => setMobileOpen(false)} />
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-100 bg-white md:hidden">
        <div className="mx-auto flex max-w-md items-center justify-around py-1">
          <BottomNavLink href="/" icon={<Home size={20} />} label="หน้าแรก" active={isActive('/')} />
          <BottomNavLink href="/my-posts" icon={<FileText size={20} />} label="โพสต์" active={isActive('/my-posts')} />
          <Link
            href="/create-post"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg transition-transform hover:scale-105"
          >
            <Plus size={24} />
          </Link>
          <BottomNavLink href="/chat" icon={<MessageCircle size={20} />} label="แชท" active={isActive('/chat')} />
          <BottomNavLink href="/profile" icon={<User size={20} />} label="โปรไฟล์" active={isActive('/profile')} />
        </div>
      </nav>
    </>
  );
}

function NavLink({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? 'bg-primary-50 text-primary-600'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}

function MobileNavLink({ href, icon, label, active, onClick }: { href: string; icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium ${
        active ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-gray-50'
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}

function BottomNavLink({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-medium ${
        active ? 'text-primary-600' : 'text-gray-400'
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}
