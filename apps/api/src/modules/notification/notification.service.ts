import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly prisma: PrismaService) {}

  notifyInApp(sessionId: string, message: string, data?: Record<string, unknown>) {
    this.logger.log({ msg: "In-app notification", sessionId, message, data });
  }

  notifyEmail(email: string, subject: string, body: string) {
    this.logger.log({ msg: "Email notification", email, subject, bodyLength: body.length });
  }

  async notifyOrderUpdate(orderId: string, event: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        buyerSession: { select: { id: true } },
        travelerSession: { select: { id: true } },
      },
    });

    if (!order) return;

    const payload = { orderId, event };
    this.notifyInApp(order.buyerSessionId, `Order ${event}`, payload);
    this.notifyInApp(order.travelerSessionId, `Order ${event}`, payload);
  }
}
