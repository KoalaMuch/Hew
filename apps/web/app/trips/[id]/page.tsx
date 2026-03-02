import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTripById, getOffers } from '@/lib/api';
import { ChatButton } from './chat-button';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TripDetailPage({ params }: PageProps) {
  const { id } = await params;

  let trip: Record<string, unknown> | null = null;
  let offers: unknown[] = [];

  try {
    const [tripData, offersData] = await Promise.all([
      getTripById(id),
      getOffers({ tripId: id }).catch(() => []),
    ]);
    trip = tripData as Record<string, unknown> | null;
    offers = Array.isArray(offersData) ? offersData : [];
  } catch {
    notFound();
  }

  if (!trip) {
    notFound();
  }

  const pendingOffers = Array.isArray(offers)
    ? (offers as Record<string, unknown>[]).filter((o) => o.status === 'PENDING')
    : [];

  const dateRange =
    trip.departureDate && trip.returnDate
      ? `${new Date(String(trip.departureDate)).toLocaleDateString('th-TH')} - ${new Date(String(trip.returnDate)).toLocaleDateString('th-TH')}`
      : trip.departureDate
        ? `ออกเดินทาง ${new Date(String(trip.departureDate)).toLocaleDateString('th-TH')}`
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
              {String(trip.country)}
              {typeof trip.city === 'string' && trip.city !== '' ? ` · ${trip.city}` : null}
            </h1>
            {dateRange && (
              <p className="mt-2 text-gray-600">{dateRange}</p>
            )}
            {typeof trip.status === 'string' && (
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

        {typeof trip.description === 'string' && (
          <div className="mt-6 border-t border-gray-100 pt-6">
            <h2 className="font-semibold text-gray-900">รายละเอียด</h2>
            <p className="mt-2 whitespace-pre-wrap text-gray-600">
              {trip.description}
            </p>
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-4">
          <ChatButton tripId={id} />
        </div>
      </div>

      {pendingOffers.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            ข้อเสนอ ({pendingOffers.length})
          </h2>
          <div className="space-y-4">
            {(pendingOffers as Record<string, unknown>[]).map((offer) => (
              <div
                key={String(offer.id)}
                className="rounded-xl border border-gray-200 bg-white p-4"
              >
                <p className="font-medium">
                  ฿
                  {(Number(offer.productPrice) + Number(offer.shippingFee)).toLocaleString()}
                </p>
                {typeof offer.notes === 'string' && offer.notes !== '' ? (
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
