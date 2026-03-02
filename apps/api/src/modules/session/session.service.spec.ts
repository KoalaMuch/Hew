import { describe, it, expect, vi, beforeEach } from "vitest";
import { SessionService } from "./session.service";

const mockPrisma = {
  session: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
};

describe("SessionService", () => {
  let service: SessionService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new SessionService(mockPrisma as any);
  });

  describe("createSession", () => {
    it("creates a session without fingerprint", async () => {
      const mockSession = {
        id: "test-session-id",
        displayName: "Anonymous",
        avatarSeed: "seed123",
        deviceFingerprint: null,
        registeredUserId: null,
        createdAt: new Date(),
        lastActiveAt: new Date(),
      };
      mockPrisma.session.create.mockResolvedValue(mockSession);

      const result = await service.createSession();
      expect(mockPrisma.session.create).toHaveBeenCalledWith({ data: {} });
      expect(result).toEqual(mockSession);
    });

    it("creates a session with fingerprint", async () => {
      const mockSession = {
        id: "test-session-id",
        deviceFingerprint: "fp_123",
        displayName: "Anonymous",
      };
      mockPrisma.session.create.mockResolvedValue(mockSession);

      await service.createSession("fp_123");
      expect(mockPrisma.session.create).toHaveBeenCalledWith({
        data: { deviceFingerprint: "fp_123" },
      });
    });
  });

  describe("getSession", () => {
    it("returns session by id", async () => {
      const mockSession = { id: "session-1", displayName: "Test" };
      mockPrisma.session.findUnique.mockResolvedValue(mockSession);

      const result = await service.getSession("session-1");
      expect(mockPrisma.session.findUnique).toHaveBeenCalledWith({
        where: { id: "session-1" },
      });
      expect(result).toEqual(mockSession);
    });

    it("returns null for non-existent session", async () => {
      mockPrisma.session.findUnique.mockResolvedValue(null);

      const result = await service.getSession("nonexistent");
      expect(result).toBeNull();
    });
  });

  describe("updateSession", () => {
    it("updates display name", async () => {
      const updated = { id: "session-1", displayName: "NewName" };
      mockPrisma.session.update.mockResolvedValue(updated);

      const result = await service.updateSession("session-1", {
        displayName: "NewName",
      });
      expect(mockPrisma.session.update).toHaveBeenCalledWith({
        where: { id: "session-1" },
        data: { displayName: "NewName" },
      });
      expect(result).toEqual(updated);
    });
  });
});
