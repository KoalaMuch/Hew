import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { EscrowStatus, OrderStatus } from "@hew/db";
import { PrismaService } from "../../common/prisma.service";
import { generateIdempotencyKey } from "@hew/shared";
import type { GuestCheckoutInput } from "@hew/shared";

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService) {}

  async initiatePayment(
    orderId: string,
    sessionId: string,
    checkoutData: GuestCheckoutInput,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { escrowPayment: true },
    });

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    if (order.buyerSessionId !== sessionId) {
      throw new ForbiddenException("Only the buyer can initiate payment");
    }

    if (order.status !== OrderStatus.ESCROW_PENDING) {
      throw new BadRequestException(
        "Order must be in ESCROW_PENDING status to initiate payment",
      );
    }

    const idempotencyKey = generateIdempotencyKey();

    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          buyerPhone: checkoutData.phone ?? undefined,
          buyerEmail: checkoutData.email ?? undefined,
        },
      });

      const existing = await tx.escrowPayment.findUnique({
        where: { orderId },
      });

      if (existing) {
        if (existing.status === EscrowStatus.FUNDED) {
          return;
        }
        await tx.escrowPayment.update({
          where: { orderId },
          data: {
            status: EscrowStatus.FUNDED,
            fundedAt: new Date(),
          },
        });
      } else {
        await tx.escrowPayment.create({
          data: {
            orderId,
            amount: order.totalAmount,
            idempotencyKey,
            status: EscrowStatus.FUNDED,
            fundedAt: new Date(),
          },
        });
      }

      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.PAID },
      });
    });

    return {
      paymentUrl: `https://simulated.omise.co/charge/${orderId}`,
      qrCode: `https://simulated.omise.co/qr/${orderId}`,
      status: "funded",
    };
  }

  async handleWebhook(payload: { id?: string; [key: string]: unknown }) {
    const providerChargeId = payload.id as string | undefined;
    if (!providerChargeId) {
      return { processed: false, reason: "Missing charge id" };
    }

    const escrowPayment = await this.prisma.escrowPayment.findUnique({
      where: { providerChargeId },
      include: { order: true },
    });

    if (!escrowPayment) {
      return { processed: false, reason: "Escrow payment not found" };
    }

    if (escrowPayment.status === EscrowStatus.FUNDED) {
      return { processed: true, reason: "Already funded (idempotent)" };
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.escrowPayment.update({
        where: { id: escrowPayment.id },
        data: {
          status: EscrowStatus.FUNDED,
          fundedAt: new Date(),
        },
      });

      await tx.order.update({
        where: { id: escrowPayment.orderId },
        data: { status: OrderStatus.PAID },
      });
    });

    return { processed: true };
  }

  async getPaymentStatus(orderId: string, sessionId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { escrowPayment: true },
    });

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    const isBuyer = order.buyerSessionId === sessionId;
    const isTraveler = order.travelerSessionId === sessionId;
    if (!isBuyer && !isTraveler) {
      throw new ForbiddenException("You do not have access to this order");
    }

    if (!order.escrowPayment) {
      throw new NotFoundException("Escrow payment not found for this order");
    }

    const { escrowPayment } = order;
    return {
      status: escrowPayment.status,
      fundedAt: escrowPayment.fundedAt,
      releasedAt: escrowPayment.releasedAt,
    };
  }
}
