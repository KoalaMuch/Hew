import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { OfferStatus } from "@hew/db";
import { PrismaService } from "../../common/prisma.service";
import { calculateCommission } from "@hew/shared";
import type { CreateOfferInput } from "@hew/shared";
import { Prisma } from "@hew/db";
import { OrderService } from "../order/order.service";

@Injectable()
export class OfferService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orderService: OrderService,
  ) {}

  async create(travelerSessionId: string, data: CreateOfferInput) {
    const { commissionFee, totalPrice } = calculateCommission(
      data.productPrice,
      data.shippingFee,
    );

    let buyerSessionId: string;

    if (data.tripId) {
      const trip = await this.prisma.trip.findUnique({
        where: { id: data.tripId },
      });
      if (!trip) {
        throw new NotFoundException("Trip not found");
      }
      buyerSessionId = trip.sessionId;
    } else if (data.itemRequestId) {
      const itemRequest = await this.prisma.itemRequest.findUnique({
        where: { id: data.itemRequestId },
      });
      if (!itemRequest) {
        throw new NotFoundException("Item request not found");
      }
      buyerSessionId = itemRequest.sessionId;
    } else {
      throw new BadRequestException(
        "Either tripId or itemRequestId must be provided",
      );
    }

    return this.prisma.offer.create({
      data: {
        tripId: data.tripId,
        itemRequestId: data.itemRequestId,
        travelerSessionId,
        buyerSessionId,
        productPrice: new Prisma.Decimal(data.productPrice),
        shippingFee: new Prisma.Decimal(data.shippingFee),
        commissionFee: new Prisma.Decimal(commissionFee),
        totalPrice: new Prisma.Decimal(totalPrice),
        notes: data.notes,
      },
    });
  }

  async findByItemRequest(itemRequestId: string) {
    return this.prisma.offer.findMany({
      where: { itemRequestId },
      include: {
        travelerSession: true,
        buyerSession: true,
      },
    });
  }

  async findByTrip(tripId: string) {
    return this.prisma.offer.findMany({
      where: { tripId },
      include: {
        travelerSession: true,
        buyerSession: true,
      },
    });
  }

  async accept(id: string, sessionId: string) {
    const offer = await this.prisma.offer.findUnique({
      where: { id },
      include: { order: true },
    });

    if (!offer) {
      throw new NotFoundException("Offer not found");
    }

    if (offer.status !== OfferStatus.PENDING) {
      throw new BadRequestException("Offer is not pending");
    }

    if (offer.buyerSessionId !== sessionId) {
      throw new ForbiddenException("Only the buyer can accept this offer");
    }

    let createdOrderId = "";
    await this.prisma.$transaction(async (tx) => {
      await tx.offer.update({
        where: { id },
        data: { status: OfferStatus.ACCEPTED },
      });

      if (offer.itemRequestId) {
        await tx.offer.updateMany({
          where: {
            itemRequestId: offer.itemRequestId,
            id: { not: id },
            status: OfferStatus.PENDING,
          },
          data: { status: OfferStatus.REJECTED },
        });
      }

      const order = await this.orderService.createFromOffer(offer, tx);
      createdOrderId = order.id;
    });

    return this.orderService.findById(createdOrderId);
  }

  async reject(id: string, sessionId: string) {
    const offer = await this.prisma.offer.findUnique({
      where: { id },
    });

    if (!offer) {
      throw new NotFoundException("Offer not found");
    }

    if (offer.buyerSessionId !== sessionId) {
      throw new ForbiddenException("Only the buyer can reject this offer");
    }

    return this.prisma.offer.update({
      where: { id },
      data: { status: OfferStatus.REJECTED },
    });
  }
}
