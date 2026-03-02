import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getItemRequestById, getOffers } from '@/lib/api';
import { OfferCard } from '@/components/offer-card';
import { OfferForm } from './offer-form';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RequestDetailPage({ params }: PageProps) {
  const { id } = await params;

  let request: Record<string, unknown> | null = null;
  let offers: unknown[] = [];

  try {
    const [reqData, offersData] = await Promise.all([
      getItemRequestById(id),
      getOffers({ itemRequestId: id }).catch(() => []),
    ]);
    request = reqData as Record<string, unknown> | null;
    offers = Array.isArray(offersData) ? offersData : [];
  } catch {
    notFound();
  }

  if (!request) {
    notFound();
  }

  const offerList = (Array.isArray(offers) ? offers : []) as Record<string, unknown>[];
  const imageUrls = (request.imageUrls as string[]) || [];
  const imageUrl = imageUrls[0];

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
          <div className="aspect-video w-full bg-gray-100">
            <img
              src={imageUrl}
              alt={String(request.title)}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="aspect-video w-full bg-gradient-to-br from-primary-50 to-accent-50" />
        )}

        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {String(request.title)}
              </h1>
              <p className="mt-2 text-gray-600">
                ต้องการจาก: {(request.countries as string[] | undefined)?.join(', ') ?? ''}
              </p>
              {request.maxBudget != null && (
                <p className="mt-1 font-medium text-primary-600">
                  งบประมาณสูงสุด ฿{Number(request.maxBudget).toLocaleString()}
                </p>
              )}
              {typeof request.status === 'string' && request.status !== '' && (
                <span
                  className={`mt-2 inline-block rounded-full px-3 py-1 text-sm font-medium ${
                    request.status === 'OPEN'
                      ? 'bg-blue-100 text-blue-800'
                      : request.status === 'MATCHED'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {String(request.status)}
                </span>
              )}
            </div>
          </div>

          {request.description != null && request.description !== '' && (
            <div className="mt-6 border-t border-gray-100 pt-6">
              <h2 className="font-semibold text-gray-900">รายละเอียด</h2>
              <p className="mt-2 whitespace-pre-wrap text-gray-600">
                {String(request.description)}
              </p>
            </div>
          )}

          <div className="mt-8">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              ข้อเสนอ ({offerList.length})
            </h2>
            <div className="space-y-4">
              {(offerList as Record<string, unknown>[]).map((offer) => (
                <OfferCard
                  key={String(offer.id)}
                  id={String(offer.id)}
                  productPrice={Number(offer.productPrice)}
                  shippingFee={Number(offer.shippingFee)}
                  notes={offer.notes as string | undefined}
                  status={offer.status as string | undefined}
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
