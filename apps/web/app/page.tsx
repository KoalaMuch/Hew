import Link from 'next/link';
import { getTrips, getItemRequests } from '@/lib/api';
import { TripCard } from '@/components/trip-card';
import { RequestCard } from '@/components/request-card';

export default async function HomePage() {
  let trips: Array<Record<string, unknown>> = [];
  let requests: Array<Record<string, unknown>> = [];

  try {
    const [tripsRes, requestsRes] = await Promise.all([
      getTrips({ limit: 6 }),
      getItemRequests({ limit: 6 }),
    ]);
    trips = ((tripsRes as { data?: unknown[] }).data || []) as Array<Record<string, unknown>>;
    requests = ((requestsRes as { data?: unknown[] }).data || []) as Array<Record<string, unknown>>;
  } catch {
    // Use placeholder data on API error
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Hero */}
      <section className="rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 px-6 py-12 text-white sm:px-10 sm:py-16">
        <h1 className="text-2xl font-bold sm:text-3xl md:text-4xl">
          หิ้วของจากต่างประเทศ ง่ายนิดเดียว
        </h1>
        <p className="mt-3 text-primary-100 sm:text-lg">
          Get items from abroad, super easy
        </p>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:gap-6">
          <Link
            href="/trips"
            className="flex items-center justify-center rounded-xl bg-white px-6 py-3 font-semibold text-primary-600 shadow-lg transition hover:bg-primary-50"
          >
            ฉันจะเดินทาง
          </Link>
          <Link
            href="/requests"
            className="flex items-center justify-center rounded-xl border-2 border-white px-6 py-3 font-semibold text-white transition hover:bg-white/10"
          >
            ฉันอยากได้ของ
          </Link>
        </div>
      </section>

      {/* Recent trips */}
      <section className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">ทริปล่าสุด</h2>
          <Link
            href="/trips"
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            ดูทั้งหมด
          </Link>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trips.length > 0 ? (
            trips.map((trip) => (
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
            ))
          ) : (
            <div className="col-span-full rounded-xl border border-dashed border-gray-300 bg-gray-50 py-12 text-center text-gray-500">
              ยังไม่มีทริป — เริ่มต้นด้วยการประกาศทริปของคุณ
            </div>
          )}
        </div>
      </section>

      {/* Recent requests */}
      <section className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">คำขอของล่าสุด</h2>
          <Link
            href="/requests"
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            ดูทั้งหมด
          </Link>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {requests.length > 0 ? (
            requests.map((req) => (
              <RequestCard
                key={String(req.id)}
                id={String(req.id)}
                title={String(req.title)}
                description={req.description as string | undefined}
                imageUrls={req.imageUrls as string[] | undefined}
                countries={(req.countries as string[]) || []}
                maxBudget={req.maxBudget as number | undefined}
                status={req.status as string | undefined}
              />
            ))
          ) : (
            <div className="col-span-full rounded-xl border border-dashed border-gray-300 bg-gray-50 py-12 text-center text-gray-500">
              ยังไม่มีคำขอ — ประกาศว่าคุณอยากได้ของอะไร
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
