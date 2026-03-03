import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { User, MapPin, Star, MessageSquare } from 'lucide-react';
import { getPublicProfile, getPosts } from '@/lib/api';
import { PostCard } from '@/components/post-card';
import { Avatar } from '@/components/avatar';

interface PageProps {
  params: Promise<{ sessionId: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { sessionId } = await params;
  try {
    const profile = await getPublicProfile(sessionId);
    return {
      title: `${profile.displayName} | Rubhew`,
      description: `โปรไฟล์ของ ${profile.displayName} - ${profile.postCount} โพสต์, คะแนน ${profile.rating.toFixed(1)} จาก ${profile.reviewCount} รีวิว`,
    };
  } catch {
    return {};
  }
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { sessionId } = await params;

  let profile;
  try {
    profile = await getPublicProfile(sessionId);
  } catch {
    notFound();
  }

  const postsRes = await getPosts({ sessionId, page: 1, limit: 20 });
  const userPosts = postsRes.data;

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-6 md:pb-8">
      <Link
        href="/"
        className="mb-6 inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
      >
        ← กลับหน้าแรก
      </Link>

      {/* Profile header */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <Avatar
            src={profile.avatarUrl}
            displayName={profile.displayName}
            avatarSeed={profile.avatarSeed}
            size="lg"
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-gray-900">
              {profile.displayName}
            </h1>
            <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
              <User size={14} />
              {profile.isRegistered ? 'สมาชิก' : 'ผู้ใช้ไม่ระบุตัวตน'}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              สมาชิกตั้งแต่{' '}
              {new Date(profile.memberSince).toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-3 gap-4 rounded-xl bg-gray-50 p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {profile.postCount}
            </p>
            <p className="text-xs text-gray-500">โพสต์</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {profile.rating.toFixed(1)}
            </p>
            <p className="text-xs text-gray-500">คะแนนเฉลี่ย</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {profile.reviewCount}
            </p>
            <p className="text-xs text-gray-500">รีวิว</p>
          </div>
        </div>

        {/* Chat button - will be wired when chat entry points are done */}
        <div className="mt-4">
          <Link
            href={`/chat?participant=${sessionId}`}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700"
          >
            <MessageSquare size={18} />
            ส่งข้อความ
          </Link>
        </div>
      </div>

      {/* Reviews */}
      {profile.reviews.length > 0 && (
        <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
            <Star size={18} className="text-amber-400" />
            รีวิวที่ได้รับ ({profile.reviewCount})
          </h2>
          <div className="space-y-4">
            {profile.reviews.map((review) => (
              <div
                key={review.id}
                className="rounded-xl bg-gray-50 p-4"
              >
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

      {/* User's posts */}
      <div className="mt-6">
        <h2 className="mb-4 font-semibold text-gray-900">โพสต์ของ {profile.displayName}</h2>
        {userPosts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-12 text-center text-gray-500">
            ยังไม่มีโพสต์
          </div>
        ) : (
          <div className="space-y-4">
            {userPosts.map((post) => (
              <PostCard
                key={post.id}
                {...post}
                country={post.country ?? undefined}
                city={post.city ?? undefined}
                travelDate={post.travelDate ?? undefined}
                budget={post.budget ?? undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
