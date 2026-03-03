'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { ArrowLeft, Send } from 'lucide-react';
import { getChatMessages } from '@/lib/api';
import { useSession } from '@/lib/session-context';
import { getAvatarInitial } from '@/lib/utils';
import { setSessionToken } from '@/lib/api';

function getSocketUrl(): string {
  if (typeof window === 'undefined') return '';
  const env = (window as unknown as { __ENV?: { API_URL?: string } }).__ENV;
  const apiUrl = env?.API_URL || 'http://localhost:3000/api';
  return apiUrl.replace(/\/api\/?$/, '');
}

interface Message {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  imageUrl?: string | null;
  type: string;
  createdAt: string;
  sender?: { displayName: string; avatarSeed: string };
}

export default function ChatRoomPage() {
  const params = useParams();
  const roomId = params?.roomId as string;
  const { sessionId } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (!roomId || !sessionId) return;

    const loadMessages = async () => {
      try {
        const data = await getChatMessages(roomId, { limit: 100 });
        setMessages(data as Message[]);
      } catch {
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [roomId, sessionId]);

  useEffect(() => {
    if (!roomId || !sessionId) return;

    const token = sessionId;
    setSessionToken(token);

    const url = getSocketUrl();
    if (!url) return;

    const socketInstance = io(`${url}/chat`, {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      setConnected(true);
      socketInstance.emit('join_room', { roomId });
    });

    socketInstance.on('disconnect', () => {
      setConnected(false);
    });

    socketInstance.on('message', (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
      setSocket(null);
    };
  }, [roomId, sessionId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !socket || !connected || sending) return;

    const text = content.trim();
    setContent('');
    setSending(true);

    try {
      socket.emit('send_message', {
        roomId,
        content: text,
        type: 'TEXT',
      });
    } catch {
      // error
    } finally {
      setSending(false);
    }
  };

  if (!roomId) {
    return (
      <div className="mx-auto max-w-2xl px-4 pb-24 pt-6 md:pb-8">
        <p className="text-gray-500">ไม่พบห้องแชท</p>
        <Link href="/chat" className="mt-4 text-primary-600 hover:underline">
          ← กลับไปรายการแชท
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-8rem)] flex-col px-4 pb-24 pt-6 md:pb-8">
      <div className="mb-4 flex items-center gap-4">
        <Link
          href="/chat"
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft size={18} />
          กลับ
        </Link>
        <h1 className="text-lg font-semibold text-gray-900">แชท</h1>
        {!connected && (
          <span className="text-xs text-amber-600">กำลังเชื่อมต่อ...</span>
        )}
      </div>

      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
          </div>
        ) : (
          <div className="flex flex-1 flex-col overflow-y-auto p-4">
            {messages.length === 0 ? (
              <div className="flex flex-1 items-center justify-center text-sm text-gray-500">
                ยังไม่มีข้อความ ส่งข้อความแรกเลย!
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => {
                  const isOwn = msg.senderId === sessionId;
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                          isOwn
                            ? 'bg-primary-600'
                            : 'bg-gradient-to-br from-primary-400 to-primary-600'
                        }`}
                      >
                        {getAvatarInitial(
                          msg.sender?.displayName,
                          msg.sender?.avatarSeed
                        )}
                      </div>
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                          isOwn
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        {!isOwn && (
                          <p className="mb-1 text-xs font-medium text-gray-500">
                            {msg.sender?.displayName || 'Anonymous'}
                          </p>
                        )}
                        <p className="whitespace-pre-wrap break-words text-sm">
                          {msg.content}
                        </p>
                        <p
                          className={`mt-1 text-xs ${
                            isOwn ? 'text-primary-100' : 'text-gray-400'
                          }`}
                        >
                          {new Date(msg.createdAt).toLocaleTimeString('th-TH', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        <form
          onSubmit={handleSend}
          className="flex gap-2 border-t border-gray-100 p-4"
        >
          <textarea
            ref={inputRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
            placeholder="พิมพ์ข้อความ..."
            rows={1}
            className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-primary-400"
            maxLength={5000}
            disabled={!connected}
          />
          <button
            type="submit"
            disabled={!content.trim() || !connected || sending}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
