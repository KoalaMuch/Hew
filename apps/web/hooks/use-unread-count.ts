'use client';

import { useCallback, useEffect, useState } from 'react';
import { getUnreadCount } from '@/lib/api';
import { useSession } from '@/lib/session-context';

export function useUnreadCount() {
  const { sessionId } = useSession();
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!sessionId) {
      setCount(0);
      setIsLoading(false);
      return;
    }

    try {
      const data = await getUnreadCount();
      setCount(data.count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) {
      setCount(0);
      setIsLoading(false);
      return;
    }

    refresh();

    const interval = setInterval(refresh, 30000);

    return () => clearInterval(interval);
  }, [sessionId, refresh]);

  return { count, isLoading, refresh };
}
