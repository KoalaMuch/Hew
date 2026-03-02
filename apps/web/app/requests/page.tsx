import { Suspense } from 'react';
import Link from 'next/link';
import { getItemRequests } from '@/lib/api';
import { RequestCard } from '@/components/request-card';
import { RequestsFilters } from './requests-filters';

interface PageProps {
  searchParams: Promise<{ country?: string; status?: string; page?: string }>;
}

async function RequestsList({
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
    data = await getItemRequests({
      country,
      status,
      page: page ? parseInt(page, 10) : undefined,
      limit: 12,
    });
  } catch {
    // Use empty on error
  }

  const requests = (data.data || []) as Record<string, unknown>[];

  return (
    <>
      {requests.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {requests.map((req) => (
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
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 py-16 text-center">
          <p className="text-gray-500">ไม่พบคำขอที่ตรงกับเงื่อนไข</p>
          <Link
            href="/requests"
            className="mt-2 inline-block text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            ล้างตัวกรอง
          </Link>
        </div>
      )}
    </>
  );
}

export default async function RequestsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { country, status, page } = params;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">ขอของ</h1>
        <p className="mt-1 text-gray-600">
          ประกาศว่าคุณอยากได้ของอะไร แล้วรอคนหิ้วให้
        </p>
      </div>

      <RequestsFilters country={country} status={status} />

      <Suspense
        fallback={
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-48 animate-pulse rounded-xl bg-gray-200"
              />
            ))}
          </div>
        }
      >
        <div className="mt-6">
          <RequestsList country={country} status={status} page={page} />
        </div>
      </Suspense>
    </div>
  );
}
