import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { OrderStatus } from "@hew/db";
import { PrismaClient } from "@hew/db";
import { PrismaService } from "../../common/prisma.service";
import {
  assertValidTransition,
  calculateCommission,
  CANCELLABLE_STATUSES,
  generateIdempotencyKey,
} from "@hew/shared";
import type { CreateOrderFromChatInput } from "@hew/shared";

type TransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  async createFromChat(
    travelerSessionId: string,
    data: CreateOrderFromChatInput,
    tx?: TransactionClient,
  ) {
    const client = tx ?? this.prisma;

    const room = await client.chatRoom.findUnique({
      where: { id: data.roomId },
      include: { order: true },
    });

    if (!room) {
      throw new NotFoundException("Room not found");
    }

    if (!room.participants.includes(travelerSessionId)) {
      throw new ForbiddenException("You are not a participant of this room");
    }

    if (room.order) {
      throw new BadRequestException("This room already has an order");
    }

    const buyerSessionId = room.participants.find((p) => p !== travelerSessionId);
    if (!buyerSessionId) {
      throw new BadRequestException("Room must have exactly two participants");
    }

    const { commissionFee, totalPrice, payoutAmount } = calculateCommission(
      data.productPrice,
      data.shippingFee,
    );

    const idempotencyKey = generateIdempotencyKey();

    return client.order.create({
      data: {
        roomId: data.roomId,
        orderName: data.orderName,
        orderImageUrl: data.orderImageUrl,
        buyerSessionId,
        travelerSessionId,
        totalAmount: totalPrice,
        commissionAmount: commissionFee,
        payoutAmount,
        status: "ESCROW_PENDING",
        idempotencyKey,
      },
    });
  }

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

    const existing = await client.order.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException("Order not found");
    }

    assertValidTransition(existing.status as OrderStatus, status);

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
        metadata: { from: existing.status, to: status },
      },
    });

    return order;
  }

  async cancel(id: string, sessionId: string) {
    const order = await this.findById(id);

    const isBuyer = order.buyerSessionId === sessionId;
    const isTraveler = order.travelerSessionId === sessionId;
    if (!isBuyer && !isTraveler) {
      throw new ForbiddenException("You do not have access to this order");
    }

    const status = order.status as OrderStatus;
    if (!CANCELLABLE_STATUSES.includes(status)) {
      throw new BadRequestException(
        `Order cannot be cancelled from status ${status}. Cancellable: ${CANCELLABLE_STATUSES.join(", ")}`,
      );
    }

    return this.updateStatus(id, "CANCELLED", sessionId);
  }
}
