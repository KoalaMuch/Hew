export const PLATFORM_COMMISSION_RATE = 0.075; // 7.5%

export const CURRENCY = "THB" as const;

export const PAYMENT_TIMEOUT_HOURS = 48;
export const DISPUTE_WINDOW_HOURS = 48;
export const AUTO_CONFIRM_DAYS = 7;
export const PAYOUT_AUTO_RELEASE_HOURS = 24;

export const SESSION_COOKIE_NAME = "hew_session";
export const SESSION_TOKEN_HEADER = "x-session-token";

export const MAX_IMAGE_SIZE_MB = 10;
export const MAX_IMAGES_PER_UPLOAD = 5;
export const MAX_IMAGES_PER_POST = 10;
export const MAX_POST_CONTENT_LENGTH = 5000;
export const MAX_HASHTAGS_PER_POST = 10;

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
