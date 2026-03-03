'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plane, ShoppingBag } from 'lucide-react';
import { getPosts, getTrendingHashtags } from '@/lib/api';
import { PostCard } from '@/components/post-card';
import { PostCardSkeleton } from '@/components/skeleton';
import { SearchBar } from '@/components/search-bar';
import { HashtagChip } from '@/components/hashtag-chip';

type PostType = 'RUBHEW' | 'HAKHONG' | null;

interface PostData {
  id: string;
  sessionId: string;
  type: 'RUBHEW' | 'HAKHONG';
  content: string;
  hashtags: string[];
  imageUrls: string[];
  country?: string;
  city?: string;
  travelDate?: string;
  budget?: number;
  viewCount: number;
  commentCount?: number;
  createdAt: string;
  session: { displayName: string; avatarSeed: string };
}

export default function FeedPage() {
  const [posts, setPosts] = useState<PostData[]>([]);
  const [trending, setTrending] = useState<Array<{ name: string; count: number }>>([]);
  const [activeType, setActiveType] = useState<PostType>(null);
  const [activeHashtag, setActiveHashtag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchPosts = useCallback(async (reset = false) => {
    const currentPage = reset ? 1 : page;
    try {
      setLoading(true);
      const res = await getPosts({
        type: activeType || undefined,
        hashtag: activeHashtag || undefined,
        search: searchQuery || undefined,
        page: currentPage,
        limit: 20,
      });
      const data = (res.data || []) as PostData[];
      if (reset) {
        setPosts(data);
        setPage(2);
      } else {
        setPosts((prev) => [...prev, ...data]);
        setPage((p) => p + 1);
      }
      setHasMore(data.length === 20);
    } catch {
      // API error — keep existing posts
    } finally {
      setLoading(false);
    }
  }, [activeType, activeHashtag, searchQuery, page]);

  useEffect(() => {
    fetchPosts(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeType, activeHashtag, searchQuery]);

  useEffect(() => {
    getTrendingHashtags(15)
      .then(setTrending)
      .catch(() => {});
  }, []);

  const handleHashtagClick = (tag: string) => {
    setActiveHashtag(activeHashtag === tag ? null : tag);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setActiveHashtag(null);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-6 md:pb-8">
      {/* Search */}
      <SearchBar onSearch={handleSearch} />

      {/* Type tabs */}
      <div className="mt-4 flex gap-2">
        <TabButton
          active={activeType === null}
          onClick={() => setActiveType(null)}
          label="ทั้งหมด"
        />
        <TabButton
          active={activeType === 'RUBHEW'}
          onClick={() => setActiveType(activeType === 'RUBHEW' ? null : 'RUBHEW')}
          icon={<Plane size={15} />}
          label="รับหิ้ว"
        />
        <TabButton
          active={activeType === 'HAKHONG'}
          onClick={() => setActiveType(activeType === 'HAKHONG' ? null : 'HAKHONG')}
          icon={<ShoppingBag size={15} />}
          label="หาของ"
        />
      </div>

      {/* Trending hashtags */}
      {trending.length > 0 && (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {trending.map((t) => (
            <HashtagChip
              key={t.name}
              tag={t.name}
              onClick={handleHashtagClick}
              active={activeHashtag === t.name}
            />
          ))}
        </div>
      )}

      {/* Feed */}
      <div className="mt-5 space-y-4">
        {loading && posts.length === 0 ? (
          Array.from({ length: 4 }).map((_, i) => <PostCardSkeleton key={i} />)
        ) : posts.length > 0 ? (
          <>
            {posts.map((post) => (
              <PostCard
                key={post.id}
                {...post}
                onHashtagClick={handleHashtagClick}
              />
            ))}
            {hasMore && (
              <button
                onClick={() => fetchPosts(false)}
                disabled={loading}
                className="w-full rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                {loading ? 'กำลังโหลด...' : 'โหลดเพิ่ม'}
              </button>
            )}
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
            <p className="text-gray-500">ยังไม่มีโพสต์</p>
            <p className="mt-1 text-sm text-gray-400">
              เริ่มต้นด้วยการสร้างโพสต์แรกของคุณ
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? 'bg-primary-600 text-white shadow-sm'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
