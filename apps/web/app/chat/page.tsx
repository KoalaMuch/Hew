'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import { getChatRooms, createChatRoom } from '@/lib/api';
import { useSession } from '@/lib/session-context';

interface ChatRoomWithMessages {
  id: string;
  participants: string[];
  createdAt: string;
  updatedAt: string;
  messages?: Array<{
    id: string;
    content: string;
    createdAt: string;
    sender?: { displayName: string };
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
              const last = lastMessage(room);
              return (
                <Link
                  key={room.id}
                  href={`/chat/${room.id}`}
                  className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-colors hover:border-primary-200 hover:bg-gray-50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100">
                    <MessageCircle size={20} className="text-primary-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      ห้องแชท
                    </p>
                    <p className="truncate text-xs text-gray-400">
                      {last
                        ? last.content || new Date(room.updatedAt).toLocaleDateString('th-TH')
                        : new Date(room.updatedAt).toLocaleDateString('th-TH')}
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
