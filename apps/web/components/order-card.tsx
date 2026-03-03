'use client';

import Link from 'next/link';
import { Package, Truck } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  CREATED: 'สร้างแล้ว',
  ESCROW_PENDING: 'รอชำระเงิน',
  PAID: 'ลูกค้าชำระแล้ว',
  PURCHASING: 'กำลังซื้อ',
  SHIPPED: 'จัดส่งแล้ว',
  DELIVERED: 'ได้รับแล้ว',
  PAYOUT_RELEASED: 'โอนเงินแล้ว',
  COMPLETED: 'เสร็จสมบูรณ์',
  CANCELLED: 'ยกเลิก',
  REFUNDED: 'คืนเงินแล้ว',
  DISPUTED: 'มีข้อพิพาท',
};

interface OrderCardData {
  orderId: string;
  orderName: string | null;
  orderImageUrl: string | null;
  totalAmount: number;
  status: string;
  trackingNumber?: string | null;
  carrier?: string | null;
}

interface OrderCardProps {
  data: OrderCardData;
  isOwn: boolean;
  sessionId?: string | null;
}

export function OrderCard({ data, isOwn }: OrderCardProps) {
  const statusLabel = STATUS_LABELS[data.status] ?? data.status;

  return (
    <Link
      href={`/orders/${data.orderId}`}
      className={`block overflow-hidden rounded-2xl border transition-colors ${
        isOwn
          ? 'border-primary-200 bg-primary-50'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <div className="flex gap-3 p-3">
        {data.orderImageUrl ? (
          <img
            src={data.orderImageUrl}
            alt={data.orderName || 'Order'}
            className="h-16 w-16 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gray-100">
            <Package size={24} className="text-gray-400" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-gray-900">
            {data.orderName || 'ไม่มีชื่อ'}
          </p>
          <p className="mt-0.5 text-sm font-semibold text-primary-600">
            ฿{data.totalAmount.toLocaleString('th-TH')}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                data.status === 'COMPLETED'
                  ? 'bg-green-100 text-green-800'
                  : data.status === 'CANCELLED' || data.status === 'REFUNDED'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-amber-100 text-amber-800'
              }`}
            >
              {statusLabel}
            </span>
            {data.trackingNumber && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Truck size={12} />
                {data.carrier ? `${data.carrier}: ` : ''}
                {data.trackingNumber}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
