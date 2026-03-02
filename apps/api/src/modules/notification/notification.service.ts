import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  notifyInApp(sessionId: string, message: string, data?: Record<string, unknown>) {
    // Placeholder: log for now. WebSocket delivery when connected will be added later.
    console.log("[Notification] In-app:", { sessionId, message, data });
  }

  notifyEmail(email: string, subject: string, body: string) {
    // Placeholder: log for now. Real email service will be added later.
    console.log("[Notification] Email:", { email, subject, body });
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
