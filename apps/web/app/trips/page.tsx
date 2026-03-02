import { getTrips } from '@/lib/api';
import { TripCard } from '@/components/trip-card';
import { ListPageLayout, EmptyListState } from '@/components/list-page-layout';
import { TripsFilters } from './trips-filters';
import type { TripDto } from '@hew/shared';

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
  let trips: TripDto[] = [];

  try {
    const data = await getTrips({
      country,
      status,
      page: page ? parseInt(page, 10) : undefined,
      limit: 12,
    });
    trips = data.data || [];
  } catch {
    // Use empty on error
  }

  if (trips.length === 0) {
    return <EmptyListState message="ไม่พบทริปที่ตรงกับเงื่อนไข" basePath="/trips" />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {trips.map((trip) => (
        <TripCard
          key={trip.id}
          id={trip.id}
          country={trip.country}
          city={trip.city ?? undefined}
          departureDate={trip.departureDate ?? undefined}
          returnDate={trip.returnDate ?? undefined}
          description={trip.description ?? undefined}
          status={trip.status}
        />
      ))}
    </div>
  );
}

export default async function TripsPage({ searchParams }: PageProps) {
  const { country, status, page } = await searchParams;

  return (
    <ListPageLayout
      title="ทริป"
      subtitle="ค้นหาทริปของนักเดินทางที่พร้อมหิ้วของให้คุณ"
      basePath="/trips"
      emptyMessage="ไม่พบทริปที่ตรงกับเงื่อนไข"
      skeletonHeight="h-32"
      filters={<TripsFilters country={country} status={status} />}
    >
      <TripsList country={country} status={status} page={page} />
    </ListPageLayout>
  );
}
