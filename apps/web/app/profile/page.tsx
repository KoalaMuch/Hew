'use client';

import { useEffect, useState, useCallback } from 'react';
import { User, Mail, Shield, LogOut, LogIn, Star } from 'lucide-react';
import { getProfile, updateSession, logout as apiLogout } from '@/lib/api';
import { useSession } from '@/lib/session-context';
import { AuthModal } from '@/components/auth-modal';

interface ProfileData {
  sessionId: string;
  displayName: string;
  avatarSeed: string;
  isRegistered: boolean;
  user: {
    id: string;
    email: string | null;
    displayName: string;
    avatarUrl: string | null;
    googleId: string | null;
    role: string;
    rating: number;
    reviewCount: number;
    createdAt: string;
  } | null;
}

export default function ProfilePage() {
  const { refresh } = useSession();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const data = await getProfile();
      setProfile(data);
      setNameValue(data.displayName);
    } catch {
      // not logged in — expected
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSaveName = async () => {
    if (!nameValue.trim()) return;
    setSaving(true);
    try {
      await updateSession({ displayName: nameValue.trim() });
      await refresh();
      await fetchProfile();
      setEditingName(false);
    } catch {
      // error saving
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiLogout();
      await refresh();
      await fetchProfile();
    } catch {
      // error
    }
  };

  const openAuth = (tab: 'login' | 'register') => {
    setAuthTab(tab);
    setShowAuth(true);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 pb-24 pt-6 md:pb-8">
        <div className="space-y-4">
          <div className="h-32 animate-pulse rounded-2xl bg-gray-200" />
          <div className="h-48 animate-pulse rounded-2xl bg-gray-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-6 md:pb-8">
      <h1 className="text-xl font-bold text-gray-900">โปรไฟล์</h1>

      {/* Avatar & Name */}
      <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-2xl font-bold text-white">
            {(profile?.avatarSeed || 'A').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-primary-400"
                  maxLength={50}
                />
                <button
                  onClick={handleSaveName}
                  disabled={saving}
                  className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  บันทึก
                </button>
                <button
                  onClick={() => { setEditingName(false); setNameValue(profile?.displayName || ''); }}
                  className="rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100"
                >
                  ยกเลิก
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-lg font-semibold text-gray-900">
                  {profile?.displayName || 'Anonymous'}
                </p>
                <button
                  onClick={() => setEditingName(true)}
                  className="text-xs text-primary-600 hover:text-primary-700"
                >
                  แก้ไข
                </button>
              </div>
            )}
            <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
              <User size={14} />
              {profile?.isRegistered ? 'สมาชิก' : 'ผู้ใช้ไม่ระบุตัวตน'}
            </p>
          </div>
        </div>
      </div>

      {/* Account info */}
      <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-semibold text-gray-900">ข้อมูลบัญชี</h2>

        {profile?.isRegistered && profile.user ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail size={18} className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">อีเมล</p>
                <p className="text-sm font-medium text-gray-900">
                  {profile.user.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield size={18} className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">สถานะ</p>
                <p className="text-sm font-medium text-gray-900">
                  {profile.user.role === 'ADMIN' ? 'ผู้ดูแลระบบ' : 'สมาชิก'}
                </p>
              </div>
            </div>
            {profile.user.reviewCount > 0 && (
              <div className="flex items-center gap-3">
                <Star size={18} className="text-amber-400" />
                <div>
                  <p className="text-xs text-gray-400">คะแนน</p>
                  <p className="text-sm font-medium text-gray-900">
                    {profile.user.rating.toFixed(1)} ({profile.user.reviewCount} รีวิว)
                  </p>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="mt-2 flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              <LogOut size={16} />
              ออกจากระบบ
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              สมัครสมาชิกเพื่อบันทึกประวัติและข้อมูลของคุณ
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => openAuth('register')}
                className="flex items-center gap-1.5 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
              >
                <User size={16} />
                สมัครสมาชิก
              </button>
              <button
                onClick={() => openAuth('login')}
                className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <LogIn size={16} />
                เข้าสู่ระบบ
              </button>
            </div>
          </div>
        )}
      </div>

      <AuthModal
        isOpen={showAuth}
        onClose={() => { setShowAuth(false); fetchProfile(); }}
        defaultTab={authTab}
      />
    </div>
  );
}
