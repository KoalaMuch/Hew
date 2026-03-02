'use client';

import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/session-context';

interface ChatButtonProps {
  tripId: string;
}

export function ChatButton({ tripId }: ChatButtonProps) {
  const router = useRouter();
  const { sessionId, isLoading } = useSession();

  const handleChat = () => {
    if (!sessionId) return;
    // TODO: Navigate to chat or open chat modal
    router.push(`/orders?trip=${tripId}`);
  };

  if (isLoading) {
    return (
      <div className="h-10 w-32 animate-pulse rounded-lg bg-gray-200" />
    );
  }

  return (
    <button
      type="button"
      onClick={handleChat}
      className="rounded-lg bg-primary-600 px-6 py-2.5 font-medium text-white hover:bg-primary-700"
    >
      แชท
    </button>
  );
}
