import Link from 'next/link';
import { OrderDetailClient } from './order-detail-client';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/orders"
        className="mb-6 inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
      >
        ← กลับไปคำสั่งซื้อ
      </Link>

      <OrderDetailClient orderId={id} />
    </div>
  );
}
