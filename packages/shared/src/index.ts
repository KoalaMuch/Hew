export {
  OrderStatus,
  EscrowStatus,
  OfferStatus,
  TripStatus,
  ItemRequestStatus,
  ShipmentStatus,
  PayoutStatus,
  DisputeStatus,
  UserRole,
  KycStatus,
  MessageType,
} from "./types/index";
export type { BankAccount } from "./types/index";

export type {
  SessionInfo,
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
  ReviewDto,
  PublicProfileDto,
} from "./types/dto";

export {
  PLATFORM_COMMISSION_RATE,
  CURRENCY,
  PAYMENT_TIMEOUT_HOURS,
  DISPUTE_WINDOW_HOURS,
  AUTO_CONFIRM_DAYS,
  PAYOUT_AUTO_RELEASE_HOURS,
  SESSION_COOKIE_NAME,
  SESSION_TOKEN_HEADER,
  MAX_IMAGE_SIZE_MB,
  MAX_IMAGES_PER_UPLOAD,
  MAX_IMAGES_PER_POST,
  MAX_POST_CONTENT_LENGTH,
  MAX_HASHTAGS_PER_POST,
  ALLOWED_IMAGE_TYPES,
} from "./constants/index";

export {
  createTripSchema,
  createItemRequestSchema,
  createOfferSchema,
  acceptOfferSchema,
  guestCheckoutSchema,
  shipOrderSchema,
  createOrderFromChatSchema,
  updateShippingSchema,
  updateSessionSchema,
  registerSchema,
  loginSchema,
  createReviewSchema,
  createDisputeSchema,
  sendMessageSchema,
  createChatRoomSchema,
  createPostSchema,
  updatePostSchema,
  createCommentSchema,
  updateCommentSchema,
} from "./validators/index";
export {
  canTransition,
  getValidTransitions,
  assertValidTransition,
  TERMINAL_STATUSES,
  CANCELLABLE_STATUSES,
  SHIPPING_UPDATEABLE_STATUSES,
} from "./order-state-machine";

export type {
  CreateTripInput,
  CreateItemRequestInput,
  CreateOfferInput,
  GuestCheckoutInput,
  ShipOrderInput,
  CreateOrderFromChatInput,
  UpdateShippingInput,
  UpdateSessionInput,
  RegisterInput,
  LoginInput,
  CreateReviewInput,
  CreateDisputeInput,
  SendMessageInput,
  CreateChatRoomInput,
  CreatePostInput,
  UpdatePostInput,
  CreateCommentInput,
  UpdateCommentInput,
} from "./validators/index";

export {
  calculateCommission,
  generateIdempotencyKey,
  getErrorMessage,
} from "./utils/index";
