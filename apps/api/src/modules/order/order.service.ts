import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { OrderStatus } from "@hew/db";
import { PrismaClient } from "@hew/db";
import { PrismaService } from "../../common/prisma.service";
import { generateIdempotencyKey } from "@hew/shared";

type TransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  async createFromOffer(
    offer: {
      id: string;
      buyerSessionId: string;
      travelerSessionId: string;
      totalPrice: { toString(): string };
      commissionFee: { toString(): string };
      productPrice: { toString(): string };
      shippingFee: { toString(): string };
    },
    tx?: TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    const idempotencyKey = generateIdempotencyKey();

    const payoutAmount = Number(offer.productPrice) + Number(offer.shippingFee);

    return client.order.create({
      data: {
        offerId: offer.id,
        buyerSessionId: offer.buyerSessionId,
        travelerSessionId: offer.travelerSessionId,
        totalAmount: Number(offer.totalPrice),
        commissionAmount: Number(offer.commissionFee),
        payoutAmount,
        status: "ESCROW_PENDING",
        idempotencyKey,
      },
    });
  }

  async findBySession(
    sessionId: string,
    role?: "buyer" | "traveler",
  ) {
    const where =
      role === "buyer"
        ? { buyerSessionId: sessionId }
        : role === "traveler"
          ? { travelerSessionId: sessionId }
          : {
              OR: [
                { buyerSessionId: sessionId },
                { travelerSessionId: sessionId },
              ],
            };

    return this.prisma.order.findMany({
      where,
      include: {
        offer: true,
        escrowPayment: true,
        shipment: true,
        payout: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        offer: true,
        escrowPayment: true,
        shipment: true,
        payout: true,
      },
    });

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    return order;
  }

  async confirmDelivery(id: string, sessionId: string) {
    const order = await this.findById(id);

    if (order.buyerSessionId !== sessionId) {
      throw new ForbiddenException("Only the buyer can confirm delivery");
    }

    return this.updateStatus(id, "DELIVERED", sessionId);
  }

  async updateStatus(
    id: string,
    status: OrderStatus,
    sessionId?: string,
    tx?: TransactionClient,
  ) {
    const client = tx ?? this.prisma;

    const order = await client.order.update({
      where: { id },
      data: { status },
    });

    await client.auditLog.create({
      data: {
        sessionId: sessionId ?? null,
        action: "ORDER_STATUS_UPDATE",
        entity: "Order",
        entityId: id,
        metadata: { status },
      },
    });

    return order;
  }
}
