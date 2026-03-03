import type {
  TripDto,
  ItemRequestDto,
  OfferDto,
  OrderDto,
  PostDto,
  CommentDto,
  ChatRoomDto,
  ChatMessageDto,
  PaginatedResponse,
  ProfileDto,
  PublicProfileDto,
} from '@hew/shared';

const DEV_API_URL = 'http://localhost:3000/api';

function getApiBase(): string {
  // Server-side: read from runtime env
  if (typeof window === 'undefined') {
    return process.env.API_URL || DEV_API_URL;
  }
  // Client-side: read from runtime-injected window.__ENV
  const runtimeUrl = (window as unknown as { __ENV?: { API_URL?: string } }).__ENV?.API_URL;
  return runtimeUrl || DEV_API_URL;
}

let sessionToken: string | null = null;

export function setSessionToken(token: string | null) {
  sessionToken = token;
}

function buildQueryString(params?: Record<string, string | number | undefined | null>): string {
  if (!params) return '';
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

async function fetchApi<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = path.startsWith('http') ? path : `${getApiBase()}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (sessionToken) {
    headers['X-Session-Id'] = sessionToken;
  }

  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error((err as { message?: string }).message || res.statusText);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// Trips
export async function getTrips(params?: {
  country?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  return fetchApi<PaginatedResponse<TripDto>>(`/trips${buildQueryString(params)}`);
}

export async function getTripById(id: string) {
  return fetchApi<TripDto>(`/trips/${id}`);
}

export async function createTrip(data: {
  country: string;
  city?: string;
  departureDate?: string;
  returnDate?: string;
  description?: string;
}) {
  return fetchApi<TripDto>('/trips', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Item requests
export async function getItemRequests(params?: {
  country?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  return fetchApi<PaginatedResponse<ItemRequestDto>>(`/item-requests${buildQueryString(params)}`);
}

export async function getItemRequestById(id: string) {
  return fetchApi<ItemRequestDto>(`/item-requests/${id}`);
}

export async function createItemRequest(data: {
  title: string;
  description?: string;
  imageUrls?: string[];
  countries: string[];
  maxBudget?: number;
}) {
  return fetchApi<ItemRequestDto>('/item-requests', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Offers
export async function getOffers(params: {
  itemRequestId?: string;
  tripId?: string;
}) {
  const qs = buildQueryString(params);
  if (!qs) throw new Error('Either itemRequestId or tripId is required');
  return fetchApi<OfferDto[]>(`/offers${qs}`);
}

export async function createOffer(data: {
  tripId?: string;
  itemRequestId?: string;
  productPrice: number;
  shippingFee: number;
  notes?: string;
}) {
  return fetchApi<OfferDto>('/offers', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function acceptOffer(id: string) {
  return fetchApi<OfferDto>(`/offers/${id}/accept`, {
    method: 'PATCH',
  });
}

// Orders
export async function getOrders(role?: 'buyer' | 'traveler') {
  return fetchApi<OrderDto[]>(`/orders${buildQueryString({ role })}`);
}

export async function getOrderById(id: string) {
  return fetchApi<OrderDto>(`/orders/${id}`);
}

export async function chargePayment(data: {
  orderId: string;
  phone?: string;
  email?: string;
  paymentMethod: 'promptpay' | 'credit_card';
}) {
  return fetchApi<{ chargeId: string }>('/payments/charge', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function createOrderFromChat(data: {
  roomId: string;
  orderName: string;
  orderImageUrl?: string;
  productPrice: number;
  shippingFee: number;
}) {
  return fetchApi<OrderDto>('/orders/from-chat', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function cancelOrder(orderId: string) {
  return fetchApi<OrderDto>(`/orders/${orderId}/cancel`, {
    method: 'PATCH',
  });
}

export async function shipOrder(
  orderId: string,
  data: {
    trackingNumber?: string;
    carrier?: string;
    proofImageUrls: string[];
    bankAccount: { bankName: string; accountNumber: string; accountName: string };
  }
) {
  return fetchApi<OrderDto>(`/orders/${orderId}/ship`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function updateOrderShipping(
  orderId: string,
  data: { trackingNumber?: string; carrier?: string }
) {
  return fetchApi<{ trackingNumber: string | null; carrier: string | null }>(
    `/orders/${orderId}/shipment`,
    { method: 'PATCH', body: JSON.stringify(data) }
  );
}

export async function confirmDelivery(orderId: string) {
  return fetchApi<OrderDto>(`/orders/${orderId}/deliver`, {
    method: 'PATCH',
  });
}

// Chat
export async function getChatRooms() {
  return fetchApi<ChatRoomDto[]>('/chat/rooms');
}

export async function getChatMessages(
  roomId: string,
  params?: { before?: string; page?: number; limit?: number }
) {
  return fetchApi<ChatMessageDto[]>(`/chat/rooms/${roomId}/messages${buildQueryString(params)}`);
}

export async function createChatRoom(data: {
  tripId?: string;
  itemRequestId?: string;
  participantSessionId: string;
}) {
  return fetchApi<ChatRoomDto>('/chat/rooms', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Posts
export async function getPosts(params?: {
  type?: string;
  hashtag?: string;
  search?: string;
  country?: string;
  sessionId?: string;
  page?: number;
  limit?: number;
}) {
  return fetchApi<PaginatedResponse<PostDto>>(`/posts${buildQueryString(params)}`);
}

export async function getPostById(id: string) {
  return fetchApi<PostDto>(`/posts/${id}`);
}

export async function getMyPosts(params?: { page?: number; limit?: number }) {
  return fetchApi<PaginatedResponse<PostDto>>(`/posts/mine${buildQueryString(params)}`);
}

export async function createPost(data: {
  type: 'RUBHEW' | 'HAKHONG';
  content: string;
  imageUrls?: string[];
  country?: string;
  city?: string;
  travelDate?: string;
  budget?: number;
}) {
  return fetchApi<PostDto>('/posts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updatePost(
  id: string,
  data: {
    content?: string;
    imageUrls?: string[];
    country?: string;
    city?: string;
    travelDate?: string;
    budget?: number;
  }
) {
  return fetchApi<PostDto>(`/posts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deletePost(id: string) {
  return fetchApi<void>(`/posts/${id}`, { method: 'DELETE' });
}

export async function getTrendingHashtags(limit?: number) {
  return fetchApi<Array<{ id: string; name: string; count: number }>>(
    `/posts/hashtags/trending${buildQueryString({ limit })}`
  );
}

export async function searchHashtags(q: string, limit?: number) {
  return fetchApi<Array<{ id: string; name: string; count: number }>>(
    `/posts/hashtags/search${buildQueryString({ q, limit })}`
  );
}

// Comments
export async function getComments(postId: string, params?: { page?: number; limit?: number }) {
  return fetchApi<PaginatedResponse<CommentDto>>(
    `/posts/${postId}/comments${buildQueryString(params)}`
  );
}

export async function createComment(postId: string, data: { content: string }) {
  return fetchApi<CommentDto>(`/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateComment(postId: string, commentId: string, data: { content: string }) {
  return fetchApi<CommentDto>(`/posts/${postId}/comments/${commentId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteComment(postId: string, commentId: string) {
  return fetchApi<void>(`/posts/${postId}/comments/${commentId}`, {
    method: 'DELETE',
  });
}

// Session
export async function getSession() {
  return fetchApi<{ id: string; displayName?: string; avatarSeed?: string; avatarUrl?: string | null } | null>(
    '/sessions/me'
  );
}

export async function createSession(fingerprint?: string) {
  return fetchApi<{ id: string }>('/sessions', {
    method: 'POST',
    body: JSON.stringify({ fingerprint }),
  });
}

export async function updateSession(data: {
  displayName?: string;
  avatarSeed?: string;
  avatarUrl?: string | null;
}) {
  return fetchApi<{ id: string }>('/sessions/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function uploadImage(file: File, folder?: 'avatars' | 'posts') {
  const formData = new FormData();
  formData.append('file', file);
  if (folder) formData.append('folder', folder);
  const url = `${getApiBase()}/upload`;
  const headers: Record<string, string> = {};
  if (sessionToken) {
    headers['X-Session-Id'] = sessionToken;
  }
  const res = await fetch(url, {
    method: 'POST',
    body: formData,
    credentials: 'include',
    headers,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error((err as { message?: string }).message || res.statusText);
  }
  return res.json() as Promise<{ url: string }>;
}

// Auth
export async function register(data: {
  email: string;
  password: string;
  displayName: string;
}) {
  return fetchApi<{ id: string; email: string; displayName: string }>(
    '/auth/register',
    { method: 'POST', body: JSON.stringify(data) }
  );
}

export async function login(data: { email: string; password: string }) {
  return fetchApi<{ id: string; email: string; displayName: string }>(
    '/auth/login',
    { method: 'POST', body: JSON.stringify(data) }
  );
}

export async function getProfile() {
  return fetchApi<ProfileDto>('/auth/profile');
}

export async function getPublicProfile(sessionId: string) {
  return fetchApi<PublicProfileDto>(`/users/${sessionId}/profile`);
}

export async function getReviewsForSession(sessionId: string) {
  return fetchApi<
    Array<{
      id: string;
      rating: number;
      comment: string | null;
      createdAt: string;
      reviewerSession: { displayName: string; avatarSeed: string };
    }>
  >(`/reviews${buildQueryString({ sessionId })}`);
}

export async function logout() {
  return fetchApi<void>('/auth/logout', { method: 'POST' });
}

export function getOAuthUrl(provider: 'google' | 'line' | 'facebook' | 'apple') {
  return `${getApiBase()}/auth/${provider}?session=${sessionToken || ''}`;
}
