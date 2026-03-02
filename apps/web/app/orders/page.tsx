import { OrdersPageClient } from './orders-page-client';

export default function OrdersPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">คำสั่งซื้อของฉัน</h1>
        <p className="mt-1 text-gray-600">
          ติดตามสถานะคำสั่งซื้อทั้งหมดของคุณ
        </p>
      </div>

      <OrdersPageClient />
    </div>
  );
}
