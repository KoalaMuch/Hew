import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getPostById } from '@/lib/api';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const post = (await getPostById(id)) as PostData | null;
    if (!post) return {};
    const title = post.type === 'RUBHEW'
      ? `รับหิ้ว ${post.country || ''} | Rubhew`.trim()
      : `หาของ ${post.country || ''} | Rubhew`.trim();
    const description = post.content.slice(0, 160);
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: post.imageUrls[0] ? [{ url: post.imageUrls[0] }] : [],
        locale: 'th_TH',
        type: 'article',
      },
      twitter: { card: 'summary_large_image', title, description },
    };
  } catch {
    return {};
  }
}

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

function renderContent(content: string) {
  const parts = content.split(/(#[\w\u0E00-\u0E7F]+)/g);
  return parts.map((part, i) =>
    part.startsWith('#') ? (
      <Link
        key={i}
        href={`/?hashtag=${encodeURIComponent(part)}`}
        className="font-medium text-primary-600 hover:underline"
      >
        {part}
      </Link>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

export default async function PostDetailPage({ params }: PageProps) {
  const { id } = await params;

  let post: PostData | null = null;
  try {
    post = (await getPostById(id)) as PostData;
  } catch {
    notFound();
  }
  if (!post) notFound();

  const isRubhew = post.type === 'RUBHEW';
  const location = [post.city, post.country].filter(Boolean).join(', ');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Offer',
    name: isRubhew ? `รับหิ้ว ${post.country || ''}` : `หาของ ${post.country || ''}`,
    description: post.content.slice(0, 300),
    ...(post.budget ? { price: post.budget, priceCurrency: 'THB' } : {}),
    ...(post.imageUrls[0] ? { image: post.imageUrls[0] } : {}),
  };

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-6 md:pb-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Link
        href="/"
        className="mb-6 inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
      >
        ← กลับหน้าแรก
      </Link>

      <article className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        {/* Author */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-base font-bold text-white">
            {post.session.avatarSeed?.charAt(0).toUpperCase() || '?'}
          </div>
          <div>
            <p className="font-semibold text-gray-900">
              {post.session.displayName}
            </p>
            <p className="text-xs text-gray-400">
              {new Date(post.createdAt).toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <span
            className={`ml-auto inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${
              isRubhew
                ? 'bg-blue-50 text-blue-700'
                : 'bg-amber-50 text-amber-700'
            }`}
          >
            {isRubhew ? 'รับหิ้ว' : 'หาของ'}
          </span>
        </div>

        {/* Content */}
        <div className="mt-5">
          <p className="whitespace-pre-wrap leading-relaxed text-gray-700">
            {renderContent(post.content)}
          </p>
        </div>

        {/* Images */}
        {post.imageUrls.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {post.imageUrls.map((url, i) => (
              <div
                key={i}
                className="relative aspect-square overflow-hidden rounded-xl"
              >
                <Image src={url} alt="" fill className="object-cover" sizes="300px" />
              </div>
            ))}
          </div>
        )}

        {/* Metadata */}
        {(location || post.travelDate || post.budget) && (
          <div className="mt-4 flex flex-wrap gap-4 rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
            {location && (
              <div>
                <span className="text-xs text-gray-400">สถานที่</span>
                <p className="font-medium">{location}</p>
              </div>
            )}
            {post.travelDate && (
              <div>
                <span className="text-xs text-gray-400">วันที่เดินทาง</span>
                <p className="font-medium">
                  {new Date(post.travelDate).toLocaleDateString('th-TH')}
                </p>
              </div>
            )}
            {post.budget && (
              <div>
                <span className="text-xs text-gray-400">งบประมาณ</span>
                <p className="font-medium text-primary-600">
                  ฿{post.budget.toLocaleString()}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Hashtags */}
        {post.hashtags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {post.hashtags.map((tag) => (
              <Link
                key={tag}
                href={`/?hashtag=${encodeURIComponent(tag)}`}
                className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600 hover:bg-gray-200"
              >
                {tag}
              </Link>
            ))}
          </div>
        )}

        <div className="mt-4 border-t border-gray-100 pt-4 text-xs text-gray-400">
          เข้าชม {post.viewCount} ครั้ง
        </div>
      </article>
    </div>
  );
}
