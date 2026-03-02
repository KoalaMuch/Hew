import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { ItemRequestStatus } from "@hew/db";
import { PrismaService } from "../../common/prisma.service";
import type { CreateItemRequestInput } from "@hew/shared";

@Injectable()
export class ItemRequestService {
  constructor(private readonly prisma: PrismaService) {}

  async create(sessionId: string, data: CreateItemRequestInput) {
    return this.prisma.itemRequest.create({
      data: {
        sessionId,
        title: data.title,
        description: data.description,
        imageUrls: data.imageUrls ?? [],
        countries: data.countries,
        maxBudget: data.maxBudget,
      },
    });
  }

  async findAll(filters: {
    country?: string;
    status?: ItemRequestStatus;
    page?: number;
    limit?: number;
  }) {
    const { country, status, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: { countries?: { has: string }; status?: ItemRequestStatus } =
      {};
    if (country) where.countries = { has: country };
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.itemRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.itemRequest.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findById(id: string) {
    const itemRequest = await this.prisma.itemRequest.findUnique({
      where: { id },
      include: { offers: true },
    });
    if (!itemRequest) {
      throw new NotFoundException("Item request not found");
    }
    return itemRequest;
  }

  async update(
    id: string,
    sessionId: string,
    data: Partial<CreateItemRequestInput>,
  ) {
    const itemRequest = await this.findById(id);
    if (itemRequest.sessionId !== sessionId) {
      throw new ForbiddenException("Not the owner of this item request");
    }

    return this.prisma.itemRequest.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.imageUrls !== undefined && { imageUrls: data.imageUrls }),
        ...(data.countries !== undefined && { countries: data.countries }),
        ...(data.maxBudget !== undefined && { maxBudget: data.maxBudget }),
      },
    });
  }
}
