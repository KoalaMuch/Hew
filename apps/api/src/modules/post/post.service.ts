import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { PostType, PostStatus } from "@hew/db";
import { PrismaService } from "../../common/prisma.service";
import type { CreatePostInput, UpdatePostInput } from "@hew/shared";

const HASHTAG_REGEX = /#[\w\u0E00-\u0E7F]+/g;

function extractHashtags(content: string): string[] {
  const matches = content.match(HASHTAG_REGEX);
  if (!matches) return [];
  return [...new Set(matches.map((tag) => tag.toLowerCase()))];
}

@Injectable()
export class PostService {
  constructor(private readonly prisma: PrismaService) {}

  async create(sessionId: string, data: CreatePostInput) {
    const hashtags = extractHashtags(data.content);

    const post = await this.prisma.post.create({
      data: {
        sessionId,
        type: data.type,
        content: data.content,
        hashtags,
        imageUrls: data.imageUrls ?? [],
        country: data.country,
        city: data.city,
        travelDate: data.travelDate ? new Date(data.travelDate) : undefined,
        budget: data.budget,
      },
      include: { session: { select: { displayName: true, avatarSeed: true, avatarUrl: true } } },
    });

    if (hashtags.length > 0) {
      await Promise.all(
        hashtags.map((tag) =>
          this.prisma.postHashtag.upsert({
            where: { name: tag },
            create: { name: tag, count: 1 },
            update: { count: { increment: 1 } },
          }),
        ),
      );
    }

    return post;
  }

  async findAll(filters: {
    type?: PostType;
    hashtag?: string;
    search?: string;
    country?: string;
    sessionId?: string;
    page?: number;
    limit?: number;
  }) {
    const { type, hashtag, search, country, sessionId, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { status: "ACTIVE" as PostStatus };
    if (type) where.type = type;
    if (country) where.country = country;
    if (sessionId) where.sessionId = sessionId;
    if (hashtag) where.hashtags = { has: hashtag.toLowerCase() };
    if (search) {
      where.OR = [
        { content: { contains: search, mode: "insensitive" } },
        { hashtags: { has: search.toLowerCase().startsWith("#") ? search.toLowerCase() : `#${search.toLowerCase()}` } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { session: { select: { displayName: true, avatarSeed: true, avatarUrl: true } } },
      }),
      this.prisma.post.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findById(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: { session: { select: { displayName: true, avatarSeed: true, avatarUrl: true } } },
    });
    if (!post || post.status === "DELETED") {
      throw new NotFoundException("Post not found");
    }
    await this.prisma.post.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
    return post;
  }

  async findBySession(sessionId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = { sessionId, status: { not: "DELETED" as PostStatus } };

    const [data, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { session: { select: { displayName: true, avatarSeed: true, avatarUrl: true } } },
      }),
      this.prisma.post.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async update(id: string, sessionId: string, data: UpdatePostInput) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException("Post not found");
    if (post.sessionId !== sessionId) {
      throw new ForbiddenException("Not the owner of this post");
    }

    const updateData: Record<string, unknown> = {};
    if (data.content !== undefined) {
      updateData.content = data.content;
      updateData.hashtags = extractHashtags(data.content);
    }
    if (data.imageUrls !== undefined) updateData.imageUrls = data.imageUrls;
    if (data.country !== undefined) updateData.country = data.country;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.travelDate !== undefined) updateData.travelDate = new Date(data.travelDate);
    if (data.budget !== undefined) updateData.budget = data.budget;

    return this.prisma.post.update({
      where: { id },
      data: updateData,
      include: { session: { select: { displayName: true, avatarSeed: true, avatarUrl: true } } },
    });
  }

  async remove(id: string, sessionId: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException("Post not found");
    if (post.sessionId !== sessionId) {
      throw new ForbiddenException("Not the owner of this post");
    }

    return this.prisma.post.update({
      where: { id },
      data: { status: "DELETED" },
    });
  }

  async getTrendingHashtags(limit = 20) {
    return this.prisma.postHashtag.findMany({
      where: { count: { gt: 0 } },
      orderBy: { count: "desc" },
      take: limit,
    });
  }

  async searchHashtags(query: string, limit = 8) {
    const q = query.replace(/^#/, "").toLowerCase().trim();
    if (!q) {
      return this.getTrendingHashtags(Math.min(limit, 20));
    }
    return this.prisma.postHashtag.findMany({
      where: {
        name: { contains: q, mode: "insensitive" },
        count: { gt: 0 },
      },
      orderBy: { count: "desc" },
      take: Math.min(limit, 20),
    });
  }
}
