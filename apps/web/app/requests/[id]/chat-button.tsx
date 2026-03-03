'use client';

import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/session-context';
import { createChatRoom } from '@/lib/api';

interface ChatButtonProps {
  itemRequestId: string;
  ownerSessionId: string;
}

export function ChatButton({ itemRequestId, ownerSessionId }: ChatButtonProps) {
  const router = useRouter();
  const { sessionId, isLoading } = useSession();

  const handleChat = async () => {
    if (!sessionId) return;
    if (sessionId === ownerSessionId) return;
    try {
      const room = await createChatRoom({
        participantSessionId: ownerSessionId,
        itemRequestId,
      });
      router.push(`/chat/${room.id}`);
    } catch {
      router.push(`/chat?itemRequest=${itemRequestId}&participant=${ownerSessionId}`);
    }
  };

  if (isLoading) {
    return (
      <div className="h-10 w-32 animate-pulse rounded-lg bg-gray-200" />
    );
  }

  if (sessionId === ownerSessionId) {
    return null;
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
