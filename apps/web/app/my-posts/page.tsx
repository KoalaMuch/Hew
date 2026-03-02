'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getMyPosts } from '@/lib/api';
import { PostCard } from '@/components/post-card';
import { PostCardSkeleton } from '@/components/skeleton';

interface PostData {
  id: string;
  type: 'RUBHEW' | 'HAKHONG';
  content: string;
  hashtags: string[];
  imageUrls: string[];
  country?: string;
  city?: string;
  travelDate?: string;
  budget?: number;
  viewCount: number;
  createdAt: string;
  session: { displayName: string; avatarSeed: string };
}

export default function MyPostsPage() {
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyPosts({ limit: 50 })
      .then((res) => setPosts((res.data || []) as PostData[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-6 md:pb-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">โพสต์ของฉัน</h1>
        <Link
          href="/create-post"
          className="flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
        >
          <Plus size={16} />
          สร้างโพสต์
        </Link>
      </div>

      <div className="mt-6 space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <PostCardSkeleton key={i} />)
        ) : posts.length > 0 ? (
          posts.map((post) => <PostCard key={post.id} {...post} />)
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
            <p className="text-gray-500">คุณยังไม่มีโพสต์</p>
            <Link
              href="/create-post"
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
            >
              <Plus size={16} />
              สร้างโพสต์แรก
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
