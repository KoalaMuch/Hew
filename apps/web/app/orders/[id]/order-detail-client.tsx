'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getOrderById, cancelOrder } from '@/lib/api';
import { OrderStatus } from '@/components/order-status';
import type { OrderDto } from '@hew/shared';

const CANCELLABLE_STATUSES = ['CREATED', 'ESCROW_PENDING'];

interface OrderDetailClientProps {
  orderId: string;
}

export function OrderDetailClient({ orderId }: OrderDetailClientProps) {
  const router = useRouter();
  const [order, setOrder] = useState<OrderDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const refreshOrder = () => {
    getOrderById(orderId)
      .then((data) => setOrder(data))
      .catch(() => router.replace('/orders'));
  };

  useEffect(() => {
    getOrderById(orderId)
      .then((data) => setOrder(data))
      .catch(() => router.replace('/orders'))
      .finally(() => setLoading(false));
  }, [orderId, router]);

  const handleCancel = async () => {
    if (!order || !confirm('ต้องการยกเลิกออเดอร์นี้หรือไม่?')) return;
    setCancelling(true);
    try {
      await cancelOrder(orderId);
      refreshOrder();
    } finally {
      setCancelling(false);
    }
  };

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

  const status = order.status;
  const totalAmount = order.totalAmount ? Number(order.totalAmount) : 0;
  const isChatOrder = !!order.orderName || !!order.roomId;
  const canCancel = CANCELLABLE_STATUSES.includes(status);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {isChatOrder && order.orderName
            ? order.orderName
            : `คำสั่งซื้อ #${order.id.slice(0, 8)}`}
        </h1>
        {isChatOrder && order.orderImageUrl && (
          <img
            src={order.orderImageUrl}
            alt={order.orderName || 'Order'}
            className="mt-3 h-32 w-32 rounded-xl object-cover"
          />
        )}
        <p className="mt-2 text-gray-600">
          สร้างเมื่อ{' '}
          {order.createdAt
            ? new Date(order.createdAt).toLocaleDateString('th-TH', {
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

      {canCancel && (
        <div className="mt-8 flex gap-3">
          <button
            type="button"
            onClick={handleCancel}
            disabled={cancelling}
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
          >
            {cancelling ? 'กำลังยกเลิก...' : 'ยกเลิกออเดอร์'}
          </button>
          {order.roomId && (
            <Link
              href={`/chat/${order.roomId}`}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              กลับไปแชท
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
