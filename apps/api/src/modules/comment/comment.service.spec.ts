import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotFoundException, ForbiddenException } from "@nestjs/common";
import { CommentService } from "./comment.service";

const mockPrisma = {
  comment: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  post: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  $transaction: vi.fn(),
};

describe("CommentService", () => {
  let service: CommentService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CommentService(mockPrisma as any);
  });

  describe("findByPost", () => {
    it("returns paginated comments", async () => {
      const comments = [
        { id: "c1", content: "Hello", postId: "p1", sessionId: "s1" },
      ];
      mockPrisma.comment.findMany.mockResolvedValue(comments);
      mockPrisma.comment.count.mockResolvedValue(1);

      const result = await service.findByPost("p1", 1, 20);

      expect(result).toEqual({ data: comments, total: 1, page: 1, limit: 20 });
      expect(mockPrisma.comment.findMany).toHaveBeenCalledWith({
        where: { postId: "p1" },
        skip: 0,
        take: 20,
        orderBy: { createdAt: "desc" },
        include: {
          session: { select: { displayName: true, avatarSeed: true } },
        },
      });
    });

    it("handles pagination offset", async () => {
      mockPrisma.comment.findMany.mockResolvedValue([]);
      mockPrisma.comment.count.mockResolvedValue(0);

      await service.findByPost("p1", 3, 10);

      expect(mockPrisma.comment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
    });
  });

  describe("create", () => {
    it("creates a comment and increments commentCount", async () => {
      const post = { id: "p1", status: "ACTIVE" };
      const comment = {
        id: "c1",
        content: "Nice!",
        postId: "p1",
        sessionId: "s1",
      };
      mockPrisma.post.findUnique.mockResolvedValue(post);
      mockPrisma.$transaction.mockResolvedValue([comment, {}]);

      const result = await service.create("p1", "s1", { content: "Nice!" });

      expect(result).toEqual(comment);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it("throws NotFoundException for deleted post", async () => {
      mockPrisma.post.findUnique.mockResolvedValue({
        id: "p1",
        status: "DELETED",
      });

      await expect(
        service.create("p1", "s1", { content: "test" }),
      ).rejects.toThrow(NotFoundException);
    });

    it("throws NotFoundException for non-existent post", async () => {
      mockPrisma.post.findUnique.mockResolvedValue(null);

      await expect(
        service.create("p1", "s1", { content: "test" }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("update", () => {
    it("updates own comment", async () => {
      const comment = { id: "c1", postId: "p1", sessionId: "s1" };
      const updated = { ...comment, content: "Updated!" };
      mockPrisma.comment.findFirst.mockResolvedValue(comment);
      mockPrisma.comment.update.mockResolvedValue(updated);

      const result = await service.update("p1", "c1", "s1", {
        content: "Updated!",
      });

      expect(result).toEqual(updated);
    });

    it("throws NotFoundException for non-existent comment", async () => {
      mockPrisma.comment.findFirst.mockResolvedValue(null);

      await expect(
        service.update("p1", "c1", "s1", { content: "test" }),
      ).rejects.toThrow(NotFoundException);
    });

    it("throws ForbiddenException for non-owner", async () => {
      mockPrisma.comment.findFirst.mockResolvedValue({
        id: "c1",
        postId: "p1",
        sessionId: "s-other",
      });

      await expect(
        service.update("p1", "c1", "s1", { content: "test" }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe("remove", () => {
    it("deletes own comment and decrements commentCount", async () => {
      mockPrisma.comment.findFirst.mockResolvedValue({
        id: "c1",
        postId: "p1",
        sessionId: "s1",
      });
      mockPrisma.$transaction.mockResolvedValue([{}, {}]);

      await service.remove("p1", "c1", "s1");

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it("throws ForbiddenException for non-owner", async () => {
      mockPrisma.comment.findFirst.mockResolvedValue({
        id: "c1",
        postId: "p1",
        sessionId: "s-other",
      });

      await expect(service.remove("p1", "c1", "s1")).rejects.toThrow(
        ForbiddenException,
      );
    });

    it("throws NotFoundException for non-existent comment", async () => {
      mockPrisma.comment.findFirst.mockResolvedValue(null);

      await expect(service.remove("p1", "c1", "s1")).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
