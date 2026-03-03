import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotFoundException } from "@nestjs/common";
import { UsersService } from "./users.service";

const mockPrisma = {
  session: {
    findUnique: vi.fn(),
  },
  post: {
    count: vi.fn(),
  },
  review: {
    count: vi.fn(),
    findMany: vi.fn(),
    aggregate: vi.fn(),
  },
};

describe("UsersService", () => {
  let service: UsersService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new UsersService(mockPrisma as any);
  });

  describe("getPublicProfile", () => {
    it("returns profile for session without registered user", async () => {
      const session = {
        id: "s1",
        displayName: "Asia",
        avatarSeed: "seed123",
        createdAt: new Date("2025-01-01"),
        registeredUser: null,
      };
      mockPrisma.session.findUnique.mockResolvedValue(session);
      mockPrisma.post.count.mockResolvedValue(5);
      mockPrisma.review.count.mockResolvedValue(0);
      mockPrisma.review.findMany.mockResolvedValue([]);

      const result = await service.getPublicProfile("s1");

      expect(result.sessionId).toBe("s1");
      expect(result.displayName).toBe("Asia");
      expect(result.isRegistered).toBe(false);
      expect(result.postCount).toBe(5);
      expect(result.rating).toBe(0);
      expect(result.reviewCount).toBe(0);
    });

    it("returns profile with registered user rating", async () => {
      const session = {
        id: "s1",
        displayName: "Asia",
        avatarSeed: "seed123",
        createdAt: new Date("2025-01-01"),
        registeredUser: {
          id: "u1",
          displayName: "Asia",
          rating: 4.5,
          reviewCount: 3,
        },
      };
      mockPrisma.session.findUnique.mockResolvedValue(session);
      mockPrisma.post.count.mockResolvedValue(2);
      mockPrisma.review.count.mockResolvedValue(3);
      mockPrisma.review.findMany.mockResolvedValue([
        {
          id: "r1",
          rating: 5,
          comment: "Great!",
          createdAt: new Date(),
          reviewerSession: {
            id: "s2",
            displayName: "Bob",
            avatarSeed: "bob",
          },
        },
      ]);

      const result = await service.getPublicProfile("s1");

      expect(result.isRegistered).toBe(true);
      expect(result.rating).toBe(4.5);
      expect(result.reviewCount).toBe(3);
      expect(result.reviews).toHaveLength(1);
      expect(result.reviews[0].rating).toBe(5);
    });

    it("throws NotFoundException for non-existent session", async () => {
      mockPrisma.session.findUnique.mockResolvedValue(null);

      await expect(service.getPublicProfile("nonexistent")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("computes average rating from reviews when no registered user", async () => {
      const session = {
        id: "s1",
        displayName: "Test",
        avatarSeed: "seed",
        createdAt: new Date(),
        registeredUser: null,
      };
      mockPrisma.session.findUnique.mockResolvedValue(session);
      mockPrisma.post.count.mockResolvedValue(0);
      mockPrisma.review.count.mockResolvedValue(2);
      mockPrisma.review.findMany.mockResolvedValue([]);
      mockPrisma.review.aggregate.mockResolvedValue({ _avg: { rating: 3.5 } });

      const result = await service.getPublicProfile("s1");

      expect(result.rating).toBe(3.5);
    });
  });
});
