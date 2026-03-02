import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DisputeStatus, OrderStatus } from "@hew/db";
import { PrismaService } from "../../common/prisma.service";
import type { CreateDisputeInput } from "@hew/shared";

@Injectable()
export class DisputeService {
  constructor(private readonly prisma: PrismaService) {}

  async create(orderId: string, sessionId: string, data: CreateDisputeInput) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    const isBuyer = order.buyerSessionId === sessionId;
    const isTraveler = order.travelerSessionId === sessionId;

    if (!isBuyer && !isTraveler) {
      throw new ForbiddenException("Only buyer or traveler can raise a dispute");
    }

    const dispute = await this.prisma.dispute.create({
      data: {
        orderId,
        raisedBySessionId: sessionId,
        reason: data.reason,
        evidenceUrls: data.evidenceUrls ?? [],
      },
    });

    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.DISPUTED },
    });

    return dispute;
  }

  async findBySession(sessionId: string) {
    return this.prisma.dispute.findMany({
      where: {
        order: {
          OR: [
            { buyerSessionId: sessionId },
            { travelerSessionId: sessionId },
          ],
        },
      },
      include: {
        order: {
          include: {
            offer: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            offer: true,
          },
        },
      },
    });

    if (!dispute) {
      throw new NotFoundException("Dispute not found");
    }

    return dispute;
  }

  async resolve(
    id: string,
    resolution: string,
    status: "RESOLVED_BUYER" | "RESOLVED_TRAVELER",
  ) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id },
      include: { order: true },
    });

    if (!dispute) {
      throw new NotFoundException("Dispute not found");
    }

    const orderStatus =
      status === "RESOLVED_BUYER"
        ? OrderStatus.RESOLVED_BUYER
        : OrderStatus.RESOLVED_TRAVELER;

    await this.prisma.$transaction([
      this.prisma.dispute.update({
        where: { id },
        data: {
          status,
          resolution,
          resolvedAt: new Date(),
        },
      }),
      this.prisma.order.update({
        where: { id: dispute.orderId },
        data: { status: orderStatus },
      }),
    ]);

    return this.findById(id);
  }
}
