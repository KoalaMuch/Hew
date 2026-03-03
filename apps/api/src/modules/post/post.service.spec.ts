import { describe, it, expect, vi, beforeEach } from "vitest";
import { PostService } from "./post.service";

const mockPrisma = {
  post: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  postHashtag: {
    findMany: vi.fn(),
    upsert: vi.fn(),
  },
};

describe("PostService", () => {
  let service: PostService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PostService(mockPrisma as any);
  });

  describe("searchHashtags", () => {
    it("returns trending hashtags when query is empty", async () => {
      const trending = [
        { id: "1", name: "#japan", count: 10 },
        { id: "2", name: "#tokyo", count: 5 },
      ];
      mockPrisma.postHashtag.findMany.mockResolvedValue(trending);

      const result = await service.searchHashtags("", 8);

      expect(result).toEqual(trending);
      expect(mockPrisma.postHashtag.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { count: { gt: 0 } },
          orderBy: { count: "desc" },
          take: 8,
        }),
      );
    });

    it("returns matching hashtags for query", async () => {
      const matches = [{ id: "1", name: "#japan", count: 10 }];
      mockPrisma.postHashtag.findMany.mockResolvedValue(matches);

      const result = await service.searchHashtags("jap", 8);

      expect(result).toEqual(matches);
      expect(mockPrisma.postHashtag.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            name: { contains: "jap", mode: "insensitive" },
            count: { gt: 0 },
          },
          orderBy: { count: "desc" },
          take: 8,
        }),
      );
    });

    it("strips # prefix from query", async () => {
      mockPrisma.postHashtag.findMany.mockResolvedValue([]);

      await service.searchHashtags("#jap", 5);

      expect(mockPrisma.postHashtag.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: { contains: "jap", mode: "insensitive" },
          }),
        }),
      );
    });

    it("caps limit at 20", async () => {
      mockPrisma.postHashtag.findMany.mockResolvedValue([]);

      await service.searchHashtags("x", 100);

      expect(mockPrisma.postHashtag.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 20 }),
      );
    });
  });
});
