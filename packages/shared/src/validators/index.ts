import { z } from "zod";

export const createTripSchema = z.object({
  country: z.string().min(1).max(100),
  city: z.string().max(100).optional(),
  departureDate: z.string().datetime().optional(),
  returnDate: z.string().datetime().optional(),
  description: z.string().max(2000).optional(),
});

export const createItemRequestSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  imageUrls: z.array(z.string().url()).max(5).default([]),
  countries: z.array(z.string().min(1)).min(1),
  maxBudget: z.number().positive().optional(),
});

export const createOfferSchema = z.object({
  tripId: z.string().optional(),
  itemRequestId: z.string().optional(),
  buyerSessionId: z.string(),
  productPrice: z.number().positive(),
  shippingFee: z.number().min(0),
  notes: z.string().max(1000).optional(),
});

export const acceptOfferSchema = z.object({
  offerId: z.string(),
});

export const guestCheckoutSchema = z.object({
  orderId: z.string(),
  phone: z
    .string()
    .regex(/^0[0-9]{8,9}$/, "Invalid Thai phone number")
    .optional(),
  email: z.string().email().optional(),
  paymentMethod: z.enum(["promptpay", "credit_card"]),
});

export const shipOrderSchema = z.object({
  trackingNumber: z.string().max(100).optional(),
  carrier: z.string().max(100).optional(),
  proofImageUrls: z.array(z.string().url()).min(1).max(5),
  bankAccount: z.object({
    bankName: z.string().min(1),
    accountNumber: z.string().min(1),
    accountName: z.string().min(1),
  }),
});

export const updateSessionSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  avatarSeed: z.string().max(50).optional(),
  avatarUrl: z.string().url().nullable().optional(),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  displayName: z.string().min(1).max(50),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const createReviewSchema = z.object({
  orderId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export const createDisputeSchema = z.object({
  orderId: z.string(),
  reason: z.string().min(1).max(2000),
  evidenceUrls: z.array(z.string().url()).max(10).default([]),
});

export const sendMessageSchema = z.object({
  roomId: z.string(),
  content: z.string().min(1).max(5000),
  imageUrl: z.string().url().optional(),
  type: z.enum(["TEXT", "IMAGE", "OFFER_CARD", "ORDER_CARD", "SYSTEM"]).default("TEXT"),
});

export const createOrderFromChatSchema = z.object({
  roomId: z.string(),
  orderName: z.string().min(1).max(200),
  orderImageUrl: z.string().url().optional(),
  productPrice: z.number().positive(),
  shippingFee: z.number().min(0),
});

export const updateShippingSchema = z.object({
  trackingNumber: z.string().max(100).optional(),
  carrier: z.string().max(100).optional(),
}).refine(
  (data) => data.trackingNumber !== undefined || data.carrier !== undefined,
  { message: "At least one of trackingNumber or carrier must be provided" },
);

export const createChatRoomSchema = z.object({
  tripId: z.string().optional(),
  itemRequestId: z.string().optional(),
  participantSessionId: z.string(),
});

export type CreateTripInput = z.infer<typeof createTripSchema>;
export type CreateItemRequestInput = z.infer<typeof createItemRequestSchema>;
export type CreateOfferInput = z.infer<typeof createOfferSchema>;
export type GuestCheckoutInput = z.infer<typeof guestCheckoutSchema>;
export type ShipOrderInput = z.infer<typeof shipOrderSchema>;
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type CreateDisputeInput = z.infer<typeof createDisputeSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type CreateChatRoomInput = z.infer<typeof createChatRoomSchema>;
export type CreateOrderFromChatInput = z.infer<typeof createOrderFromChatSchema>;
export type UpdateShippingInput = z.infer<typeof updateShippingSchema>;

export const createPostSchema = z.object({
  type: z.enum(["RUBHEW", "HAKHONG"]),
  content: z.string().min(1).max(5000),
  imageUrls: z.array(z.string().url()).max(10).default([]),
  country: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  travelDate: z.string().datetime().optional(),
  budget: z.number().positive().optional(),
});

export const updatePostSchema = createPostSchema.partial().omit({ type: true });

export const createCommentSchema = z.object({
  content: z.string().min(1).max(2000),
});

export const updateCommentSchema = z.object({
  content: z.string().min(1).max(2000),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
