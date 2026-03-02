'use client';

import { useEffect, useState } from 'react';
import { getOrders } from '@/lib/api';
import { OrdersList } from './orders-list';

export function OrdersPageClient() {
  const [orders, setOrders] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrders()
      .then((data) =>
        setOrders(Array.isArray(data) ? (data as Record<string, unknown>[]) : [])
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
