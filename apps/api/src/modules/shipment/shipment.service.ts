import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { OrderStatus, ShipmentStatus } from "@hew/db";
import { PrismaService } from "../../common/prisma.service";
import type { ShipOrderInput } from "@hew/shared";

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

    const allowedStatuses: OrderStatus[] = [OrderStatus.PAID, OrderStatus.PURCHASING];
    if (!allowedStatuses.includes(order.status)) {
      throw new BadRequestException(
        "Order must be in PAID or PURCHASING status to ship",
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.shipment.upsert({
        where: { orderId },
        create: {
          orderId,
          trackingNumber: data.trackingNumber,
          carrier: data.carrier,
          proofImageUrls: data.proofImageUrls,
          status: ShipmentStatus.SHIPPED,
          shippedAt: new Date(),
        },
        update: {
          trackingNumber: data.trackingNumber,
          carrier: data.carrier,
          proofImageUrls: data.proofImageUrls,
          status: ShipmentStatus.SHIPPED,
          shippedAt: new Date(),
        },
      });

      await tx.order.update({
        where: { id: orderId },
        data: {
          travelerBankAccount: data.bankAccount as object,
          status: OrderStatus.SHIPPED,
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
}
