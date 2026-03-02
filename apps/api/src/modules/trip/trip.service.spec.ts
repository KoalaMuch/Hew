import { describe, it, expect, vi, beforeEach } from "vitest";
import { TripService } from "./trip.service";
import { NotFoundException, ForbiddenException } from "@nestjs/common";

const mockPrisma = {
  trip: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
};

describe("TripService", () => {
  let service: TripService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TripService(mockPrisma as any);
  });

  describe("create", () => {
    it("creates a trip for a session", async () => {
      const tripData = { country: "Japan", city: "Tokyo" };
      const mockTrip = { id: "trip-1", sessionId: "session-1", ...tripData };
      mockPrisma.trip.create.mockResolvedValue(mockTrip);

      const result = await service.create("session-1", tripData);
      expect(result).toEqual(mockTrip);
      expect(mockPrisma.trip.create).toHaveBeenCalledWith({
        data: { ...tripData, sessionId: "session-1" },
      });
    });
  });

  describe("findById", () => {
    it("returns trip by id", async () => {
      const mockTrip = { id: "trip-1", country: "Japan" };
      mockPrisma.trip.findUnique.mockResolvedValue(mockTrip);

      const result = await service.findById("trip-1");
      expect(result).toEqual(mockTrip);
    });

    it("throws NotFoundException when trip not found", async () => {
      mockPrisma.trip.findUnique.mockResolvedValue(null);

      await expect(service.findById("nonexistent")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("update", () => {
    it("updates trip owned by session", async () => {
      const mockTrip = { id: "trip-1", sessionId: "session-1" };
      mockPrisma.trip.findUnique.mockResolvedValue(mockTrip);
      mockPrisma.trip.update.mockResolvedValue({
        ...mockTrip,
        city: "Osaka",
      });

      const result = await service.update("trip-1", "session-1", {
        city: "Osaka",
      });
      expect(result.city).toBe("Osaka");
    });

    it("throws ForbiddenException when not owner", async () => {
      const mockTrip = { id: "trip-1", sessionId: "session-1" };
      mockPrisma.trip.findUnique.mockResolvedValue(mockTrip);

      await expect(
        service.update("trip-1", "other-session", { city: "Osaka" }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe("findAll", () => {
    it("returns paginated trips", async () => {
      const mockTrips = [
        { id: "trip-1", country: "Japan" },
        { id: "trip-2", country: "Korea" },
      ];
      mockPrisma.trip.findMany.mockResolvedValue(mockTrips);
      mockPrisma.trip.count.mockResolvedValue(2);

      const result = await service.findAll({ page: 1, limit: 20 });
      expect(result.data).toEqual(mockTrips);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it("filters by country", async () => {
      mockPrisma.trip.findMany.mockResolvedValue([]);
      mockPrisma.trip.count.mockResolvedValue(0);

      await service.findAll({ country: "Japan", page: 1, limit: 20 });
      expect(mockPrisma.trip.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            country: "Japan",
          }),
        }),
      );
    });
  });
});
