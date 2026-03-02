import { Suspense } from 'react';
import Link from 'next/link';
import { getTrips } from '@/lib/api';
import { TripCard } from '@/components/trip-card';
import { TripsFilters } from './trips-filters';

interface PageProps {
  searchParams: Promise<{ country?: string; status?: string; page?: string }>;
}

async function TripsList({
  country,
  status,
  page,
}: {
  country?: string;
  status?: string;
  page?: string;
}) {
  let data: { data: unknown[]; total: number } = {
    data: [],
    total: 0,
  };

  try {
    data = await getTrips({
      country,
      status,
      page: page ? parseInt(page, 10) : undefined,
      limit: 12,
    });
  } catch {
    // Use empty on error
  }

  const trips = (data.data || []) as Array<Record<string, unknown>>;

  return (
    <>
      {trips.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => (
            <TripCard
              key={String(trip.id)}
              id={String(trip.id)}
              country={String(trip.country)}
              city={trip.city as string | undefined}
              departureDate={trip.departureDate as string | undefined}
              returnDate={trip.returnDate as string | undefined}
              description={trip.description as string | undefined}
              status={trip.status as string | undefined}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 py-16 text-center">
          <p className="text-gray-500">ไม่พบทริปที่ตรงกับเงื่อนไข</p>
          <Link
            href="/trips"
            className="mt-2 inline-block text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            ล้างตัวกรอง
          </Link>
        </div>
      )}
    </>
  );
}

export default async function TripsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { country, status, page } = params;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">ทริป</h1>
        <p className="mt-1 text-gray-600">
          ค้นหาทริปของนักเดินทางที่พร้อมหิ้วของให้คุณ
        </p>
      </div>

      <TripsFilters country={country} status={status} />

      <Suspense
        fallback={
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-xl bg-gray-200"
              />
            ))}
          </div>
        }
      >
        <div className="mt-6">
          <TripsList country={country} status={status} page={page} />
        </div>
      </Suspense>
    </div>
  );
}
