import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaClient } from "@hew/db";
import { PrismaService } from "../../common/prisma.service";
import { SHIPPING_UPDATEABLE_STATUSES } from "@hew/shared";
import type { ShipOrderInput, UpdateShippingInput } from "@hew/shared";

type TransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

@Injectable()
export class ShipmentService {
  constructor(private readonly prisma: PrismaService) {}

  async markShipped(
    orderId: string,
    sessionId: string,
    data: ShipOrderInput,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { shipment: true },
    });

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    if (order.travelerSessionId !== sessionId) {
      throw new ForbiddenException("Only the traveler can mark the order as shipped");
    }

    const allowedStatuses = ["PAID", "PURCHASING"] as const;
    if (!allowedStatuses.includes(order.status as typeof allowedStatuses[number])) {
      throw new BadRequestException(
        "Order must be in PAID or PURCHASING status to ship",
      );
    }

    await this.prisma.$transaction(async (tx: TransactionClient) => {
      await tx.shipment.upsert({
        where: { orderId },
        create: {
          orderId,
          trackingNumber: data.trackingNumber,
          carrier: data.carrier,
          proofImageUrls: data.proofImageUrls,
          status: "SHIPPED",
          shippedAt: new Date(),
        },
        update: {
          trackingNumber: data.trackingNumber,
          carrier: data.carrier,
          proofImageUrls: data.proofImageUrls,
          status: "SHIPPED",
          shippedAt: new Date(),
        },
      });

      await tx.order.update({
        where: { id: orderId },
        data: {
          travelerBankAccount: data.bankAccount as object,
          status: "SHIPPED",
        },
      });
    });

    return this.getShipment(orderId, sessionId);
  }

  async getShipment(orderId: string, sessionId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { shipment: true },
    });

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    const isBuyer = order.buyerSessionId === sessionId;
    const isTraveler = order.travelerSessionId === sessionId;
    if (!isBuyer && !isTraveler) {
      throw new ForbiddenException("You do not have access to this order");
    }

    if (!order.shipment) {
      throw new NotFoundException("Shipment not found for this order");
    }

    return order.shipment;
  }

  async updateShipping(
    orderId: string,
    sessionId: string,
    data: UpdateShippingInput,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { shipment: true },
    });

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    if (order.travelerSessionId !== sessionId) {
      throw new ForbiddenException(
        "Only the traveler can update shipping information",
      );
    }

    const status = order.status as (typeof SHIPPING_UPDATEABLE_STATUSES)[number];
    if (!SHIPPING_UPDATEABLE_STATUSES.includes(status)) {
      throw new BadRequestException(
        `Shipping can only be updated when order is SHIPPED. Current: ${order.status}`,
      );
    }

    if (!order.shipment) {
      throw new NotFoundException("Shipment not found for this order");
    }

    const updateData: Partial<{ trackingNumber: string; carrier: string }> = {};
    if (data.trackingNumber !== undefined) updateData.trackingNumber = data.trackingNumber;
    if (data.carrier !== undefined) updateData.carrier = data.carrier;

    return this.prisma.shipment.update({
      where: { orderId },
      data: updateData,
    });
  }
}
