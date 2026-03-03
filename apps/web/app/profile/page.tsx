'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRef } from 'react';
import { User, Mail, Shield, LogOut, LogIn, Star, FileText, Camera, X } from 'lucide-react';
import {
  getProfile,
  getMyPosts,
  getReviewsForSession,
  updateSession,
  uploadImage,
  logout as apiLogout,
} from '@/lib/api';
import { MAX_IMAGE_SIZE_MB, ALLOWED_IMAGE_TYPES } from '@hew/shared';
import { useSession } from '@/lib/session-context';
import { Avatar } from '@/components/avatar';
import { PostCard } from '@/components/post-card';
import dynamic from 'next/dynamic';

const AuthModal = dynamic(() => import('@/components/auth-modal').then(m => ({ default: m.AuthModal })), {
  ssr: false,
});

interface ProfileData {
  sessionId: string;
  displayName: string;
  avatarSeed: string;
  avatarUrl?: string | null;
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
  const [posts, setPosts] = useState<
    Array<{
      id: string;
      sessionId: string;
      type: 'RUBHEW' | 'HAKHONG';
      content: string;
      hashtags: string[];
      imageUrls: string[];
      viewCount: number;
      commentCount?: number;
      createdAt: string;
      session: { displayName: string; avatarSeed: string; avatarUrl?: string | null };
    }>
  >([]);
  const [reviews, setReviews] = useState<
    Array<{
      id: string;
      rating: number;
      comment: string | null;
      createdAt: string;
      reviewerSession: { displayName: string; avatarSeed: string; avatarUrl?: string | null };
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [editingAvatarSeed, setEditingAvatarSeed] = useState(false);
  const [avatarSeedValue, setAvatarSeedValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProfile = useCallback(async () => {
    try {
      const data = await getProfile();
      setProfile(data);
      setNameValue(data.displayName);
      setAvatarSeedValue(data.avatarSeed || '');
      if (data.sessionId) {
        const [postsRes, reviewsData] = await Promise.all([
          getMyPosts({ page: 1, limit: 10 }),
          getReviewsForSession(data.sessionId),
        ]);
        setPosts(postsRes.data);
        setReviews(reviewsData);
      }
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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadError(null);
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      setUploadError('ขนาดไฟล์ต้องไม่เกิน 10MB');
      return;
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
      setUploadError('รองรับเฉพาะ JPEG, PNG, WebP');
      return;
    }
    setUploading(true);
    try {
      const { url } = await uploadImage(file, 'avatars');
      await updateSession({ avatarUrl: url });
      await refresh();
      await fetchProfile();
    } catch {
      setUploadError('อัปโหลดไม่สำเร็จ');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setUploadError(null);
    setSaving(true);
    try {
      await updateSession({ avatarUrl: null });
      await refresh();
      await fetchProfile();
    } catch {
      setUploadError('ลบรูปไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAvatarSeed = async () => {
    setSaving(true);
    try {
      await updateSession({
        avatarSeed: avatarSeedValue.trim() || profile?.avatarSeed || undefined,
      });
      await refresh();
      await fetchProfile();
      setEditingAvatarSeed(false);
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
          <div className="relative shrink-0">
            <Avatar
              src={profile?.avatarUrl}
              displayName={profile?.displayName}
              avatarSeed={profile?.avatarSeed}
              size="lg"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_IMAGE_TYPES.join(',')}
              className="hidden"
              onChange={handleAvatarUpload}
              disabled={uploading}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg transition-opacity hover:bg-primary-700 disabled:opacity-50"
              title="อัปโหลดรูปโปรไฟล์"
            >
              <Camera size={14} />
            </button>
            {profile?.avatarUrl && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                disabled={saving}
                className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                title="ลบรูปโปรไฟล์"
              >
                <X size={12} />
              </button>
            )}
          </div>
          <div className="flex-1">
            {uploadError && (
              <p className="mb-2 text-sm text-red-600">{uploadError}</p>
            )}
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
            {editingAvatarSeed ? (
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="text"
                  value={avatarSeedValue}
                  onChange={(e) => setAvatarSeedValue(e.target.value)}
                  placeholder="ตัวอักษรสำหรับอวาตาร์ (เช่น A)"
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-primary-400"
                  maxLength={50}
                />
                <button
                  onClick={handleSaveAvatarSeed}
                  disabled={saving}
                  className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  บันทึก
                </button>
                <button
                  onClick={() => {
                    setEditingAvatarSeed(false);
                    setAvatarSeedValue(profile?.avatarSeed || '');
                  }}
                  className="rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100"
                >
                  ยกเลิก
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingAvatarSeed(true)}
                className="mt-2 text-xs text-primary-600 hover:text-primary-700"
              >
                เปลี่ยนตัวอักษรอวาตาร์
              </button>
            )}
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
            <div className="flex items-center gap-3">
              <Star size={18} className="text-amber-400" />
              <div>
                <p className="text-xs text-gray-400">คะแนน</p>
                <p className="text-sm font-medium text-gray-900">
                  {profile.user.reviewCount > 0
                    ? `${profile.user.rating.toFixed(1)} (${profile.user.reviewCount} รีวิว)`
                    : 'ยังไม่มีรีวิว'}
                </p>
              </div>
            </div>
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

      {/* My Hew Stories */}
      {profile?.sessionId && posts.length > 0 && (
        <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
            <FileText size={18} />
            โพสต์ของฉัน
          </h2>
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} {...post} />
            ))}
          </div>
          <Link
            href="/my-posts"
            className="mt-4 inline-block text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            ดูทั้งหมด →
          </Link>
        </div>
      )}

      {/* Reviews received */}
      {profile?.sessionId && reviews.length > 0 && (
        <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
            <Star size={18} className="text-amber-400" />
            รีวิวที่ได้รับ
          </h2>
          <div className="space-y-4">
            {reviews.slice(0, 5).map((review) => (
              <div key={review.id} className="rounded-xl bg-gray-50 p-4">
                <div className="flex items-center gap-2">
                  <Avatar
                    src={review.reviewerSession?.avatarUrl}
                    displayName={review.reviewerSession?.displayName}
                    avatarSeed={review.reviewerSession?.avatarSeed}
                    size="sm"
                  />
                  <span className="font-medium text-gray-900">
                    {review.reviewerSession?.displayName || 'Anonymous'}
                  </span>
                  <span className="flex items-center gap-1 text-amber-500">
                    <Star size={14} fill="currentColor" />
                    {review.rating}
                  </span>
                </div>
                {review.comment && (
                  <p className="mt-2 text-sm text-gray-600">{review.comment}</p>
                )}
                <p className="mt-1 text-xs text-gray-400">
                  {new Date(review.createdAt).toLocaleDateString('th-TH')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <AuthModal
        isOpen={showAuth}
        onClose={() => { setShowAuth(false); fetchProfile(); }}
        defaultTab={authTab}
      />
    </div>
  );
}
