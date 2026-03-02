'use client';

import { useEffect, useState } from 'react';
import { getOrders } from '@/lib/api';
import { OrdersList } from './orders-list';
import type { OrderDto } from '@hew/shared';

export function OrdersPageClient() {
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrders()
      .then((data) =>
        setOrders(Array.isArray(data) ? data : [])
      )
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-xl bg-gray-200"
          />
        ))}
      </div>
    );
  }

  return <OrdersList orders={orders} />;
}
