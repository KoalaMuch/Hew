import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublicProfile(sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        registeredUser: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            rating: true,
            reviewCount: true,
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException("User not found");
    }

    const [postCount, reviewCount, reviews] = await Promise.all([
      this.prisma.post.count({
        where: {
          sessionId,
          status: { not: "DELETED" },
        },
      }),
      this.prisma.review.count({
        where: { revieweeSessionId: sessionId },
      }),
      this.prisma.review.findMany({
        where: { revieweeSessionId: sessionId },
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          reviewerSession: {
            select: { id: true, displayName: true, avatarSeed: true, avatarUrl: true },
          },
        },
      }),
    ]);

    let rating = 0;
    if (session.registeredUser && session.registeredUser.reviewCount > 0) {
      rating = session.registeredUser.rating;
    } else if (reviewCount > 0) {
      const agg = await this.prisma.review.aggregate({
        where: { revieweeSessionId: sessionId },
        _avg: { rating: true },
      });
      rating = Number(agg._avg.rating) || 0;
    }

    const avatarUrl =
      session.avatarUrl ?? session.registeredUser?.avatarUrl ?? null;
    return {
      sessionId: session.id,
      displayName: session.displayName,
      avatarSeed: session.avatarSeed,
      avatarUrl,
      isRegistered: !!session.registeredUser,
      memberSince: session.createdAt.toISOString(),
      postCount,
      rating: Math.round(rating * 10) / 10,
      reviewCount,
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt.toISOString(),
        reviewerSession: {
          id: r.reviewerSession.id,
          displayName: r.reviewerSession.displayName,
          avatarSeed: r.reviewerSession.avatarSeed,
          avatarUrl: r.reviewerSession.avatarUrl ?? null,
        },
      })),
    };
  }
}
