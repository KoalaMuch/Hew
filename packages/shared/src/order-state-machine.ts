/** Order status - must match @hew/db OrderStatus enum. */
export type OrderStatus =
  | "CREATED"
  | "ESCROW_PENDING"
  | "PAID"
  | "PURCHASING"
  | "SHIPPED"
  | "DELIVERED"
  | "PAYOUT_RELEASED"
  | "COMPLETED"
  | "DISPUTED"
  | "RESOLVED_BUYER"
  | "RESOLVED_TRAVELER"
  | "REFUNDED"
  | "CANCELLED";

/** Valid order status transitions. */
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  CREATED: ["ESCROW_PENDING", "CANCELLED"],
  ESCROW_PENDING: ["PAID", "CANCELLED", "REFUNDED"],
  PAID: ["PURCHASING", "REFUNDED", "DISPUTED"],
  PURCHASING: ["SHIPPED", "DISPUTED"],
  SHIPPED: ["DELIVERED", "DISPUTED"],
  DELIVERED: ["PAYOUT_RELEASED", "DISPUTED"],
  PAYOUT_RELEASED: ["COMPLETED", "DISPUTED"],
  COMPLETED: [],
  DISPUTED: ["RESOLVED_BUYER", "RESOLVED_TRAVELER", "REFUNDED"],
  RESOLVED_BUYER: ["COMPLETED"],
  RESOLVED_TRAVELER: ["COMPLETED"],
  REFUNDED: [],
  CANCELLED: [],
};

/** Terminal states - no further transitions allowed. */
export const TERMINAL_STATUSES: OrderStatus[] = [
  "COMPLETED",
  "REFUNDED",
  "CANCELLED",
];

/** States from which order can be cancelled by user. */
export const CANCELLABLE_STATUSES: OrderStatus[] = [
  "CREATED",
  "ESCROW_PENDING",
];

/** States where shipping info (tracking, carrier) can be updated. */
export const SHIPPING_UPDATEABLE_STATUSES: OrderStatus[] = ["SHIPPED"];

export function canTransition(
  from: OrderStatus,
  to: OrderStatus,
): boolean {
  const allowed = TRANSITIONS[from];
  return allowed?.includes(to) ?? false;
}

export function getValidTransitions(from: OrderStatus): OrderStatus[] {
  return TRANSITIONS[from] ?? [];
}

export function assertValidTransition(
  from: OrderStatus,
  to: OrderStatus,
): void {
  if (!canTransition(from, to)) {
    throw new Error(
      `Invalid order transition: ${from} -> ${to}. Allowed: ${getValidTransitions(from).join(", ") || "none"}`,
    );
  }
}
