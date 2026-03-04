'use client';

import { useEffect, useState } from 'react';
import { getUnreadCount } from '@/lib/api';
import { useSession } from '@/lib/session-context';

export function useUnreadCount() {
  const { sessionId } = useSession();
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = async () => {
    if (!sessionId) {
      setCount(0);
      setIsLoading(false);
      return;
    }

    try {
      const data = await getUnreadCount();
      setCount(data.count);
    } catch (error) {
      // Keep last known count on error, don't flash to 0
      console.error('Failed to fetch unread count:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!sessionId) {
      setCount(0);
      setIsLoading(false);
      return;
    }

    // Initial fetch
    refresh();

    // Poll every 30 seconds
    const interval = setInterval(refresh, 30000);

    return () => clearInterval(interval);
  }, [sessionId]);

  return { count, isLoading, refresh };
}
