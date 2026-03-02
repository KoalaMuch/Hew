import * as crypto from "crypto";
import { PLATFORM_COMMISSION_RATE } from "../constants";

export function calculateCommission(productPrice: number, shippingFee: number) {
  const subtotal = productPrice + shippingFee;
  const commissionFee = Math.ceil(subtotal * PLATFORM_COMMISSION_RATE);
  const totalPrice = subtotal + commissionFee;
  const payoutAmount = subtotal;

  return { commissionFee, totalPrice, payoutAmount };
}

export function generateIdempotencyKey(): string {
  return crypto.randomUUID();
}
