'use client';

import { memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Calendar, Eye, MessageSquare, Trash2 } from 'lucide-react';
import { Avatar } from '@/components/avatar';
import { PostTypeBadge } from './post-type-badge';
import { HashtagChip } from './hashtag-chip';

interface PostCardProps {
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
  session: {
    displayName: string;
    avatarSeed: string;
    avatarUrl?: string | null;
  };
  onHashtagClick?: (tag: string) => void;
  onDelete?: (id: string) => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'เมื่อสักครู่';
  if (mins < 60) return `${mins} นาทีที่แล้ว`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} วันที่แล้ว`;
  return new Date(dateStr).toLocaleDateString('th-TH');
}

function renderContent(content: string) {
  const parts = content.split(/(#[\w\u0E00-\u0E7F]+)/g);
  return parts.map((part, i) =>
    part.startsWith('#') ? (
      <span key={i} className="font-medium text-primary-600">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

export const PostCard = memo(function PostCard({
  id,
  sessionId,
  type,
  content,
  hashtags,
  imageUrls,
  country,
  city,
  travelDate,
  budget,
  viewCount,
  commentCount = 0,
  createdAt,
  session,
  onHashtagClick,
  onDelete,
}: PostCardProps) {
  const location = [city, country].filter(Boolean).join(', ');

  return (
    <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      {/* Author row */}
      <div className="flex items-center gap-3">
        <Link href={`/users/${sessionId}`} className="shrink-0 hover:ring-2 hover:ring-primary-300 hover:rounded-full">
          <Avatar
            src={session.avatarUrl}
            displayName={session.displayName}
            avatarSeed={session.avatarSeed}
            size="md"
          />
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            href={`/users/${sessionId}`}
            className="truncate text-sm font-semibold text-gray-900 hover:text-primary-600"
          >
            {session.displayName}
          </Link>
          <p className="text-xs text-gray-400">{timeAgo(createdAt)}</p>
        </div>
        <PostTypeBadge type={type} />
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(id)}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
            aria-label="ลบโพสต์"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* Content */}
      <Link href={`/posts/${id}`} className="mt-3 block">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
          {renderContent(content.length > 300 ? content.slice(0, 300) + '...' : content)}
        </p>
      </Link>

      {/* Images */}
      {imageUrls.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {imageUrls.slice(0, 4).map((url, i) => (
            <div
              key={i}
              className="relative h-32 w-32 shrink-0 overflow-hidden rounded-xl"
            >
              <Image
                src={url}
                alt=""
                fill
                className="object-cover"
                sizes="128px"
              />
            </div>
          ))}
        </div>
      )}

      {/* Metadata row */}
      {(location || travelDate || budget) && (
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
          {location && (
            <span className="inline-flex items-center gap-1">
              <MapPin size={13} /> {location}
            </span>
          )}
          {travelDate && (
            <span className="inline-flex items-center gap-1">
              <Calendar size={13} />{' '}
              {new Date(travelDate).toLocaleDateString('th-TH')}
            </span>
          )}
          {budget && (
            <span className="font-medium text-primary-600">
              ฿{budget.toLocaleString()}
            </span>
          )}
        </div>
      )}

      {/* Hashtags */}
      {hashtags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {hashtags.map((tag) => (
            <HashtagChip key={tag} tag={tag} onClick={onHashtagClick} />
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between border-t border-gray-50 pt-3">
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span className="inline-flex items-center gap-1">
            <Eye size={13} /> {viewCount}
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageSquare size={13} /> {commentCount}
          </span>
        </div>
        <Link
          href={`/posts/${id}`}
          className="text-xs font-medium text-primary-600 hover:text-primary-700"
        >
          ดูรายละเอียด
        </Link>
      </div>
    </article>
  );
});
