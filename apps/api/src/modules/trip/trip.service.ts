import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { TripStatus } from "@hew/db";
import { PrismaService } from "../../common/prisma.service";
import type { CreateTripInput } from "@hew/shared";

@Injectable()
export class TripService {
  constructor(private readonly prisma: PrismaService) {}

  async create(sessionId: string, data: CreateTripInput) {
    return this.prisma.trip.create({
      data: {
        sessionId,
        country: data.country,
        city: data.city,
        departureDate: data.departureDate
          ? new Date(data.departureDate)
          : undefined,
        returnDate: data.returnDate ? new Date(data.returnDate) : undefined,
        description: data.description,
      },
    });
  }

  async findAll(filters: {
    country?: string;
    status?: TripStatus;
    page?: number;
    limit?: number;
  }) {
    const { country, status, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: { country?: string; status?: TripStatus } = {};
    if (country) where.country = country;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.trip.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.trip.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findById(id: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id },
    });
    if (!trip) {
      throw new NotFoundException("Trip not found");
    }
    return trip;
  }

  async update(
    id: string,
    sessionId: string,
    data: Partial<CreateTripInput>,
  ) {
    const trip = await this.findById(id);
    if (trip.sessionId !== sessionId) {
      throw new ForbiddenException("Not the owner of this trip");
    }

    return this.prisma.trip.update({
      where: { id },
      data: {
        ...(data.country !== undefined && { country: data.country }),
        ...(data.city !== undefined && { city: data.city }),
        ...(data.departureDate !== undefined && {
          departureDate: new Date(data.departureDate),
        }),
        ...(data.returnDate !== undefined && {
          returnDate: new Date(data.returnDate),
        }),
        ...(data.description !== undefined && { description: data.description }),
      },
    });
  }

  async cancel(id: string, sessionId: string) {
    const trip = await this.findById(id);
    if (trip.sessionId !== sessionId) {
      throw new ForbiddenException("Not the owner of this trip");
    }

    return this.prisma.trip.update({
      where: { id },
      data: { status: "CANCELLED" },
    });
  }
}
