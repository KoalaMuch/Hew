export interface SessionInfo {
  id: string;
  displayName: string;
  avatarSeed: string;
}

export interface TripDto {
  id: string;
  sessionId: string;
  session: SessionInfo;
  country: string;
  city?: string | null;
  departureDate?: string | null;
  returnDate?: string | null;
  description?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ItemRequestDto {
  id: string;
  sessionId: string;
  session: SessionInfo;
  title: string;
  description?: string | null;
  imageUrls: string[];
  countries: string[];
  maxBudget?: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface OfferDto {
  id: string;
  tripId?: string | null;
  itemRequestId?: string | null;
  travelerSessionId: string;
  buyerSessionId: string;
  productPrice: number;
  shippingFee: number;
  commissionFee: number;
  totalPrice: number;
  currency: string;
  notes?: string | null;
  status: string;
  expiresAt?: string | null;
  createdAt: string;
}

export interface OrderDto {
  id: string;
  offerId: string;
  offer: OfferDto;
  buyerSessionId: string;
  travelerSessionId: string;
  totalAmount: number;
  commissionAmount: number;
  payoutAmount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  escrowPayment?: Record<string, unknown> | null;
  shipment?: Record<string, unknown> | null;
  payout?: Record<string, unknown> | null;
}

export interface PostDto {
  id: string;
  sessionId: string;
  session: SessionInfo;
  type: "RUBHEW" | "HAKHONG";
  content: string;
  hashtags: string[];
  imageUrls: string[];
  country?: string | null;
  city?: string | null;
  travelDate?: string | null;
  budget?: number | null;
  status: string;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChatRoomDto {
  id: string;
  tripId?: string | null;
  itemRequestId?: string | null;
  offerId?: string | null;
  participants: string[];
  createdAt: string;
  messages?: ChatMessageDto[];
}

export interface ChatMessageDto {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  imageUrl?: string | null;
  type: string;
  readAt?: string | null;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}

export interface ProfileDto {
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
}
