'use client';

import { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { getChatRooms } from '@/lib/api';

interface ChatRoom {
  id: string;
  participants: string[];
  createdAt: string;
  updatedAt: string;
}

export default function ChatPage() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getChatRooms()
      .then((data) => setRooms(data as ChatRoom[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-6 md:pb-8">
      <h1 className="text-xl font-bold text-gray-900">แชท</h1>

      <div className="mt-6">
        {loading ? (
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
            {rooms.map((room) => (
              <div
                key={room.id}
                className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100">
                  <MessageCircle size={20} className="text-primary-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    ห้องแชท
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(room.updatedAt).toLocaleDateString('th-TH')}
                  </p>
                </div>
              </div>
            ))}
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
