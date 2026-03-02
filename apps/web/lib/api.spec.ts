import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  setSessionToken,
  getOAuthUrl,
} from "./api";

describe("API Client", () => {
  describe("setSessionToken / getOAuthUrl", () => {
    afterEach(() => {
      setSessionToken(null);
      delete (window as unknown as Record<string, unknown>).__ENV;
    });

    it("returns OAuth URL with session token", () => {
      setSessionToken("test-session-123");
      const url = getOAuthUrl("google");
      expect(url).toContain("/auth/google");
      expect(url).toContain("session=test-session-123");
    });

    it("returns OAuth URL with empty session when no token", () => {
      setSessionToken(null);
      const url = getOAuthUrl("line");
      expect(url).toContain("/auth/line");
      expect(url).toContain("session=");
    });

    it("returns correct URL for each provider", () => {
      setSessionToken("s1");
      expect(getOAuthUrl("google")).toContain("/auth/google");
      expect(getOAuthUrl("line")).toContain("/auth/line");
      expect(getOAuthUrl("facebook")).toContain("/auth/facebook");
      expect(getOAuthUrl("apple")).toContain("/auth/apple");
    });

    it("uses dev fallback URL when window.__ENV is not set", () => {
      setSessionToken("s1");
      const url = getOAuthUrl("google");
      expect(url).toBe("http://localhost:3000/api/auth/google?session=s1");
    });

    it("uses runtime API_URL from window.__ENV when available", () => {
      (window as unknown as Record<string, unknown>).__ENV = {
        API_URL: "https://api.rubhew.com/api",
      };
      setSessionToken("s1");
      const url = getOAuthUrl("google");
      expect(url).toBe("https://api.rubhew.com/api/auth/google?session=s1");
    });
  });

  describe("fetchApi (via exported functions)", () => {
    const originalFetch = globalThis.fetch;

    beforeEach(() => {
      setSessionToken("test-session");
    });

    afterEach(() => {
      globalThis.fetch = originalFetch;
      setSessionToken(null);
      delete (window as unknown as Record<string, unknown>).__ENV;
    });

    it("throws on non-ok response with error message from body", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: () => Promise.resolve({ message: "Validation failed" }),
      });

      const { getTrips } = await import("./api");

      await expect(getTrips()).rejects.toThrow("Validation failed");
    });

    it("throws statusText when response body is not JSON", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: () => Promise.reject(new Error("not json")),
      });

      const { getTrips } = await import("./api");

      await expect(getTrips()).rejects.toThrow("Internal Server Error");
    });

    it("returns undefined for 204 responses", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
        json: () => Promise.resolve(undefined),
      });

      const { logout } = await import("./api");

      const result = await logout();
      expect(result).toBeUndefined();
    });

    it("sends session header when token is set", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: [], total: 0, page: 1, limit: 20 }),
      });

      const { getTrips } = await import("./api");
      await getTrips();

      const fetchCall = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(fetchCall[1].headers["X-Session-Id"]).toBe("test-session");
    });

    it("passes query parameters correctly", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: [], total: 0, page: 1, limit: 20 }),
      });

      const { getTrips } = await import("./api");
      await getTrips({ country: "Japan", page: 2, limit: 10 });

      const fetchCall = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const url = fetchCall[0] as string;
      expect(url).toContain("country=Japan");
      expect(url).toContain("page=2");
      expect(url).toContain("limit=10");
    });

    it("omits undefined and null query parameters", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: [], total: 0, page: 1, limit: 20 }),
      });

      const { getTrips } = await import("./api");
      await getTrips({ country: undefined, page: undefined });

      const fetchCall = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const url = fetchCall[0] as string;
      expect(url).not.toContain("country");
      expect(url).not.toContain("page");
    });

    it("uses runtime API_URL from window.__ENV for fetch calls", async () => {
      (window as unknown as Record<string, unknown>).__ENV = {
        API_URL: "https://api.rubhew.com/api",
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: [], total: 0, page: 1, limit: 20 }),
      });

      const { getTrips } = await import("./api");
      await getTrips();

      const fetchCall = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const url = fetchCall[0] as string;
      expect(url.startsWith("https://api.rubhew.com/api")).toBe(true);
    });
  });
});
