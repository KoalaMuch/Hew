import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import type { CreateCommentInput, UpdateCommentInput } from "@hew/shared";

const SESSION_SELECT = { displayName: true, avatarSeed: true, avatarUrl: true };

@Injectable()
export class CommentService {
  constructor(private readonly prisma: PrismaService) {}

  async findByPost(postId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: { postId },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { session: { select: SESSION_SELECT } },
      }),
      this.prisma.comment.count({ where: { postId } }),
    ]);

    return { data, total, page, limit };
  }

  async create(postId: string, sessionId: string, data: CreateCommentInput) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post || post.status === "DELETED") {
      throw new NotFoundException("Post not found");
    }

    const [comment] = await this.prisma.$transaction([
      this.prisma.comment.create({
        data: {
          postId,
          sessionId,
          content: data.content,
        },
        include: { session: { select: SESSION_SELECT } },
      }),
      this.prisma.post.update({
        where: { id: postId },
        data: { commentCount: { increment: 1 } },
      }),
    ]);

    return comment;
  }

  async update(
    postId: string,
    commentId: string,
    sessionId: string,
    data: UpdateCommentInput,
  ) {
    const comment = await this.prisma.comment.findFirst({
      where: { id: commentId, postId },
    });
    if (!comment) throw new NotFoundException("Comment not found");
    if (comment.sessionId !== sessionId) {
      throw new ForbiddenException("Not the owner of this comment");
    }

    return this.prisma.comment.update({
      where: { id: commentId },
      data: { content: data.content },
      include: { session: { select: SESSION_SELECT } },
    });
  }

  async remove(postId: string, commentId: string, sessionId: string) {
    const comment = await this.prisma.comment.findFirst({
      where: { id: commentId, postId },
    });
    if (!comment) throw new NotFoundException("Comment not found");
    if (comment.sessionId !== sessionId) {
      throw new ForbiddenException("Not the owner of this comment");
    }

    await this.prisma.$transaction([
      this.prisma.comment.delete({ where: { id: commentId } }),
      this.prisma.post.update({
        where: { id: postId },
        data: { commentCount: { decrement: 1 } },
      }),
    ]);
  }
}
