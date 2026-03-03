import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getItemRequestById, getOffers } from '@/lib/api';
import { OfferCard } from '@/components/offer-card';
import { OfferForm } from './offer-form';
import { ChatButton } from './chat-button';
import type { ItemRequestDto, OfferDto } from '@hew/shared';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const request = await getItemRequestById(id);
    if (!request) return {};
    const title = `${request.title} | Rubhew`;
    const description = request.description
      ? request.description.slice(0, 160)
      : `ขอของจาก ${(request.countries || []).join(', ')}`;
    const images = request.imageUrls || [];
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: images[0] ? [{ url: images[0] }] : [],
        locale: 'th_TH',
        type: 'article',
      },
      twitter: { card: 'summary_large_image', title, description },
    };
  } catch {
    return {};
  }
}

export default async function RequestDetailPage({ params }: PageProps) {
  const { id } = await params;

  let request: ItemRequestDto | null = null;
  let offers: OfferDto[] = [];

  try {
    const [reqData, offersData] = await Promise.all([
      getItemRequestById(id),
      getOffers({ itemRequestId: id }).catch(() => [] as OfferDto[]),
    ]);
    request = reqData;
    offers = Array.isArray(offersData) ? offersData : [];
  } catch {
    notFound();
  }

  if (!request) {
    notFound();
  }

  const imageUrl = request.imageUrls?.[0];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/requests"
        className="mb-6 inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
      >
        ← กลับไปขอของ
      </Link>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {imageUrl ? (
          <div className="relative aspect-video w-full bg-gray-100">
            <Image
              src={imageUrl}
              alt={request.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        ) : (
          <div className="aspect-video w-full bg-gradient-to-br from-primary-50 to-accent-50" />
        )}

        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {request.title}
              </h1>
              <p className="mt-2 text-gray-600">
                ต้องการจาก: {request.countries.join(', ')}
              </p>
              {request.maxBudget != null && (
                <p className="mt-1 font-medium text-primary-600">
                  งบประมาณสูงสุด ฿{Number(request.maxBudget).toLocaleString()}
                </p>
              )}
              {request.status && (
                <span
                  className={`mt-2 inline-block rounded-full px-3 py-1 text-sm font-medium ${
                    request.status === 'OPEN'
                      ? 'bg-blue-100 text-blue-800'
                      : request.status === 'MATCHED'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {request.status}
                </span>
              )}
            </div>
          </div>

          {request.description && (
            <div className="mt-6 border-t border-gray-100 pt-6">
              <h2 className="font-semibold text-gray-900">รายละเอียด</h2>
              <p className="mt-2 whitespace-pre-wrap text-gray-600">
                {request.description}
              </p>
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-4">
            <ChatButton itemRequestId={id} ownerSessionId={request.sessionId} />
          </div>

          <div className="mt-8">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              ข้อเสนอ ({offers.length})
            </h2>
            <div className="space-y-4">
              {offers.map((offer) => (
                <OfferCard
                  key={offer.id}
                  id={offer.id}
                  productPrice={offer.productPrice}
                  shippingFee={offer.shippingFee}
                  notes={offer.notes ?? undefined}
                  status={offer.status}
                />
              ))}
            </div>
          </div>

          {request.status === 'OPEN' && (
            <div className="mt-8 border-t border-gray-100 pt-6">
              <h2 className="mb-4 font-semibold text-gray-900">ส่งข้อเสนอ</h2>
              <OfferForm itemRequestId={id} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
