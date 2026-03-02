import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { EscrowStatus, OrderStatus, PayoutStatus } from "@hew/db";
import { PrismaService } from "../../common/prisma.service";

@Injectable()
export class PayoutService {
  constructor(private readonly prisma: PrismaService) {}

  async createPayout(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { escrowPayment: true, payout: true },
    });

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    const bankAccount = order.travelerBankAccount as unknown;
    if (!bankAccount || typeof bankAccount !== "object") {
      throw new BadRequestException(
        "Order must have traveler bank account to create payout",
      );
    }

    if (order.payout) {
      throw new BadRequestException("Payout already exists for this order");
    }

    const payout = await this.prisma.$transaction(async (tx) => {
      const created = await tx.payout.create({
        data: {
          orderId,
          travelerSessionId: order.travelerSessionId,
          amount: order.payoutAmount,
          bankAccount: bankAccount as object,
          status: PayoutStatus.COMPLETED,
          processedAt: new Date(),
        },
      });

      if (order.escrowPayment) {
        await tx.escrowPayment.update({
          where: { orderId },
          data: {
            status: EscrowStatus.RELEASED,
            releasedAt: new Date(),
          },
        });
      }

      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.COMPLETED },
      });

      return created;
    });

    return payout;
  }

  async releasePayout(id: string) {
    const payout = await this.prisma.payout.findUnique({
      where: { id },
      include: { order: { include: { escrowPayment: true } } },
    });

    if (!payout) {
      throw new NotFoundException("Payout not found");
    }

    if (payout.status === PayoutStatus.COMPLETED) {
      return payout;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.payout.update({
        where: { id },
        data: {
          status: PayoutStatus.COMPLETED,
          processedAt: new Date(),
        },
      });

      if (payout.order.escrowPayment) {
        await tx.escrowPayment.update({
          where: { orderId: payout.orderId },
          data: {
            status: EscrowStatus.RELEASED,
            releasedAt: new Date(),
          },
        });
      }

      await tx.order.update({
        where: { id: payout.orderId },
        data: { status: OrderStatus.COMPLETED },
      });
    });

    return this.findById(id);
  }

  async findBySession(sessionId: string) {
    return this.prisma.payout.findMany({
      where: { travelerSessionId: sessionId },
      include: { order: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string) {
    const payout = await this.prisma.payout.findUnique({
      where: { id },
      include: { order: true },
    });

    if (!payout) {
      throw new NotFoundException("Payout not found");
    }

    return payout;
  }
}
