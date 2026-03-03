'use client';

import { useRouter } from 'next/navigation';
import { MessageSquare } from 'lucide-react';
import { useSession } from '@/lib/session-context';
import { createChatRoom } from '@/lib/api';

interface ChatButtonProps {
  postAuthorSessionId: string;
}

export function ChatButton({ postAuthorSessionId }: ChatButtonProps) {
  const router = useRouter();
  const { sessionId, isLoading } = useSession();

  const handleChat = async () => {
    if (!sessionId) return;
    if (sessionId === postAuthorSessionId) return;
    try {
      const room = await createChatRoom({
        participantSessionId: postAuthorSessionId,
      });
      router.push(`/chat/${room.id}`);
    } catch {
      router.push(`/chat?participant=${postAuthorSessionId}`);
    }
  };

  if (isLoading) {
    return (
      <div className="h-10 w-32 animate-pulse rounded-lg bg-gray-200" />
    );
  }

  if (sessionId === postAuthorSessionId) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={handleChat}
      className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700"
    >
      <MessageSquare size={18} />
      แชท
    </button>
  );
}
