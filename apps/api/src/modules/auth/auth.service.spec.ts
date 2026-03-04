import { describe, it, expect, vi, beforeEach } from "vitest";
import { BadRequestException, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "./auth.service";
import * as bcrypt from "bcryptjs";

vi.mock("bcryptjs", () => ({
  hash: vi.fn().mockResolvedValue("hashed_password"),
  compare: vi.fn(),
}));

const mockPrisma = {
  registeredUser: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  session: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
  },
};

describe("AuthService", () => {
  let service: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AuthService(mockPrisma as any);
  });

  describe("register", () => {
    it("creates a user and links session", async () => {
      const newUser = { id: "user-1", email: "a@b.com", displayName: "Alice" };
      mockPrisma.registeredUser.findUnique.mockResolvedValue(null);
      mockPrisma.registeredUser.create.mockResolvedValue(newUser);
      mockPrisma.session.update.mockResolvedValue({});

      const result = await service.register("session-1", {
        email: "a@b.com",
        password: "pass1234",
        displayName: "Alice",
      });

      expect(result).toEqual(newUser);
      expect(mockPrisma.registeredUser.create).toHaveBeenCalledWith({
        data: {
          email: "a@b.com",
          passwordHash: "hashed_password",
          displayName: "Alice",
        },
      });
      expect(mockPrisma.session.update).toHaveBeenCalledWith({
        where: { id: "session-1" },
        data: { registeredUserId: "user-1", displayName: "Alice" },
      });
    });

    it("throws when email already registered", async () => {
      mockPrisma.registeredUser.findUnique.mockResolvedValue({ id: "existing" });

      await expect(
        service.register("session-1", {
          email: "taken@b.com",
          password: "pass1234",
          displayName: "Bob",
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("login", () => {
    const user = {
      id: "user-1",
      email: "a@b.com",
      displayName: "Alice",
      passwordHash: "hashed",
      avatarUrl: "https://example.com/pic.jpg",
    };

    it("logs in and links session", async () => {
      mockPrisma.registeredUser.findUnique
        .mockResolvedValueOnce(user)
        .mockResolvedValueOnce({ avatarUrl: user.avatarUrl });
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
      mockPrisma.session.findFirst.mockResolvedValue(null);
      mockPrisma.session.update.mockResolvedValue({});

      const result = await service.login("session-1", {
        email: "a@b.com",
        password: "pass1234",
      });

      expect(result).toEqual({
        id: "user-1",
        email: "a@b.com",
        displayName: "Alice",
      });
    });

    it("disconnects existing session before linking new one", async () => {
      mockPrisma.registeredUser.findUnique
        .mockResolvedValueOnce(user)
        .mockResolvedValueOnce({ avatarUrl: null });
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
      mockPrisma.session.findFirst.mockResolvedValue({
        id: "old-session",
        registeredUserId: "user-1",
      });
      mockPrisma.session.update.mockResolvedValue({});

      await service.login("new-session", {
        email: "a@b.com",
        password: "pass1234",
      });

      expect(mockPrisma.session.update).toHaveBeenCalledWith({
        where: { id: "old-session" },
        data: { registeredUserId: null },
      });
      expect(mockPrisma.session.update).toHaveBeenCalledWith({
        where: { id: "new-session" },
        data: expect.objectContaining({ registeredUserId: "user-1" }),
      });
    });

    it("skips disconnect when same session is already linked", async () => {
      mockPrisma.registeredUser.findUnique
        .mockResolvedValueOnce(user)
        .mockResolvedValueOnce({ avatarUrl: null });
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
      mockPrisma.session.findFirst.mockResolvedValue({
        id: "session-1",
        registeredUserId: "user-1",
      });
      mockPrisma.session.update.mockResolvedValue({});

      await service.login("session-1", {
        email: "a@b.com",
        password: "pass1234",
      });

      expect(mockPrisma.session.update).toHaveBeenCalledTimes(1);
      expect(mockPrisma.session.update).toHaveBeenCalledWith({
        where: { id: "session-1" },
        data: expect.objectContaining({ registeredUserId: "user-1" }),
      });
    });

    it("throws for non-existent user", async () => {
      mockPrisma.registeredUser.findUnique.mockResolvedValue(null);

      await expect(
        service.login("session-1", { email: "no@one.com", password: "x" }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("throws for wrong password", async () => {
      mockPrisma.registeredUser.findUnique.mockResolvedValue(user);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      await expect(
        service.login("session-1", { email: "a@b.com", password: "wrong" }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe("loginWithOAuth", () => {
    const googleProfile = {
      provider: "google" as const,
      providerId: "g-123",
      email: "alice@gmail.com",
      displayName: "Alice",
      avatarUrl: "https://lh3.google.com/photo",
    };

    it("links existing user by provider ID to session", async () => {
      const existingUser = {
        id: "user-1",
        displayName: "Alice",
        email: "alice@gmail.com",
        avatarUrl: "https://existing.com/pic.jpg",
      };
      mockPrisma.registeredUser.findFirst.mockResolvedValue(existingUser);
      mockPrisma.session.findFirst.mockResolvedValue(null);
      mockPrisma.registeredUser.findUnique.mockResolvedValue({
        avatarUrl: existingUser.avatarUrl,
      });
      mockPrisma.session.update.mockResolvedValue({});

      const result = await service.loginWithOAuth("session-1", googleProfile);

      expect(result).toEqual({ id: "user-1", displayName: "Alice" });
      expect(mockPrisma.session.update).toHaveBeenCalledWith({
        where: { id: "session-1" },
        data: expect.objectContaining({ registeredUserId: "user-1" }),
      });
    });

    it("disconnects old session when user logs in from new session", async () => {
      const existingUser = {
        id: "user-1",
        displayName: "Alice",
        email: "alice@gmail.com",
        avatarUrl: null,
      };
      mockPrisma.registeredUser.findFirst.mockResolvedValue(existingUser);
      mockPrisma.session.findFirst.mockResolvedValue({
        id: "old-session",
        registeredUserId: "user-1",
      });
      mockPrisma.registeredUser.findUnique.mockResolvedValue({ avatarUrl: null });
      mockPrisma.registeredUser.update.mockResolvedValue(existingUser);
      mockPrisma.session.update.mockResolvedValue({});

      await service.loginWithOAuth("new-session", googleProfile);

      expect(mockPrisma.session.update).toHaveBeenCalledWith({
        where: { id: "old-session" },
        data: { registeredUserId: null },
      });
      expect(mockPrisma.session.update).toHaveBeenCalledWith({
        where: { id: "new-session" },
        data: expect.objectContaining({ registeredUserId: "user-1" }),
      });
    });

    it("skips disconnect when same session is already linked", async () => {
      const existingUser = {
        id: "user-1",
        displayName: "Alice",
        email: "alice@gmail.com",
        avatarUrl: "pic.jpg",
      };
      mockPrisma.registeredUser.findFirst.mockResolvedValue(existingUser);
      mockPrisma.session.findFirst.mockResolvedValue({
        id: "session-1",
        registeredUserId: "user-1",
      });
      mockPrisma.registeredUser.findUnique.mockResolvedValue({ avatarUrl: "pic.jpg" });
      mockPrisma.session.update.mockResolvedValue({});

      await service.loginWithOAuth("session-1", googleProfile);

      expect(mockPrisma.session.update).toHaveBeenCalledTimes(1);
    });

    it("creates new user when no existing user matches provider ID or email", async () => {
      mockPrisma.registeredUser.findFirst.mockResolvedValue(null);
      mockPrisma.registeredUser.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ avatarUrl: "https://lh3.google.com/photo" });
      mockPrisma.registeredUser.create.mockResolvedValue({
        id: "new-user",
        displayName: "Alice",
        email: "alice@gmail.com",
      });
      mockPrisma.session.findFirst.mockResolvedValue(null);
      mockPrisma.session.update.mockResolvedValue({});

      const result = await service.loginWithOAuth("session-1", googleProfile);

      expect(result).toEqual({ id: "new-user", displayName: "Alice" });
      expect(mockPrisma.registeredUser.create).toHaveBeenCalledWith({
        data: {
          googleId: "g-123",
          email: "alice@gmail.com",
          displayName: "Alice",
          avatarUrl: "https://lh3.google.com/photo",
        },
      });
    });

    it("links provider ID to existing email-matched user", async () => {
      const emailUser = {
        id: "user-email",
        displayName: "Alice Email",
        email: "alice@gmail.com",
        avatarUrl: null,
      };
      mockPrisma.registeredUser.findFirst.mockResolvedValue(null);
      mockPrisma.registeredUser.findUnique
        .mockResolvedValueOnce(emailUser)
        .mockResolvedValueOnce({ avatarUrl: "https://lh3.google.com/photo" });
      mockPrisma.registeredUser.update.mockResolvedValue({
        ...emailUser,
        googleId: "g-123",
        avatarUrl: "https://lh3.google.com/photo",
      });
      mockPrisma.session.findFirst.mockResolvedValue(null);
      mockPrisma.session.update.mockResolvedValue({});

      await service.loginWithOAuth("session-1", googleProfile);

      expect(mockPrisma.registeredUser.update).toHaveBeenCalledWith({
        where: { id: "user-email" },
        data: {
          googleId: "g-123",
          avatarUrl: "https://lh3.google.com/photo",
        },
      });
    });

    it("creates user without email when profile has no email", async () => {
      const noEmailProfile = {
        provider: "line" as const,
        providerId: "line-456",
        displayName: "Line User",
        avatarUrl: "https://line.me/pic.jpg",
      };
      mockPrisma.registeredUser.findFirst.mockResolvedValue(null);
      mockPrisma.registeredUser.create.mockResolvedValue({
        id: "new-line-user",
        displayName: "Line User",
        email: null,
      });
      mockPrisma.registeredUser.findUnique.mockResolvedValue({
        avatarUrl: "https://line.me/pic.jpg",
      });
      mockPrisma.session.findFirst.mockResolvedValue(null);
      mockPrisma.session.update.mockResolvedValue({});

      const result = await service.loginWithOAuth("session-1", noEmailProfile);

      expect(result).toEqual({ id: "new-line-user", displayName: "Line User" });
      expect(mockPrisma.registeredUser.create).toHaveBeenCalledWith({
        data: {
          lineId: "line-456",
          displayName: "Line User",
          avatarUrl: "https://line.me/pic.jpg",
        },
      });
    });

    it("updates avatar when existing user has none", async () => {
      const existingUser = {
        id: "user-1",
        displayName: "Alice",
        email: "alice@gmail.com",
        avatarUrl: null,
      };
      mockPrisma.registeredUser.findFirst.mockResolvedValue(existingUser);
      mockPrisma.registeredUser.update.mockResolvedValue(existingUser);
      mockPrisma.registeredUser.findUnique.mockResolvedValue({ avatarUrl: null });
      mockPrisma.session.findFirst.mockResolvedValue(null);
      mockPrisma.session.update.mockResolvedValue({});

      await service.loginWithOAuth("session-1", googleProfile);

      expect(mockPrisma.registeredUser.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { avatarUrl: "https://lh3.google.com/photo" },
      });
    });
  });

  describe("getProfile", () => {
    it("returns profile with merged data", async () => {
      mockPrisma.session.findUnique.mockResolvedValue({
        id: "session-1",
        displayName: "Alice",
        avatarSeed: "seed",
        avatarUrl: null,
        registeredUser: {
          id: "user-1",
          email: "a@b.com",
          displayName: "Alice",
          avatarUrl: "https://pic.jpg",
          googleId: "g-123",
          role: "USER",
          rating: 4.5,
          reviewCount: 10,
          createdAt: new Date("2025-01-01"),
        },
      });

      const result = await service.getProfile("session-1");

      expect(result).toEqual(
        expect.objectContaining({
          sessionId: "session-1",
          isRegistered: true,
          avatarUrl: "https://pic.jpg",
        }),
      );
    });

    it("returns null for non-existent session", async () => {
      mockPrisma.session.findUnique.mockResolvedValue(null);

      const result = await service.getProfile("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("logout", () => {
    it("unlinks session from user", async () => {
      mockPrisma.session.update.mockResolvedValue({});

      await service.logout("session-1");

      expect(mockPrisma.session.update).toHaveBeenCalledWith({
        where: { id: "session-1" },
        data: { registeredUserId: null },
      });
    });
  });
});
