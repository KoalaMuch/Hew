import { Job } from "bullmq";
import pino from "pino";
import { prisma } from "@hew/db";

const log = pino({ name: "escrow-timeout" });

const ESCROW_TIMEOUT_HOURS = 48;

export async function escrowTimeoutProcessor(job: Job) {
  const { orderId } = job.data;

  log.info({ jobId: job.id, orderId }, "Checking escrow timeout");

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    log.warn({ orderId }, "Order not found");
    return { cancelled: false };
  }

  if (order.status !== "ESCROW_PENDING") {
    log.info({ orderId, status: order.status }, "Order not in ESCROW_PENDING, skipping");
    return { cancelled: false };
  }

  const hoursSinceCreation =
    (Date.now() - order.createdAt.getTime()) / (1000 * 60 * 60);

  if (hoursSinceCreation >= ESCROW_TIMEOUT_HOURS) {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED" },
    });
    log.info({ orderId }, "Order cancelled due to escrow timeout");
    return { cancelled: true };
  }

  return { cancelled: false };
}
