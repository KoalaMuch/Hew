'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getOrderById } from '@/lib/api';
import { OrderStatus } from '@/components/order-status';

interface OrderDetailClientProps {
  orderId: string;
}

export function OrderDetailClient({ orderId }: OrderDetailClientProps) {
  const router = useRouter();
  const [order, setOrder] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrderById(orderId)
      .then((data) => setOrder(data as Record<string, unknown>))
      .catch(() => router.replace('/orders'))
      .finally(() => setLoading(false));
  }, [orderId, router]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="mt-4 h-4 w-32 animate-pulse rounded bg-gray-200" />
        <div className="mt-8 h-40 animate-pulse rounded bg-gray-200" />
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const status = order.status as string;
  const totalAmount = order.totalAmount ? Number(order.totalAmount) : 0;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          คำสั่งซื้อ #{String(order.id).slice(0, 8)}
        </h1>
        <p className="mt-2 text-gray-600">
          สร้างเมื่อ{' '}
          {order.createdAt
            ? new Date(order.createdAt as string).toLocaleDateString('th-TH', {
                dateStyle: 'long',
              })
            : '-'}
        </p>
      </div>

      <div className="mb-8 rounded-lg bg-gray-50 p-4">
        <p className="text-sm text-gray-500">ยอดรวม</p>
        <p className="text-xl font-bold text-gray-900">
          ฿{totalAmount.toLocaleString()}
        </p>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          สถานะคำสั่งซื้อ
        </h2>
        <OrderStatus status={status} />
      </div>
    </div>
  );
}
