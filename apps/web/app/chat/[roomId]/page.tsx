'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { ArrowLeft, Package, Send } from 'lucide-react';
import { getChatMessages, markChatRoomAsRead } from '@/lib/api';
import { useSession } from '@/lib/session-context';
import { Avatar } from '@/components/avatar';
import { OrderCard } from '@/components/order-card';
import { CreateOrderModal } from '@/components/create-order-modal';
import { PaymentModal } from '@/components/payment-modal';
import { setSessionToken } from '@/lib/api';
import { useUnreadCount } from '@/hooks/use-unread-count';

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
  sender?: { displayName: string; avatarSeed: string; avatarUrl?: string | null };
}

export default function ChatRoomPage() {
  const params = useParams();
  const roomId = params?.roomId as string;
  const { sessionId } = useSession();
  const { refresh: refreshUnreadCount } = useUnreadCount();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<{
    orderId: string;
    orderName: string | null;
    orderImageUrl: string | null;
    totalAmount: number;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const hasOrderInChat = messages.some((m) => m.type === 'ORDER_CARD');

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
        // Mark messages as read after loading (backend also does this, but this ensures it happens)
        await markChatRoomAsRead(roomId).catch(() => {
          // Ignore errors, backend handles it
        });
        refreshUnreadCount();
      } catch {
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [roomId, sessionId, refreshUnreadCount]);

  useEffect(() => {
    if (!roomId || !sessionId) return;

    const token = sessionId;
    setSessionToken(token);

    const url = getSocketUrl();
    if (!url) return;

    let isLoadingMessages = false;

    const loadMessages = async () => {
      if (isLoadingMessages) return;
      isLoadingMessages = true;
      try {
        const data = await getChatMessages(roomId, { limit: 100 });
        setMessages((prev) => {
          // Deduplicate: merge new messages with existing ones by id
          const existingIds = new Set(prev.map((m) => m.id));
          const newMessages = (data as Message[]).filter((m) => !existingIds.has(m.id));
          // Combine and sort by createdAt
          const combined = [...prev, ...newMessages].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          );
          return combined;
        });
        await markChatRoomAsRead(roomId).catch(() => {
          // Ignore errors
        });
        refreshUnreadCount();
      } catch {
        // Keep existing messages on error
      } finally {
        isLoadingMessages = false;
      }
    };

    const socketInstance = io(`${url}/chat`, {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      setConnected(true);
      socketInstance.emit('join_room', { roomId });
      // Reload messages on connect to catch any missed messages
      loadMessages();
    });

    socketInstance.on('reconnect', () => {
      setConnected(true);
      socketInstance.emit('join_room', { roomId });
      // Reload messages on reconnect
      loadMessages();
    });

    socketInstance.on('disconnect', () => {
      setConnected(false);
    });

    socketInstance.on('message', async (msg: Message) => {
      setMessages((prev) => {
        // Deduplicate by message id
        if (prev.some((m) => m.id === msg.id)) {
          return prev;
        }
        return [...prev, msg];
      });
      // Mark as read if message is from other user and user is viewing the chat
      if (msg.senderId !== sessionId) {
        await markChatRoomAsRead(roomId).catch(() => {
          // Ignore errors
        });
        refreshUnreadCount();
      }
    });

    setSocket(socketInstance);

    // Handle page visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // User returned to the tab, reload messages if socket is connected
        if (socketInstance.connected) {
          loadMessages();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      socketInstance.disconnect();
      setSocket(null);
    };
  }, [roomId, sessionId, refreshUnreadCount]);

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
    <div className="fixed inset-0 top-14 bottom-14 flex flex-col md:relative md:top-auto md:bottom-auto md:h-[calc(100dvh-8rem)] md:px-4 md:pb-8 md:pt-6">
      {showCreateOrder && (
        <CreateOrderModal
          roomId={roomId}
          onClose={() => setShowCreateOrder(false)}
          onSuccess={() => {
            setShowCreateOrder(false);
            // Reload messages to show the new order card
            getChatMessages(roomId, { limit: 100 })
              .then((data) => setMessages(data as Message[]))
              .catch(() => {});
          }}
        />
      )}
      {showPaymentModal && selectedOrder && (
        <PaymentModal
          orderId={selectedOrder.orderId}
          orderName={selectedOrder.orderName}
          orderImageUrl={selectedOrder.orderImageUrl}
          totalAmount={selectedOrder.totalAmount}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedOrder(null);
          }}
          onSuccess={() => {
            setShowPaymentModal(false);
            setSelectedOrder(null);
            // Reload messages to show updated order status
            getChatMessages(roomId, { limit: 100 })
              .then((data) => setMessages(data as Message[]))
              .catch(() => {});
          }}
        />
      )}
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-gray-100 bg-white px-4 py-3 md:mb-4 md:border-0 md:px-0">
        <div className="flex items-center gap-4">
          <Link
            href="/chat"
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft size={18} />
            <span className="hidden md:inline">กลับ</span>
          </Link>
          <h1 className="text-lg font-semibold text-gray-900">แชท</h1>
          {!connected && (
            <span className="text-xs text-amber-600">กำลังเชื่อมต่อ...</span>
          )}
        </div>
        {!hasOrderInChat && (
          <button
            type="button"
            onClick={() => setShowCreateOrder(true)}
            className="flex items-center gap-1.5 rounded-xl border border-primary-200 bg-primary-50 px-3 py-2 text-sm font-medium text-primary-700 hover:bg-primary-100"
          >
            <Package size={18} />
            <span className="hidden md:inline">สร้างออเดอร์</span>
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm md:mx-4">
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
                  if (msg.type === 'ORDER_CARD') {
                    try {
                      const data = JSON.parse(msg.content) as {
                        orderId: string;
                        orderName: string | null;
                        orderImageUrl: string | null;
                        totalAmount: number;
                        status: string;
                        buyerSessionId?: string;
                        trackingNumber?: string | null;
                        carrier?: string | null;
                      };
                      const isBuyer = data.buyerSessionId === sessionId;
                      return (
                        <div
                          key={msg.id}
                          className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
                        >
                          <Avatar
                            src={msg.sender?.avatarUrl}
                            displayName={msg.sender?.displayName}
                            avatarSeed={msg.sender?.avatarSeed}
                            size="sm"
                            className={isOwn ? 'bg-primary-600' : ''}
                          />
                          <div className="max-w-[85%]">
                            {!isOwn && (
                              <p className="mb-1 text-xs font-medium text-gray-500">
                                {msg.sender?.displayName || 'Anonymous'}
                              </p>
                            )}
                            <OrderCard
                              data={data}
                              isOwn={isOwn}
                              isBuyer={isBuyer}
                              onPay={() => {
                                setSelectedOrder({
                                  orderId: data.orderId,
                                  orderName: data.orderName,
                                  orderImageUrl: data.orderImageUrl,
                                  totalAmount: data.totalAmount,
                                });
                                setShowPaymentModal(true);
                              }}
                            />
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
                    } catch {
                      return null;
                    }
                  }
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
                    >
                      <Avatar
                        src={msg.sender?.avatarUrl}
                        displayName={msg.sender?.displayName}
                        avatarSeed={msg.sender?.avatarSeed}
                        size="sm"
                        className={isOwn ? 'bg-primary-600' : ''}
                      />
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
          className="flex shrink-0 gap-2 border-t border-gray-100 bg-white p-4"
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
