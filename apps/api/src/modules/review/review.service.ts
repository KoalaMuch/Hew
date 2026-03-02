import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { OrderStatus } from "@hew/db";
import { PrismaService } from "../../common/prisma.service";
import type { CreateReviewInput } from "@hew/shared";

@Injectable()
export class ReviewService {
  constructor(private readonly prisma: PrismaService) {}

  async create(reviewerSessionId: string, data: CreateReviewInput) {
    const order = await this.prisma.order.findUnique({
      where: { id: data.orderId },
    });

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    if (order.status !== OrderStatus.COMPLETED) {
      throw new BadRequestException("Can only review completed orders");
    }

    const isBuyer = order.buyerSessionId === reviewerSessionId;
    const isTraveler = order.travelerSessionId === reviewerSessionId;

    if (!isBuyer && !isTraveler) {
      throw new ForbiddenException("Only buyer or traveler can leave a review");
    }

    const existingReview = await this.prisma.review.findUnique({
      where: {
        orderId_reviewerSessionId: {
          orderId: data.orderId,
          reviewerSessionId,
        },
      },
    });

    if (existingReview) {
      throw new BadRequestException("You have already reviewed this order");
    }

    const revieweeSessionId =
      reviewerSessionId === order.buyerSessionId
        ? order.travelerSessionId
        : order.buyerSessionId;

    return this.prisma.review.create({
      data: {
        orderId: data.orderId,
        reviewerSessionId,
        revieweeSessionId,
        rating: data.rating,
        comment: data.comment ?? null,
      },
    });
  }

  async findBySession(sessionId: string) {
    return this.prisma.review.findMany({
      where: { revieweeSessionId: sessionId },
      include: {
        reviewerSession: {
          select: { id: true, displayName: true, avatarSeed: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
