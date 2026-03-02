import { Job } from "bullmq";
import pino from "pino";
import { prisma } from "@hew/db";

const log = pino({ name: "payout-release" });

export async function payoutReleaseProcessor(job: Job) {
  const { payoutId } = job.data;

  log.info({ jobId: job.id, payoutId }, "Processing payout release");

  // MVP: update payout status to COMPLETED
  const existing = await prisma.payout.findUnique({ where: { id: payoutId } });
  if (!existing) {
    log.warn({ payoutId }, "Payout not found");
    return { processed: false };
  }

  const payout = await prisma.payout.update({
    where: { id: payoutId },
    data: {
      status: "COMPLETED",
      processedAt: new Date(),
    },
  });

  await prisma.order.update({
    where: { id: payout.orderId },
    data: { status: "PAYOUT_RELEASED" },
  });

  log.info({ payoutId }, "Payout released");

  return { processed: true };
}
