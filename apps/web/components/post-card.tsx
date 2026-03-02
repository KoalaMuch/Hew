'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Calendar, Eye } from 'lucide-react';
import { PostTypeBadge } from './post-type-badge';
import { HashtagChip } from './hashtag-chip';

interface PostCardProps {
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
  session: {
    displayName: string;
    avatarSeed: string;
  };
  onHashtagClick?: (tag: string) => void;
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

export function PostCard({
  id,
  type,
  content,
  hashtags,
  imageUrls,
  country,
  city,
  travelDate,
  budget,
  viewCount,
  createdAt,
  session,
  onHashtagClick,
}: PostCardProps) {
  const location = [city, country].filter(Boolean).join(', ');

  return (
    <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      {/* Author row */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-sm font-bold text-white">
          {session.avatarSeed?.charAt(0).toUpperCase() || '?'}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900">
            {session.displayName}
          </p>
          <p className="text-xs text-gray-400">{timeAgo(createdAt)}</p>
        </div>
        <PostTypeBadge type={type} />
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
        <span className="inline-flex items-center gap-1 text-xs text-gray-400">
          <Eye size={13} /> {viewCount}
        </span>
        <Link
          href={`/posts/${id}`}
          className="text-xs font-medium text-primary-600 hover:text-primary-700"
        >
          ดูรายละเอียด
        </Link>
      </div>
    </article>
  );
}
