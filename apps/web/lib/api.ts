const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

let sessionToken: string | null = null;

export function setSessionToken(token: string | null) {
  sessionToken = token;
}

async function fetchApi<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
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
  const search = new URLSearchParams();
  if (params?.country) search.set('country', params.country);
  if (params?.status) search.set('status', params.status);
  if (params?.page !== undefined) search.set('page', String(params.page));
  if (params?.limit !== undefined) search.set('limit', String(params.limit));
  const qs = search.toString();
  return fetchApi<{ data: unknown[]; total: number }>(
    `/trips${qs ? `?${qs}` : ''}`
  );
}

export async function getTripById(id: string) {
  return fetchApi<unknown>(`/trips/${id}`);
}

export async function createTrip(data: {
  country: string;
  city?: string;
  departureDate?: string;
  returnDate?: string;
  description?: string;
}) {
  return fetchApi<unknown>('/trips', {
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
  const search = new URLSearchParams();
  if (params?.country) search.set('country', params.country);
  if (params?.status) search.set('status', params.status);
  if (params?.page !== undefined) search.set('page', String(params.page));
  if (params?.limit !== undefined) search.set('limit', String(params.limit));
  const qs = search.toString();
  return fetchApi<{ data: unknown[]; total: number }>(
    `/item-requests${qs ? `?${qs}` : ''}`
  );
}

export async function getItemRequestById(id: string) {
  return fetchApi<unknown>(`/item-requests/${id}`);
}

export async function createItemRequest(data: {
  title: string;
  description?: string;
  imageUrls?: string[];
  countries: string[];
  maxBudget?: number;
}) {
  return fetchApi<unknown>('/item-requests', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Offers
export async function getOffers(params: {
  itemRequestId?: string;
  tripId?: string;
}) {
  const search = new URLSearchParams();
  if (params.itemRequestId) search.set('itemRequestId', params.itemRequestId);
  if (params.tripId) search.set('tripId', params.tripId);
  const qs = search.toString();
  if (!qs) throw new Error('Either itemRequestId or tripId is required');
  return fetchApi<unknown[]>(`/offers?${qs}`);
}

export async function createOffer(data: {
  tripId?: string;
  itemRequestId?: string;
  productPrice: number;
  shippingFee: number;
  notes?: string;
}) {
  return fetchApi<unknown>('/offers', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function acceptOffer(id: string) {
  return fetchApi<unknown>(`/offers/${id}/accept`, {
    method: 'PATCH',
  });
}

// Orders
export async function getOrders(role?: 'buyer' | 'traveler') {
  const qs = role ? `?role=${role}` : '';
  return fetchApi<unknown[]>(`/orders${qs}`);
}

export async function getOrderById(id: string) {
  return fetchApi<unknown>(`/orders/${id}`);
}

export async function chargePayment(data: {
  orderId: string;
  phone?: string;
  email?: string;
  paymentMethod: 'promptpay' | 'credit_card';
}) {
  return fetchApi<unknown>('/payments/charge', {
    method: 'POST',
    body: JSON.stringify(data),
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
  return fetchApi<unknown>(`/orders/${orderId}/ship`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function confirmDelivery(orderId: string) {
  return fetchApi<unknown>(`/orders/${orderId}/deliver`, {
    method: 'PATCH',
  });
}

// Chat
export async function getChatRooms() {
  return fetchApi<unknown[]>('/chat/rooms');
}

export async function getChatMessages(
  roomId: string,
  params?: { before?: string; page?: number; limit?: number }
) {
  const search = new URLSearchParams();
  if (params?.before) search.set('before', params.before);
  if (params?.page !== undefined) search.set('page', String(params.page));
  if (params?.limit !== undefined) search.set('limit', String(params.limit));
  const qs = search.toString();
  return fetchApi<unknown[]>(`/chat/rooms/${roomId}/messages${qs ? `?${qs}` : ''}`);
}

export async function createChatRoom(data: {
  tripId?: string;
  itemRequestId?: string;
  participantSessionId: string;
}) {
  return fetchApi<unknown>('/chat/rooms', {
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
  page?: number;
  limit?: number;
}) {
  const search = new URLSearchParams();
  if (params?.type) search.set('type', params.type);
  if (params?.hashtag) search.set('hashtag', params.hashtag);
  if (params?.search) search.set('search', params.search);
  if (params?.country) search.set('country', params.country);
  if (params?.page !== undefined) search.set('page', String(params.page));
  if (params?.limit !== undefined) search.set('limit', String(params.limit));
  const qs = search.toString();
  return fetchApi<{ data: unknown[]; total: number }>(
    `/posts${qs ? `?${qs}` : ''}`
  );
}

export async function getPostById(id: string) {
  return fetchApi<unknown>(`/posts/${id}`);
}

export async function getMyPosts(params?: { page?: number; limit?: number }) {
  const search = new URLSearchParams();
  if (params?.page !== undefined) search.set('page', String(params.page));
  if (params?.limit !== undefined) search.set('limit', String(params.limit));
  const qs = search.toString();
  return fetchApi<{ data: unknown[]; total: number }>(
    `/posts/mine${qs ? `?${qs}` : ''}`
  );
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
  return fetchApi<unknown>('/posts', {
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
  return fetchApi<unknown>(`/posts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deletePost(id: string) {
  return fetchApi<void>(`/posts/${id}`, { method: 'DELETE' });
}

export async function getTrendingHashtags(limit?: number) {
  const qs = limit ? `?limit=${limit}` : '';
  return fetchApi<Array<{ id: string; name: string; count: number }>>(
    `/posts/hashtags/trending${qs}`
  );
}

// Session
export async function getSession() {
  return fetchApi<{ id: string; displayName?: string; avatarSeed?: string } | null>(
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
}) {
  return fetchApi<unknown>('/sessions/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
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
  return fetchApi<{
    sessionId: string;
    displayName: string;
    avatarSeed: string;
    isRegistered: boolean;
    user: {
      id: string;
      email: string | null;
      displayName: string;
      avatarUrl: string | null;
      googleId: string | null;
      role: string;
      rating: number;
      reviewCount: number;
      createdAt: string;
    } | null;
  }>('/auth/profile');
}

export async function logout() {
  return fetchApi<void>('/auth/logout', { method: 'POST' });
}
