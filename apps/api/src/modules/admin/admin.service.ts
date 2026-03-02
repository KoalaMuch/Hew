import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { OrderStatus } from "@hew/db";
import { PrismaService } from "../../common/prisma.service";
import { DisputeService } from "../dispute/dispute.service";

export interface ListOrdersParams {
  page?: number;
  limit?: number;
  status?: OrderStatus;
}

export interface ListSessionsParams {
  page?: number;
  limit?: number;
}

export interface ResolveDisputeBody {
  resolution: string;
  status: "RESOLVED_BUYER" | "RESOLVED_TRAVELER";
}

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly disputeService: DisputeService,
  ) {}

  async listOrders(params: ListOrdersParams) {
    const page = params.page ?? 0;
    const limit = Math.min(params.limit ?? 20, 100);
    const skip = page * limit;

    const where = params.status ? { status: params.status } : {};

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          offer: true,
          escrowPayment: true,
          shipment: true,
          payout: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return { data: orders, total, page, limit };
  }

  async getOrder(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        offer: true,
        escrowPayment: true,
        shipment: true,
        payout: true,
        disputes: true,
        reviews: true,
      },
    });

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    return order;
  }

  async listSessions(params: ListSessionsParams) {
    const page = params.page ?? 0;
    const limit = Math.min(params.limit ?? 20, 100);
    const skip = page * limit;

    const [sessions, total] = await Promise.all([
      this.prisma.session.findMany({
        include: { registeredUser: true },
        orderBy: { lastActiveAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.session.count(),
    ]);

    return { data: sessions, total, page, limit };
  }

  async listDisputes() {
    return this.prisma.dispute.findMany({
      include: {
        order: { include: { offer: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async resolveDispute(id: string, body: ResolveDisputeBody) {
    return this.disputeService.resolve(id, body.resolution, body.status);
  }

  async listPayouts() {
    return this.prisma.payout.findMany({
      include: {
        order: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async retryPayout(id: string) {
    const payout = await this.prisma.payout.findUnique({
      where: { id },
    });

    if (!payout) {
      throw new NotFoundException("Payout not found");
    }

    if (payout.status !== "FAILED") {
      throw new Error("Can only retry failed payouts");
    }

    // Placeholder: actual retry logic would integrate with payment provider
    return this.prisma.payout.update({
      where: { id },
      data: { status: "PENDING" },
      include: { order: true },
    });
  }
}
