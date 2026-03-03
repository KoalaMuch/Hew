import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTripById, getOffers } from '@/lib/api';
import { ChatButton } from './chat-button';
import type { TripDto, OfferDto } from '@hew/shared';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const trip = await getTripById(id);
    if (!trip) return {};
    const location = [trip.city, trip.country].filter(Boolean).join(', ');
    const title = `ทริป ${location} | Rubhew`;
    const description = trip.description
      ? trip.description.slice(0, 160)
      : `ทริปไป ${location}`;
    return {
      title,
      description,
      openGraph: { title, description, locale: 'th_TH', type: 'article' },
      twitter: { card: 'summary', title, description },
    };
  } catch {
    return {};
  }
}

export default async function TripDetailPage({ params }: PageProps) {
  const { id } = await params;

  let trip: TripDto | null = null;
  let offers: OfferDto[] = [];

  try {
    const [tripData, offersData] = await Promise.all([
      getTripById(id),
      getOffers({ tripId: id }).catch(() => [] as OfferDto[]),
    ]);
    trip = tripData;
    offers = Array.isArray(offersData) ? offersData : [];
  } catch {
    notFound();
  }

  if (!trip) {
    notFound();
  }

  const pendingOffers = offers.filter((o) => o.status === 'PENDING');

  const dateRange =
    trip.departureDate && trip.returnDate
      ? `${new Date(trip.departureDate).toLocaleDateString('th-TH')} - ${new Date(trip.returnDate).toLocaleDateString('th-TH')}`
      : trip.departureDate
        ? `ออกเดินทาง ${new Date(trip.departureDate).toLocaleDateString('th-TH')}`
        : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/trips"
        className="mb-6 inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
      >
        ← กลับไปทริป
      </Link>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {trip.country}
              {trip.city ? ` · ${trip.city}` : null}
            </h1>
            {dateRange && (
              <p className="mt-2 text-gray-600">{dateRange}</p>
            )}
            {trip.status && (
              <span
                className={`mt-2 inline-block rounded-full px-3 py-1 text-sm font-medium ${
                  trip.status === 'ACTIVE'
                    ? 'bg-green-100 text-green-800'
                    : trip.status === 'COMPLETED'
                      ? 'bg-gray-100 text-gray-700'
                      : 'bg-red-100 text-red-800'
                }`}
              >
                {trip.status}
              </span>
            )}
          </div>
        </div>

        {trip.description && (
          <div className="mt-6 border-t border-gray-100 pt-6">
            <h2 className="font-semibold text-gray-900">รายละเอียด</h2>
            <p className="mt-2 whitespace-pre-wrap text-gray-600">
              {trip.description}
            </p>
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-4">
          <ChatButton tripId={id} ownerSessionId={trip.sessionId} />
        </div>
      </div>

      {pendingOffers.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            ข้อเสนอ ({pendingOffers.length})
          </h2>
          <div className="space-y-4">
            {pendingOffers.map((offer) => (
              <div
                key={offer.id}
                className="rounded-xl border border-gray-200 bg-white p-4"
              >
                <p className="font-medium">
                  ฿{(offer.productPrice + offer.shippingFee).toLocaleString()}
                </p>
                {offer.notes ? (
                  <p className="mt-1 text-sm text-gray-600">{offer.notes}</p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
