'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import { getChatRooms, createChatRoom } from '@/lib/api';
import { useSession } from '@/lib/session-context';
import { Avatar } from '@/components/avatar';
import type { ChatRoomDto } from '@hew/shared';

interface ChatRoomWithMessages extends Omit<ChatRoomDto, 'messages'> {
  updatedAt: string;
  messages?: Array<{
    id: string;
    roomId: string;
    senderId: string;
    content: string;
    type: string;
    createdAt: string;
    sender?: { id: string; displayName: string; avatarSeed: string; avatarUrl?: string | null };
  }>;
}

export default function ChatPage() {
  const searchParams = useSearchParams();
  const { sessionId } = useSession();
  const [rooms, setRooms] = useState<ChatRoomWithMessages[]>([]);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    const participant = searchParams.get('participant');
    const tripId = searchParams.get('trip');
    const itemRequestId = searchParams.get('itemRequest');

    if (participant && sessionId) {
      setRedirecting(true);
      createChatRoom({
        participantSessionId: participant,
        tripId: tripId || undefined,
        itemRequestId: itemRequestId || undefined,
      })
        .then((room) => {
          window.location.href = `/chat/${room.id}`;
        })
        .catch(() => setRedirecting(false));
      return;
    }

    getChatRooms()
      .then((data) => setRooms(data as ChatRoomWithMessages[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [searchParams, sessionId]);

  const lastMessage = (room: ChatRoomWithMessages) => {
    const msgs = room.messages;
    if (!msgs || msgs.length === 0) return null;
    return msgs[0];
  };

  const getOtherParticipant = (room: ChatRoomWithMessages) => {
    if (!sessionId || !room.participantSessions) return null;
    return room.participantSessions.find((p) => p.id !== sessionId);
  };

  const formatMessagePreview = (room: ChatRoomWithMessages) => {
    const last = lastMessage(room);
    if (!last) {
      return formatRelativeTime(room.updatedAt);
    }

    if (last.type === 'ORDER_CARD') {
      return 'ส่งออเดอร์';
    }

    const senderName = last.sender?.displayName || 'Anonymous';
    const isOwn = last.sender?.id === sessionId;
    const prefix = isOwn ? 'คุณ: ' : `${senderName}: `;
    const content = last.content || '';
    const preview = content.length > 50 ? content.substring(0, 50) + '...' : content;
    return prefix + preview;
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'เมื่อสักครู่';
    if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
    if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
    if (diffDays === 1) return 'เมื่อวาน';
    if (diffDays < 7) return `${diffDays} วันที่แล้ว`;
    return date.toLocaleDateString('th-TH', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-6 md:pb-8">
      <h1 className="text-xl font-bold text-gray-900">แชท</h1>

      <div className="mt-6">
        {redirecting ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
          </div>
        ) : loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-xl bg-gray-200"
              />
            ))}
          </div>
        ) : rooms.length > 0 ? (
          <div className="space-y-2">
            {rooms.map((room) => {
              const otherParticipant = getOtherParticipant(room);
              const displayName = otherParticipant?.displayName || 'Anonymous';
              const avatarSeed = otherParticipant?.avatarSeed || 'anon';
              const avatarUrl = otherParticipant?.avatarUrl;
              const preview = formatMessagePreview(room);

              return (
                <Link
                  key={room.id}
                  href={`/chat/${room.id}`}
                  className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-colors hover:border-primary-200 hover:bg-gray-50"
                >
                  <Avatar
                    src={avatarUrl}
                    displayName={displayName}
                    avatarSeed={avatarSeed}
                    size="md"
                    className="shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {displayName}
                    </p>
                    <p className="truncate text-xs text-gray-400">
                      {preview}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
            <MessageCircle size={40} className="mx-auto text-gray-300" />
            <p className="mt-3 text-gray-500">ยังไม่มีแชท</p>
            <p className="mt-1 text-sm text-gray-400">
              แชทจะปรากฏเมื่อคุณเริ่มสนทนากับผู้ใช้อื่น
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
