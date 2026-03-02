import { getItemRequests } from '@/lib/api';
import { RequestCard } from '@/components/request-card';
import { ListPageLayout, EmptyListState } from '@/components/list-page-layout';
import { RequestsFilters } from './requests-filters';
import type { ItemRequestDto } from '@hew/shared';

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
  let requests: ItemRequestDto[] = [];

  try {
    const data = await getItemRequests({
      country,
      status,
      page: page ? parseInt(page, 10) : undefined,
      limit: 12,
    });
    requests = data.data || [];
  } catch {
    // Use empty on error
  }

  if (requests.length === 0) {
    return <EmptyListState message="ไม่พบคำขอที่ตรงกับเงื่อนไข" basePath="/requests" />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {requests.map((req) => (
        <RequestCard
          key={req.id}
          id={req.id}
          title={req.title}
          description={req.description ?? undefined}
          imageUrls={req.imageUrls}
          countries={req.countries}
          maxBudget={req.maxBudget ?? undefined}
          status={req.status}
        />
      ))}
    </div>
  );
}

export default async function RequestsPage({ searchParams }: PageProps) {
  const { country, status, page } = await searchParams;

  return (
    <ListPageLayout
      title="ขอของ"
      subtitle="ประกาศว่าคุณอยากได้ของอะไร แล้วรอคนหิ้วให้"
      basePath="/requests"
      emptyMessage="ไม่พบคำขอที่ตรงกับเงื่อนไข"
      skeletonHeight="h-48"
      filters={<RequestsFilters country={country} status={status} />}
    >
      <RequestsList country={country} status={status} page={page} />
    </ListPageLayout>
  );
}
