import Link from 'next/link';

interface OrdersListProps {
  orders: Array<Record<string, unknown>>;
}

const statusLabels: Record<string, string> = {
  CREATED: 'สร้างคำสั่งซื้อ',
  ESCROW_PENDING: 'รอชำระเงิน',
  PAID: 'ชำระเงินแล้ว',
  PURCHASING: 'กำลังซื้อสินค้า',
  SHIPPED: 'จัดส่งแล้ว',
  DELIVERED: 'ได้รับสินค้า',
  COMPLETED: 'เสร็จสิ้น',
  CANCELLED: 'ยกเลิก',
  REFUNDED: 'คืนเงินแล้ว',
};

export function OrdersList({ orders }: OrdersListProps) {
  if (orders.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 py-16 text-center">
        <p className="text-gray-500">คุณยังไม่มีคำสั่งซื้อ</p>
        <Link
          href="/"
          className="mt-2 inline-block text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          ไปช้อปปิ้ง
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <Link
          key={String(order.id)}
          href={`/orders/${order.id}`}
          className="block rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-primary-200 hover:shadow-md"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-gray-900">
                คำสั่งซื้อ #{String(order.id).slice(0, 8)}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                สร้างเมื่อ{' '}
                {order.createdAt
                  ? new Date(order.createdAt as string).toLocaleDateString('th-TH')
                  : '-'}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-sm font-medium ${
                (order.status as string) === 'COMPLETED'
                  ? 'bg-green-100 text-green-800'
                  : (order.status as string) === 'CANCELLED' ||
                      (order.status as string) === 'REFUNDED'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-amber-100 text-amber-800'
              }`}
            >
              {statusLabels[order.status as string] || (order.status as string)}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
